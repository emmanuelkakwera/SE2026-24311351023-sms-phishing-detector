import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { HistoryCard } from '@/components/history-card';
import { StatCard } from '@/components/stat-card';
import {
  AppText,
  Button,
  Callout,
  Card,
  EmptyState,
  Screen,
  ScreenScroll,
  SectionHeader,
} from '@/components/ui';
import { SAFETY_TIPS } from '@/data/awareness';
import { useTheme } from '@/hooks/use-theme';
import { greeting } from '@/lib/format';
import { mergeHistory } from '@/lib/history';
import { unreadAlertCount } from '@/lib/notifications';
import { useApp } from '@/providers/app-provider';
import { useProtection } from '@/providers/protection-provider';
import type { HistoryEntry } from '@/types';

const TOOLS = [
  {
    id: 'protect',
    icon: 'shield-checkmark-outline' as const,
    title: 'Protection settings',
    body: 'Permissions, monitoring and alert controls.',
    href: '/protection' as const,
    tone: 'primary' as const,
  },
  {
    id: 'manual',
    icon: 'scan-outline' as const,
    title: 'Manual SMS check',
    body: 'Optional fallback: check a message by hand.',
    href: '/scan' as const,
    tone: 'info' as const,
  },
  {
    id: 'learn',
    icon: 'school-outline' as const,
    title: 'Scam library',
    body: 'Know the tricks before they arrive.',
    href: '/learn' as const,
    tone: 'warning' as const,
  },
];

function openEntry(entry: HistoryEntry) {
  if (entry.kind === 'automatic') {
    router.push({ pathname: '/detection/[id]', params: { id: entry.id } });
  } else {
    router.push(`/result/${entry.id}`);
  }
}

