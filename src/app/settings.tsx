import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import {
  AppText,
  Badge,
  Button,
  Callout,
  Card,
  Chip,
  ListRow,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { pluralize } from '@/lib/format';
import { requestNotificationPermission } from '@/lib/notifications';
import { useApp } from '@/providers/app-provider';
import { useProtection } from '@/providers/protection-provider';
import type { ThemePreference } from '@/types';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const {
    user,
    isGuest,
    settings,
    updateSettings,
    scans,
    clearHistory,
    deleteAccount,
    signOut,
  } = useApp();
  const {
    supported,
    active,
    smsPermission,
    notificationPermission,
    monitoringEnabled,
    fraudAlertsEnabled,
    detections,
    setFraudAlertsEnabled,
    clearDetections,
    deleteDeviceData,
  } = useProtection();
  const [notice, setNotice] = useState('');
  const totalRecords = scans.length + detections.length;

  async function toggleNotifications(value: boolean) {
    setNotice('');
    if (value) {
      const allowed = await requestNotificationPermission();
      if (!allowed) {
        setNotice(
          'Notifications are blocked by your phone. Enable them in system settings to receive alerts for manual checks.',
        );
        return;
      }
    }
    await updateSettings({ notificationsEnabled: value });
  }

  function confirmClearHistory() {
    if (!totalRecords) return;
    Alert.alert(
      'Clear all detection history?',
      `This removes ${pluralize(totalRecords, 'saved record')} from this device, including automatic SMS detections and manual checks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            void clearHistory();
            void clearDetections();
          },
        },
      ],
    );
  }

  function confirmDeleteAccount() {
    Alert.alert(
      isGuest ? 'Delete guest profile?' : 'Delete your account?',
      isGuest
        ? 'This removes your guest profile, automatic detections and scan history from this device.'
        : 'This permanently deletes your local account, automatic detections and scan history. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDeviceData();
            await deleteAccount();
            router.replace('/welcome');
          },
        },
      ],
    );
  }

  function confirmSignOut() {
    Alert.alert('Sign out?', 'Your detections stay on this device and will be here when you return.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        onPress: async () => {
          await signOut();
          router.replace('/welcome');
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScreenHeader title="Settings" subtitle="Protection, appearance & privacy" />
      <ScreenScroll contentContainerStyle={{ gap: 16, paddingTop: 8 }}>
        {notice ? <Callout tone="warning" title="Notifications not enabled" body={notice} /> : null}

        <View style={{ gap: 10 }}>
          <SectionHeader title="Automatic protection" />
          <Card padded={false}>
            <ListRow
              icon="shield-checkmark-outline"
              title="SMS protection"
              subtitle={
                !supported
                  ? 'Automatic SMS monitoring is Android-only'
                  : active
                    ? 'Checking incoming SMS on this phone'
                    : 'Protection is not active'
              }
              value={!supported ? 'Limited' : active ? 'Active' : 'Inactive'}
              onPress={() => router.push('/protection')}
            />
            <ListRow
              icon="chatbox-ellipses-outline"
              title="SMS permission"
              subtitle="Required to receive incoming messages"
              value={supported ? (smsPermission ? 'Granted' : 'Not granted') : 'Android only'}
              onPress={() => router.push('/protection')}
            />
            <ListRow
              icon="notifications-outline"
              title="Notification permission"
              subtitle="Required for fraud warning alerts"
              value={
                supported ? (notificationPermission ? 'Granted' : 'Not granted') : 'Android only'
              }
              onPress={() => router.push('/protection')}
              last
            />
          </Card>
          <Button
            label={active ? 'Manage automatic protection' : 'Set up automatic protection'}
            variant={active ? 'outline' : 'primary'}
            icon="shield-checkmark-outline"
            onPress={() => router.push('/protection')}
          />
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Profile" />
          <Card padded={false}>
            <ListRow
              icon="person-outline"
              title={user?.name ?? 'Profile'}
              subtitle={isGuest ? 'Guest profile · local only' : user?.email}
              onPress={() => router.push('/profile')}
            />
            <ListRow
              icon="lock-closed-outline"
              title="Account security"
              subtitle={isGuest ? 'Create an account to add a password' : 'Password protected'}
              value={isGuest ? 'Guest' : 'Active'}
              showChevron={false}
              last
            />
          </Card>
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Alerts & feedback" />
          <Card padded={false}>
            <View style={styles.switchRow}>
              <View style={[styles.switchIcon, { backgroundColor: theme.dangerSoft }]}>
                <Ionicons name="warning-outline" size={19} color={theme.danger} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">Automatic fraud alerts</AppText>
                <AppText variant="caption" tone="secondary">
                  Warn me when an incoming SMS is classified as fraud.
                </AppText>
              </View>
              <Switch
                value={fraudAlertsEnabled}
                disabled={!supported}
                onValueChange={(value) => void setFraudAlertsEnabled(value)}
                trackColor={{ false: theme.borderStrong, true: theme.primary }}
                thumbColor={theme.surface}
              />
            </View>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />
            <View style={styles.switchRow}>
              <View style={[styles.switchIcon, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="notifications-outline" size={19} color={theme.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">Manual check notifications</AppText>
                <AppText variant="caption" tone="secondary">
                  Notify me when a manually checked message looks fraudulent.
                </AppText>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => void toggleNotifications(value)}
                trackColor={{ false: theme.borderStrong, true: theme.primary }}
                thumbColor={theme.surface}
              />
            </View>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />
            <View style={styles.switchRow}>
              <View style={[styles.switchIcon, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="finger-print-outline" size={19} color={theme.accent} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">Haptic feedback</AppText>
                <AppText variant="caption" tone="secondary">
                  A subtle vibration after scanning or selecting.
                </AppText>
              </View>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={(value) => void updateSettings({ hapticsEnabled: value })}
                trackColor={{ false: theme.borderStrong, true: theme.primary }}
                thumbColor={theme.surface}
              />
            </View>
          </Card>
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Appearance" />
          <Card style={{ gap: 12 }}>
            <AppText variant="caption" tone="secondary">
              Choose how MoneyGuard looks. “System” follows your phone’s light or dark setting.
            </AppText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {THEMES.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={settings.theme === option.value}
                  onPress={() => void updateSettings({ theme: option.value })}
                />
              ))}
            </View>
          </Card>
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Your data & privacy" />
          <Card padded={false}>
            <ListRow
              icon="documents-outline"
              title="Detection history"
              subtitle={`${pluralize(totalRecords, 'message')} stored on this device`}
              onPress={confirmClearHistory}
              value={totalRecords ? 'Clear' : undefined}
              tone={totalRecords ? 'danger' : 'default'}
            />
            <ListRow
              icon="hardware-chip-outline"
              title="About the model"
              subtitle="Dataset, accuracy and offline behaviour"
              onPress={() => router.push('/about')}
            />
            <ListRow
              icon="lock-closed-outline"
              title="Privacy"
              subtitle="Messages never leave your phone; no remote API is used."
              showChevron={false}
              value="On-device"
              last
            />
          </Card>
          <View style={styles.privacyRow}>
            <Badge label="LOCAL STORAGE" tone="primary" size="sm" icon="lock-closed" />
            <AppText variant="tiny" tone="muted" style={{ flex: 1 }}>
              SMS content is kept in private app storage. Clearing history deletes it.
            </AppText>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Account" />
          <Button
            label="Sign out"
            variant="outline"
            icon="log-out-outline"
            onPress={confirmSignOut}
          />
          <Button
            label={isGuest ? 'Delete guest profile' : 'Delete account'}
            variant="ghost"
            icon="trash-outline"
            onPress={confirmDeleteAccount}
          />
        </View>

        <View style={styles.versionRow}>
          <AppText variant="tiny" tone="muted">
            MoneyGuard · version {Constants.expoConfig?.version ?? '1.0.0'}
          </AppText>
          <AppText variant="tiny" tone="muted">
            Model v1 · {monitoringEnabled && active ? 'monitoring' : 'offline'}
          </AppText>
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  switchIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
});
