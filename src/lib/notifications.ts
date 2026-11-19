import {
  AndroidImportance,
  IosAuthorizationStatus,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  type NotificationResponse,
} from 'expo-notifications';
import { Platform } from 'react-native';

import type { ScanRecord } from '@/types';
import { truncate } from '@/lib/format';

const CHANNEL_ID = 'moneyguard-alerts';

export interface SafetyAlert {
  id: string;
  category: 'scam-alert' | 'tip' | 'update';
  title: string;
  body: string;
  /** Days before today, used to build a stable published date. */
  relativeDays: number;
  href?: string;
}

export const SAFETY_ALERTS: SafetyAlert[] = [
  {
    id: 'alert-pin',
    category: 'scam-alert',
    title: 'New PIN-phishing wave reported',
    body: 'Scammers are sending SMS claiming your wallet is blocked and asking you to reply with your PIN. Never reply — open your provider menu instead.',
    relativeDays: 0,
    href: '/learn/pin-harvesting',
  },
  {
    id: 'alert-reversal',
    category: 'scam-alert',
    title: 'Fake reversal messages circulating',
    body: 'A message claims money was sent to you by mistake and asks for a refund. Check your real balance first; reversals are handled by the provider.',
    relativeDays: 2,
    href: '/learn/fake-reversal',
  },
  {
    id: 'alert-prize',
    category: 'tip',
    title: 'Rule of thumb: no fee to receive money',
    body: 'Any prize, grant, or payout that requires an up-front payment is a scam. Genuine money never comes with a release fee.',
    relativeDays: 4,
    href: '/learn/miracle-money',
  },
  {
    id: 'alert-family',
    category: 'tip',
    title: 'Verify family emergencies by calling back',
    body: 'If a new number claims to be a relative in trouble, call their saved number before sending airtime or money.',
    relativeDays: 6,
    href: '/learn/urgent-family',
  },
  {
    id: 'alert-offline',
    category: 'update',
    title: 'Scans work without internet',
    body: 'The MoneyGuard model is stored on your phone. Your SMS text is never uploaded to a server.',
    relativeDays: 9,
  },
];

export function alertPublishedAt(alert: SafetyAlert): string {
  const date = new Date();
  date.setDate(date.getDate() - alert.relativeDays);
  date.setHours(8, 0, 0, 0);
  return date.toISOString();
}

export function unreadAlertCount(seenAt: string | null): number {
  if (!seenAt) return SAFETY_ALERTS.length;
  const seen = new Date(seenAt).getTime();
  if (Number.isNaN(seen)) return SAFETY_ALERTS.length;
  return SAFETY_ALERTS.filter(
    (alert) => new Date(alertPublishedAt(alert)).getTime() > seen,
  ).length;
}

let configured: Promise<void> | null = null;

/**
 * Configure local notifications once. Channel creation is best-effort: some
 * Android devices/ROMs reject optional channel fields, and a failed channel
 * must never crash the app or block a scan.
 */
export function configureNotifications(): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();

  if (!configured) {
    configured = (async () => {
      try {
        setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });

        if (Platform.OS === 'android') {
          // Keep this to the two required fields. Optional fields such as
          // vibrationPattern and lightColor have triggered native channel
          // errors on some Android versions.
          await setNotificationChannelAsync(CHANNEL_ID, {
            name: 'Scam alerts',
            importance: AndroidImportance.HIGH,
          });
        }
      } catch (error) {
        // Allow a later attempt (for example from the test-notification
        // button) while keeping startup resilient.
        configured = null;
        console.warn('MoneyGuard could not configure notifications.', error);
      }
    })();
  }

  return configured;
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const settings = await getPermissionsAsync();
    return (
      settings.granted ||
      settings.ios?.status === IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await configureNotifications();
  try {
    const existing = await getPermissionsAsync();
    if (
      existing.granted ||
      existing.ios?.status === IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }
    const requested = await requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return Boolean(requested.granted);
  } catch {
    return false;
  }
}

/** Show an immediate local notification for a fraudulent scan. */
export async function notifyFraudScan(scan: ScanRecord): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await scheduleNotificationAsync({
      content: {
        title: '⚠️ Possible scam detected',
        body: truncate(scan.message, 110),
        data: { url: `/result/${scan.id}` },
        sound: false,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: null,
    });
  } catch {
    // Notifications are a convenience; a failure must never block a scan.
  }
}

export async function sendTestNotification(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const allowed = await requestNotificationPermission();
  if (!allowed) return false;
  await configureNotifications();
  try {
    await scheduleNotificationAsync({
      content: {
        title: 'MoneyGuard alerts are on',
        body: 'You will be warned when a scanned message looks like a scam.',
        sound: false,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}

export function extractNotificationUrl(
  response: NotificationResponse | null | undefined,
): string | undefined {
  const url = response?.notification.request.content.data?.url;
  return typeof url === 'string' ? url : undefined;
}

