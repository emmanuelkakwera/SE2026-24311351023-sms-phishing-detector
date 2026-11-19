import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, View } from 'react-native';

import {
  AppText,
  Badge,
  Button,
  Callout,
  Card,
  ListRow,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { pluralize } from '@/lib/format';
import { useProtection } from '@/providers/protection-provider';

export default function ProtectionScreen() {
  const theme = useTheme();
  const {
    supported,
    ready,
    smsPermission,
    notificationPermission,
    monitoringEnabled,
    fraudAlertsEnabled,
    notifyOnAnalysisFailure,
    active,
    detections,
    error,
    requestPermissions,
    requestSmsAccess,
    requestNotificationAccess,
    setMonitoringEnabled,
    setFraudAlertsEnabled,
    setNotifyOnAnalysisFailure,
    clearDetections,
  } = useProtection();
  const [busy, setBusy] = useState<string | null>(null);

  const statusLabel = !supported
    ? 'Unavailable in this build'
    : !smsPermission
      ? 'Inactive — SMS access needed'
      : !monitoringEnabled
        ? 'Paused'
        : !notificationPermission
          ? 'Active — warning alerts blocked'
          : 'Active';
  const statusTone = active
    ? notificationPermission
      ? theme.success
      : theme.warning
    : theme.warning;
  const statusSoft = active
    ? notificationPermission
      ? theme.successSoft
      : theme.warningSoft
    : theme.warningSoft;

  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key);
    try {
      await action();
    } finally {
      setBusy(null);
    }
  }

  function confirmClear() {
    if (!detections.length) return;
    Alert.alert(
      'Clear automatic detection history?',
      `This removes ${pluralize(detections.length, 'saved detection')} stored by the SMS receiver. It cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => void clearDetections(),
        },
      ],
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Protection" subtitle="Automatic incoming SMS monitoring" showBack />
      <ScreenScroll contentContainerStyle={{ gap: 16, paddingTop: 8 }}>
        <Card style={{ gap: 14, borderColor: statusTone, backgroundColor: statusSoft }}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIcon,
                { backgroundColor: statusTone, borderColor: statusTone },
              ]}>
              <Ionicons
                name={active ? 'shield-checkmark' : supported ? 'shield-outline' : 'phone-portrait-outline'}
                size={24}
                color={theme.surface}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="tiny" style={{ color: statusTone, letterSpacing: 1 }}>
                PROTECTION STATUS
              </AppText>
              <AppText variant="heading" style={{ color: statusTone }}>
                {statusLabel}
              </AppText>
            </View>
            <Badge
              label={active ? 'ON' : 'OFF'}
              tone={active ? 'normal' : 'warning'}
              size="sm"
            />
          </View>
          <AppText variant="caption" style={{ color: statusTone }}>
            {!supported
              ? 'Automatic SMS monitoring is an Android-only native feature. Expo Go, iOS and the web cannot receive SMS_RECEIVED broadcasts. The manual check still works.'
              : !smsPermission
                ? 'Grant SMS access so MoneyGuard can receive incoming messages. It does not need to be your default SMS app.'
                : !monitoringEnabled
                  ? 'SMS access is granted, but monitoring is off. Incoming messages are not checked until you resume protection.'
                  : !notificationPermission
                    ? 'Incoming SMS is being checked on-device. Android will not display fraud warning notifications until notification access is granted.'
                    : `MoneyGuard is monitoring incoming carrier SMS and storing results on this phone. ${pluralize(detections.length, 'message')} recorded so far.`}
          </AppText>
          {!supported ? (
            <Button
              label="Check a message manually"
              variant="outline"
              icon="scan-outline"
              onPress={() => router.push('/scan')}
            />
          ) : null}
        </Card>

        {error ? <Callout tone="warning" title="Protection notice" body={error} /> : null}

        <View style={{ gap: 10 }}>
          <SectionHeader title="Permissions" />
          <Card padded={false}>
            <ListRow
              icon="chatbox-ellipses-outline"
              title="SMS access"
              subtitle="Allows the receiver to check incoming carrier SMS"
              value={supported ? (smsPermission ? 'Granted' : 'Not granted') : 'Android only'}
              showChevron={false}
              tone={supported && !smsPermission ? 'danger' : 'default'}
            />
            <ListRow
              icon="notifications-outline"
              title="Notification access"
              subtitle="Shows immediate fraud warnings"
              value={supported ? (notificationPermission ? 'Granted' : 'Not granted') : 'Android only'}
              showChevron={false}
              last
            />
          </Card>
          {supported ? (
            <View style={{ gap: 8 }}>
              {!smsPermission ? (
                <Button
                  label={busy === 'permissions' ? 'Requesting…' : 'Grant SMS permission'}
                  icon="shield-checkmark-outline"
                  loading={busy === 'permissions'}
                  onPress={() => void run('permissions', requestPermissions)}
                />
              ) : !notificationPermission ? (
                <Button
                  label={busy === 'notifications' ? 'Requesting…' : 'Allow warning notifications'}
                  icon="notifications-outline"
                  loading={busy === 'notifications'}
                  onPress={() => void run('notifications', requestNotificationAccess)}
                />
              ) : null}
              {!smsPermission ? (
                <Button
                  label={busy === 'sms' ? 'Requesting…' : 'Try SMS access again'}
                  variant="outline"
                  icon="key-outline"
                  loading={busy === 'sms'}
                  onPress={() => void run('sms', requestSmsAccess)}
                />
              ) : null}
              <Button
                label="Open Android app settings"
                variant="ghost"
                icon="settings-outline"
                onPress={() => void Linking.openSettings()}
              />
            </View>
          ) : null}
        </View>

        {supported ? (
          <View style={{ gap: 10 }}>
            <SectionHeader title="Monitoring & alerts" />
            <Card padded={false}>
              <View style={styles.switchRow}>
                <View style={[styles.switchIcon, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name="radio-outline" size={19} color={theme.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong">Automatic SMS monitoring</AppText>
                  <AppText variant="caption" tone="secondary">
                    Check every incoming carrier SMS on this phone.
                  </AppText>
                </View>
                <Switch
                  value={monitoringEnabled}
                  disabled={!smsPermission || !ready}
                  onValueChange={(value) => void setMonitoringEnabled(value)}
                  trackColor={{ false: theme.borderStrong, true: theme.primary }}
                  thumbColor={theme.surface}
                />
              </View>
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />
              <View style={styles.switchRow}>
                <View style={[styles.switchIcon, { backgroundColor: theme.dangerSoft }]}>
                  <Ionicons name="warning-outline" size={19} color={theme.danger} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong">Fraud warning notifications</AppText>
                  <AppText variant="caption" tone="secondary">
                    High-priority alert when an SMS is classified as fraud.
                  </AppText>
                </View>
                <Switch
                  value={fraudAlertsEnabled}
                  disabled={!notificationPermission || !ready}
                  onValueChange={(value) => void setFraudAlertsEnabled(value)}
                  trackColor={{ false: theme.borderStrong, true: theme.primary }}
                  thumbColor={theme.surface}
                />
              </View>
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />
              <View style={styles.switchRow}>
                <View style={[styles.switchIcon, { backgroundColor: theme.warningSoft }]}>
                  <Ionicons name="help-circle-outline" size={19} color={theme.warning} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong">Unanalysed message warnings</AppText>
                  <AppText variant="caption" tone="secondary">
                    Notify me when a message could not be checked.
                  </AppText>
                </View>
                <Switch
                  value={notifyOnAnalysisFailure}
                  disabled={!notificationPermission || !ready}
                  onValueChange={(value) => void setNotifyOnAnalysisFailure(value)}
                  trackColor={{ false: theme.borderStrong, true: theme.primary }}
                  thumbColor={theme.surface}
                />
              </View>
            </Card>
          </View>
        ) : null}

        <Callout
          tone="info"
          title="What MoneyGuard can and cannot see"
          body="MoneyGuard receives ordinary carrier SMS through Android's SMS_RECEIVED broadcast. It cannot read your SMS inbox, delete or modify messages, or monitor RCS chats, WhatsApp, Messenger or other internet messaging apps. It never needs to be your default SMS app."
        />

        <Callout
          tone="success"
          title="Private by design"
          body="Incoming messages are classified on this phone with the bundled TF-IDF + Logistic Regression model. Message text is stored locally and is never uploaded to a server. You can clear every detection record below."
        />

        <View style={{ gap: 10 }}>
          <SectionHeader title="Detection data" />
          <Card padded={false}>
            <ListRow
              icon="documents-outline"
              title="Automatic detection history"
              subtitle={`${pluralize(detections.length, 'message')} stored on this device`}
              value={detections.length ? 'Clear' : undefined}
              onPress={confirmClear}
              tone={detections.length ? 'danger' : 'default'}
              last
            />
          </Card>
        </View>

        <Button
          label="Open all settings"
          variant="outline"
          icon="settings-outline"
          onPress={() => router.push('/settings')}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
});
