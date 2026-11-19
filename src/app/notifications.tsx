import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Badge,
  Button,
  Callout,
  Card,
  Screen,
  ScreenHeader,
  ScreenScroll,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeTime } from '@/lib/format';
import {
  SAFETY_ALERTS,
  alertPublishedAt,
  sendTestNotification,
  unreadAlertCount,
} from '@/lib/notifications';
import { useApp } from '@/providers/app-provider';

const ICONS = {
  'scam-alert': 'alert-circle' as const,
  tip: 'bulb' as const,
  update: 'sparkles' as const,
};

const TONES = {
  'scam-alert': 'fraud' as const,
  tip: 'warning' as const,
  update: 'info' as const,
};

export default function NotificationsScreen() {
  const theme = useTheme();
  const { notificationsSeenAt, markNotificationsRead, settings } = useApp();
  // Capture the seen-at value on first render, before the screen marks alerts read.
  const [initialSeen] = useState(notificationsSeenAt);
  const [testState, setTestState] = useState<'idle' | 'sending' | 'sent' | 'denied'>('idle');

  useEffect(() => {
    void markNotificationsRead();
  }, [markNotificationsRead]);

  async function handleTest() {
    setTestState('sending');
    const sent = await sendTestNotification();
    setTestState(sent ? 'sent' : 'denied');
  }

  return (
    <Screen>
      <ScreenHeader title="Safety alerts" subtitle="Tips and scam warnings" />
      <ScreenScroll contentContainerStyle={{ gap: 14, paddingTop: 8 }}>
        {testState === 'denied' ? (
          <Callout
            tone="warning"
            title="Notifications are blocked"
            body="Allow notifications for MoneyGuard in your phone settings, then try again."
          />
        ) : null}
        {testState === 'sent' ? (
          <Callout
            tone="success"
            title="Test alert sent"
            body="If you do not see it, check your notification settings."
          />
        ) : null}

        <Callout
          tone="info"
          title="Alerts are local"
          body="MoneyGuard does not run a server. These safety alerts are bundled with the app and update when you update MoneyGuard."
        />

        <View style={{ gap: 10 }}>
          {SAFETY_ALERTS.map((alert) => {
            const published = alertPublishedAt(alert);
            const isUnread =
              !initialSeen || new Date(published).getTime() > new Date(initialSeen).getTime();

            return (
              <Card
                key={alert.id}
                onPress={alert.href ? () => router.push(alert.href as never) : undefined}
                accentColor={isUnread ? theme.primary : undefined}
                style={{ gap: 8 }}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.icon,
                      {
                        backgroundColor:
                          alert.category === 'scam-alert'
                            ? theme.dangerSoft
                            : alert.category === 'tip'
                              ? theme.warningSoft
                              : theme.infoSoft,
                      },
                    ]}>
                    <Ionicons
                      name={ICONS[alert.category]}
                      size={19}
                      color={
                        alert.category === 'scam-alert'
                          ? theme.danger
                          : alert.category === 'tip'
                            ? theme.warning
                            : theme.info
                      }
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.titleRow}>
                      <AppText variant="bodyStrong" style={{ flex: 1 }}>
                        {alert.title}
                      </AppText>
                      {isUnread ? (
                        <View style={[styles.unread, { backgroundColor: theme.primary }]} />
                      ) : null}
                    </View>
                    <AppText variant="tiny" tone="muted">
                      {formatRelativeTime(published)}
                    </AppText>
                  </View>
                </View>
                <AppText variant="caption" tone="secondary">
                  {alert.body}
                </AppText>
                <View style={styles.footer}>
                  <Badge
                    label={
                      alert.category === 'scam-alert'
                        ? 'SCAM ALERT'
                        : alert.category === 'tip'
                          ? 'SAFETY TIP'
                          : 'APP UPDATE'
                    }
                    tone={TONES[alert.category]}
                    size="sm"
                  />
                  {alert.href ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <AppText variant="tiny" tone="primary" style={{ fontWeight: '700' }}>
                        Read more
                      </AppText>
                      <Ionicons name="chevron-forward" size={13} color={theme.primary} />
                    </View>
                  ) : null}
                </View>
              </Card>
            );
          })}
        </View>

        <Card tone="alt" style={{ gap: 10 }}>
          <AppText variant="bodyStrong">Test your alerts</AppText>
          <AppText variant="caption" tone="secondary">
            {settings.notificationsEnabled
              ? 'Send yourself a local notification to confirm alerts are working.'
              : 'Alerts are currently turned off in settings. Turn them on, then send a test.'}
          </AppText>
          <Button
            label={testState === 'sending' ? 'Sending…' : 'Send test notification'}
            variant="outline"
            icon="notifications-outline"
            loading={testState === 'sending'}
            disabled={!settings.notificationsEnabled}
            onPress={handleTest}
          />
          {!settings.notificationsEnabled ? (
            <Button
              label="Open notification settings"
              variant="ghost"
              size="sm"
              onPress={() => router.push('/settings')}
            />
          ) : null}
        </Card>

        <AppText variant="tiny" tone="muted" center>
          {unreadAlertCount(initialSeen) > 0
            ? `${unreadAlertCount(initialSeen)} alerts were unread before you opened this screen.`
            : 'You are all caught up.'}
        </AppText>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unread: { width: 8, height: 8, borderRadius: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
});
