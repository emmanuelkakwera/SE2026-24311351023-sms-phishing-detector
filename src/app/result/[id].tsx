import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ScoreRing } from '@/components/score-ring';
import {
  AppText,
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  IconButton,
  ProgressBar,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, formatPercent } from '@/lib/format';
import { copyText, shareScan } from '@/lib/share';
import { useApp } from '@/providers/app-provider';

export default function ResultScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scans, removeScan } = useApp();
  const scan = scans.find((item) => item.id === id);

  if (!scan) {
    return (
      <Screen>
        <ScreenHeader title="Scan result" subtitle="Saved on this device" />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
          <EmptyState
            icon="document-outline"
            title="Result not found"
            body="This scan may have been deleted or belongs to another local profile."
            action={<Button label="Go back" onPress={() => router.back()} />}
          />
        </View>
      </Screen>
    );
  }

  const isFraud = scan.label === 'fraud';
  const accent = isFraud ? theme.danger : theme.success;

  function confirmDelete() {
    if (!scan) return;
    Alert.alert('Delete this scan?', 'The result and its explanation will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeScan(scan.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScreenHeader
        title="Scan result"
        subtitle={formatDateTime(scan.createdAt)}
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton
              icon="share-social-outline"
              label="Share scan result"
              onPress={() => void shareScan(scan)}
            />
            <IconButton
              icon="trash-outline"
              tone="danger"
              label="Delete scan"
              onPress={confirmDelete}
            />
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}>
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <ScoreRing label={scan.label} confidence={scan.confidence} />
          <View style={{ marginTop: 16, alignItems: 'center', gap: 6 }}>
            <Badge
              label={isFraud ? 'FRAUDULENT' : 'LIKELY LEGITIMATE'}
              tone={isFraud ? 'fraud' : 'normal'}
              icon={isFraud ? 'alert-circle' : 'shield-checkmark'}
            />
            <AppText variant="heading" center style={{ color: accent }}>
              {isFraud ? 'This message looks like a scam' : 'No strong scam signals found'}
            </AppText>
            <AppText variant="caption" tone="secondary" center style={{ maxWidth: 310 }}>
              {isFraud
                ? 'Treat the sender as hostile. Do not reply, call the number, tap links, or share your PIN.'
                : 'Still verify unexpected requests using your provider’s official app or USSD menu.'}
            </AppText>
          </View>
        </Card>

        {isFraud ? (
          <Callout tone="danger" title="What to do now" icon="hand-left-outline">
            <View style={{ gap: 6, marginTop: 4 }}>
              <AppText variant="caption" style={{ color: theme.danger }}>
                • Do not reply or call any number in the message.
              </AppText>
              <AppText variant="caption" style={{ color: theme.danger }}>
                • Do not tap links or send airtime or money.
              </AppText>
              <AppText variant="caption" style={{ color: theme.danger }}>
                • Report it to your provider and to MoneyGuard support.
              </AppText>
            </View>
          </Callout>
        ) : (
          <Callout
            tone="success"
            title="Still be careful"
            body="A legitimate-looking result is not a guarantee. Genuine providers never ask for your PIN, OTP, or a fee to release money."
          />
        )}

        <Card style={{ gap: 14 }}>
          <SectionHeader title="Probability breakdown" />
          <View style={{ gap: 7 }}>
            <View style={styles.probRow}>
              <AppText variant="caption" tone="secondary">
                Fraud probability
              </AppText>
              <AppText variant="caption" style={{ color: theme.danger, fontWeight: '700' }}>
                {formatPercent(scan.fraudProbability, 1)}
              </AppText>
            </View>
            <ProgressBar value={scan.fraudProbability} tone="danger" />
          </View>
          <View style={{ gap: 7 }}>
            <View style={styles.probRow}>
              <AppText variant="caption" tone="secondary">
                Legitimate probability
              </AppText>
              <AppText variant="caption" style={{ color: theme.success, fontWeight: '700' }}>
                {formatPercent(scan.normalProbability, 1)}
              </AppText>
            </View>
            <ProgressBar value={scan.normalProbability} tone="success" />
          </View>
          <AppText variant="tiny" tone="muted">
            Probabilities always add up to 100%. The higher value determines the classification.
          </AppText>
        </Card>

        <Card style={{ gap: 12 }}>
          <SectionHeader title="Why this result?" />
          <AppText variant="body" tone="secondary">
            {scan.explanation.summary}
          </AppText>

          {scan.explanation.topSignals.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {scan.explanation.topSignals.map((signal) => (
                <View
                  key={`${signal.term}-${signal.impact}`}
                  style={[
                    styles.signal,
                    {
                      backgroundColor:
                        signal.supports === 'fraud' ? theme.dangerSoft : theme.successSoft,
                      borderColor:
                        signal.supports === 'fraud' ? theme.danger : theme.success,
                    },
                  ]}>
                  <Ionicons
                    name={signal.supports === 'fraud' ? 'trending-up' : 'trending-down'}
                    size={13}
                    color={signal.supports === 'fraud' ? theme.danger : theme.success}
                  />
                  <AppText
                    variant="caption"
                    style={{
                      color: signal.supports === 'fraud' ? theme.danger : theme.success,
                      fontWeight: '600',
                    }}>
                    {signal.term}
                  </AppText>
                </View>
              ))}
            </View>
          ) : (
            <AppText variant="caption" tone="muted">
              No single word dominated the decision; the overall text pattern drove the result.
            </AppText>
          )}

          <AppText variant="tiny" tone="muted">
            {scan.explanation.disclaimer}
          </AppText>
        </Card>

        <Card style={{ gap: 10 }}>
          <SectionHeader
            title="Scanned message"
            actionLabel="Copy"
            onAction={() => void copyText(scan.message)}
          />
          <View
            style={[
              styles.messageBox,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}>
            <AppText variant="body" selectable>
              {scan.message}
            </AppText>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="hardware-chip-outline" size={14} color={theme.textMuted} />
            <AppText variant="tiny" tone="muted">
              Analysed on-device by the bundled MoneyGuard model
            </AppText>
          </View>
        </Card>

        <View style={{ gap: 9 }}>
          <Button
            label="Scan another message"
            icon="scan-outline"
            onPress={() => router.replace('/scan')}
          />
          <Button
            label="Share this result"
            variant="outline"
            icon="share-social-outline"
            onPress={() => void shareScan(scan)}
          />
          {isFraud ? (
            <Button
              label="Report this scam"
              variant="ghost"
              icon="flag-outline"
              onPress={() => router.push('/support')}
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  probRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  signal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  messageBox: { borderRadius: 12, borderWidth: 1, padding: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