export default function HomeScreen() {
  const theme = useTheme();
  const { user, scans, notificationsSeenAt } = useApp();
  const {
    supported,
    ready: protectionReady,
    active,
    smsPermission,
    notificationPermission,
    monitoringEnabled,
    detections,
    setMonitoringEnabled,
  } = useProtection();

  const entries = useMemo(() => mergeHistory(scans, detections), [detections, scans]);
  const autoFraud = detections.filter((item) => item.status === 'FRAUD').length;
  const autoUnanalysed = detections.filter((item) => item.status === 'NOT_ANALYSED').length;
  const unread = unreadAlertCount(notificationsSeenAt);
  const tip = SAFETY_TIPS[new Date().getDate() % SAFETY_TIPS.length];
  const recent = entries.slice(0, 3);
  const firstName = user?.name?.split(/\s+/)[0] ?? 'there';

  const hero = !supported
    ? {
        title: 'Automatic protection needs the Android app',
        body: 'This build can still check a message by hand, but it cannot monitor incoming SMS. Install the Android MoneyGuard build to turn on automatic protection.',
        cta: 'Check a message manually',
        onPress: () => router.push('/scan'),
        colors: ['#215E8A', '#12384F'] as const,
        icon: 'phone-portrait-outline' as const,
      }
    : !smsPermission
      ? {
          title: 'Protection is not active yet',
          body: 'MoneyGuard needs SMS access before it can check incoming messages automatically.',
          cta: 'Enable protection',
          onPress: () => router.push('/protection'),
          colors: ['#8A5A00', '#5C3B00'] as const,
          icon: 'shield-outline' as const,
        }
      : !monitoringEnabled
        ? {
            title: 'Protection is paused',
            body: 'SMS access is granted, but monitoring is switched off. Incoming messages are not being checked.',
            cta: 'Resume protection',
            onPress: () => void setMonitoringEnabled(true),
            colors: ['#8A5A00', '#5C3B00'] as const,
            icon: 'pause-circle-outline' as const,
          }
        : {
            title: 'Protection is active',
            body: 'MoneyGuard is checking every incoming carrier SMS on this phone with the on-device model.',
            cta: 'Detection settings',
            onPress: () => router.push('/protection'),
            colors: ['#176B4B', '#0A3A27'] as const,
            icon: 'shield-checkmark' as const,
          };

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={{ paddingTop: 10, gap: 22 }}>
        <View style={styles.topRow}>
          <View style={{ flex: 1, gap: 1 }}>
            <AppText variant="caption" tone="muted">
              {greeting()},
            </AppText>
            <AppText variant="heading" numberOfLines={1}>
              {firstName}
            </AppText>
          </View>
          <Pressable
            onPress={() => router.push('/notifications')}
            accessibilityRole="button"
            accessibilityLabel={`Safety alerts${unread ? `, ${unread} unread` : ''}`}
            style={[styles.headerButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="notifications-outline" size={20} color={theme.text} />
            {unread > 0 ? (
              <View style={[styles.dot, { backgroundColor: theme.danger }]}>
                <AppText variant="tiny" style={{ color: theme.dangerContrast, fontSize: 9 }}>
                  {unread > 9 ? '9+' : unread}
                </AppText>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => router.push('/protection')}
            accessibilityRole="button"
            accessibilityLabel="Open protection settings"
            style={[styles.headerButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="settings-outline" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <AppText variant="bodyStrong" style={{ color: theme.primaryContrast }}>
              {user?.name?.slice(0, 1).toUpperCase() ?? 'G'}
            </AppText>
          </Pressable>
        </View>

        <LinearGradient
          colors={theme.isDark ? ['#1C382B', '#12241B'] : hero.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderColor: theme.isDark ? theme.border : 'transparent' }]}>
          <View style={styles.heroHeader}>
            <BrandMark size="sm" />
            <View
              style={[
                styles.statusPill,
                { backgroundColor: active ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.16)' },
              ]}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: active ? '#7DD3A8' : '#FFD27A' },
                ]}
              />
              <AppText variant="tiny" style={{ color: '#F2F7F4' }}>
                {active ? 'ACTIVE' : supported ? 'INACTIVE' : 'LIMITED BUILD'}
              </AppText>
            </View>
          </View>
          <View style={styles.heroTitleRow}>
            <Ionicons name={hero.icon} size={22} color="#FFFFFF" />
            <AppText variant="title" style={{ color: '#FFFFFF', flex: 1 }}>
              {hero.title}
            </AppText>
          </View>
          <AppText variant="caption" style={{ color: '#D3EBDF', marginTop: 7 }}>
            {hero.body}
          </AppText>
          <View style={{ marginTop: 16 }}>
            <Button
              label={hero.cta}
              icon={active ? 'settings-outline' : 'shield-checkmark-outline'}
              onPress={hero.onPress}
              disabled={!protectionReady}
              style={{ backgroundColor: '#FFFFFF' }}
            />
          </View>
        </LinearGradient>

        {active && !notificationPermission ? (
          <Callout
            tone="warning"
            title="Warning alerts are blocked"
            body="Incoming messages are still checked and saved, but Android will not show fraud alerts until notification permission is granted."
          >
            <View style={{ marginTop: 8 }}>
              <Button
                label="Allow notifications"
                size="sm"
                variant="outline"
                icon="notifications-outline"
                onPress={() => router.push('/protection')}
              />
            </View>
          </Callout>
        ) : null}

        <View style={styles.statsRow}>
          <StatCard
            icon="radio-outline"
            value={String(detections.length)}
            label="SMS auto-checked"
          />
          <StatCard
            icon="warning-outline"
            value={String(autoFraud)}
            label="Frauds detected"
            tone="danger"
          />
          <StatCard icon="create-outline" value={String(scans.length)} label="Manual checks" />
        </View>

        {autoUnanalysed > 0 ? (
          <Callout
            tone="warning"
            title={`${autoUnanalysed} message${autoUnanalysed === 1 ? '' : 's'} could not be analysed`}
            body="Open the detection history to review them. Treat unanalysed messages with caution."
          />
        ) : null}

        <View style={{ gap: 12 }}>
          <SectionHeader
            title="Recent detection activity"
            actionLabel={entries.length ? 'See all' : undefined}
            onAction={entries.length ? () => router.push('/history') : undefined}
          />
          {recent.length ? (
            <View style={{ gap: 10 }}>
              {recent.map((entry) => (
                <HistoryCard
                  key={`${entry.kind}-${entry.id}`}
                  entry={entry}
                  onPress={() => openEntry(entry)}
                />
              ))}
            </View>
          ) : (
            <Card>
              <EmptyState
                icon="shield-outline"
                title="No messages checked yet"
                body={
                  supported
                    ? 'This list stays empty until a real incoming SMS is analysed. No demo or fake records are shown.'
                    : 'Automatic SMS history requires the Android build. You can still check a message manually.'
                }
                action={
                  <Button
                    label={supported ? 'Set up protection' : 'Check a message'}
                    onPress={() => router.push(supported ? '/protection' : '/scan')}
                  />
                }
              />
            </Card>
          )}
        </View>

        <View style={{ gap: 12 }}>
          <SectionHeader title="Quick tools" />
          <View style={{ gap: 10 }}>
            {TOOLS.map((tool) => (
              <Card key={tool.id} onPress={() => router.push(tool.href)}>
                <View style={styles.toolRow}>
                  <View
                    style={[
                      styles.toolIcon,
                      {
                        backgroundColor:
                          tool.tone === 'info'
                            ? theme.infoSoft
                            : tool.tone === 'warning'
                              ? theme.warningSoft
                              : theme.primarySoft,
                      },
                    ]}>
                    <Ionicons
                      name={tool.icon}
                      size={20}
                      color={
                        tool.tone === 'info'
                          ? theme.info
                          : tool.tone === 'warning'
                            ? theme.warning
                            : theme.primary
                      }
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="bodyStrong">{tool.title}</AppText>
                    <AppText variant="caption" tone="secondary">
                      {tool.body}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </View>
              </Card>
            ))}
          </View>
        </View>

        <Card tone="alt" style={{ borderColor: theme.border }}>
          <View style={styles.tipHeader}>
            <View style={[styles.tipIcon, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="bulb-outline" size={19} color={theme.accent} />
            </View>
            <AppText variant="tiny" tone="muted" style={{ letterSpacing: 1 }}>
              SAFETY TIP OF THE DAY
            </AppText>
          </View>
          <AppText variant="bodyStrong" style={{ marginTop: 10 }}>
            {tip.title}
          </AppText>
          <AppText variant="caption" tone="secondary" style={{ marginTop: 4 }}>
            {tip.body}
          </AppText>
        </Card>

        <Pressable onPress={() => router.push('/about')} style={styles.aboutLink}>
          <Ionicons name="hardware-chip-outline" size={14} color={theme.textMuted} />
          <AppText variant="tiny" tone="muted">
            On-device TF-IDF + Logistic Regression · About the model
          </AppText>
        </Pressable>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: 22, padding: 18, borderWidth: 1 },
  heroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statsRow: { flexDirection: 'row', gap: 9 },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toolIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  tipIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  aboutLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
