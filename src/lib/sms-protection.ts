/**
 * Bridge to the MoneyGuard automatic SMS module.
 *
 * The native module only exists in an Android development/production build.
 * Expo Go, iOS and the web deliberately fall back to `null` so the rest of the
 * app can keep working without pretending that automatic SMS monitoring is on.
 */

import { requireOptionalNativeModule } from 'expo';
import type { NativeModule } from 'expo';
import { PermissionsAndroid, Platform } from 'react-native';

import type {
  AnalyzeResult,
  MoneyGuardSmsEvents,
  NativeDetection,
  NativeSettings,
} from '../../modules/moneyguard-sms/src/MoneyGuardSms.types';

export declare class MoneyGuardSmsModule extends NativeModule<MoneyGuardSmsEvents> {
  getDetections(): Promise<NativeDetection[]>;
  getDetection(id: string): Promise<NativeDetection | null>;
  deleteDetection(id: string): Promise<void>;
  getSettings(): Promise<NativeSettings>;
  setSettings(
    monitoringEnabled: boolean,
    fraudAlertsEnabled: boolean,
    notifyOnAnalysisFailure: boolean,
  ): Promise<void>;
  setMonitoringEnabled(enabled: boolean): Promise<void>;
  clearDetections(): Promise<void>;
  deleteAllData(): Promise<void>;
  hasSmsPermission(): Promise<boolean>;
  hasNotificationPermission(): Promise<boolean>;
  analyzeMessage(message: string, sender: string): Promise<AnalyzeResult>;
}

export const nativeSms =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<MoneyGuardSmsModule>('MoneyGuardSms')
    : null;

export const isAutomaticProtectionSupported = nativeSms !== null;

export async function hasSmsPermission(): Promise<boolean> {
  if (!nativeSms) return false;
  try {
    return await nativeSms.hasSmsPermission();
  } catch {
    return false;
  }
}

export async function requestSmsPermission(): Promise<boolean> {
  if (!nativeSms) return false;
  if (await hasSmsPermission()) return true;
  if (Platform.OS !== 'android') return false;

  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      {
        title: 'Allow MoneyGuard to check incoming SMS',
        message:
          'MoneyGuard reads incoming carrier SMS messages on this phone to check them for mobile money fraud. Messages stay on the device. MoneyGuard does not replace your SMS app or read your inbox.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!nativeSms) return false;
  try {
    return await nativeSms.hasNotificationPermission();
  } catch {
    return false;
  }
}

export async function requestProtectionNotificationPermission(): Promise<boolean> {
  if (!nativeSms) return false;
  if (await hasNotificationPermission()) return true;
  if (Platform.OS !== 'android') return false;

  try {
    if (typeof Platform.Version === 'number' && Platform.Version < 33) return true;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Allow MoneyGuard security alerts',
        message:
          'MoneyGuard needs notification access to warn you immediately when an incoming SMS looks fraudulent.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function getNativeSettings(): Promise<NativeSettings | null> {
  if (!nativeSms) return null;
  try {
    return await nativeSms.getSettings();
  } catch {
    return null;
  }
}

export async function getNativeDetections(): Promise<NativeDetection[]> {
  if (!nativeSms) return [];
  try {
    return await nativeSms.getDetections();
  } catch {
    return [];
  }
}

export async function getNativeDetection(id: string): Promise<NativeDetection | null> {
  if (!nativeSms) return null;
  try {
    return await nativeSms.getDetection(id);
  } catch {
    return null;
  }
}

export async function deleteNativeDetection(id: string): Promise<void> {
  if (!nativeSms) return;
  await nativeSms.deleteDetection(id);
}

export async function clearNativeDetections(): Promise<void> {
  if (!nativeSms) return;
  await nativeSms.clearDetections();
}

export async function deleteNativeDeviceData(): Promise<void> {
  if (!nativeSms) return;
  await nativeSms.deleteAllData();
}

export async function setNativeMonitoringEnabled(enabled: boolean): Promise<void> {
  if (!nativeSms) return;
  await nativeSms.setMonitoringEnabled(enabled);
}

export async function setNativeSettings(settings: NativeSettings): Promise<void> {
  if (!nativeSms) return;
  await nativeSms.setSettings(
    settings.monitoringEnabled,
    settings.fraudAlertsEnabled,
    settings.notifyOnAnalysisFailure,
  );
}
