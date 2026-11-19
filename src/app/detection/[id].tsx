import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ScoreRing } from '@/components/score-ring';
import {
  AppText,
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  ProgressBar,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, formatPercent } from '@/lib/format';
import { getNativeDetection } from '@/lib/sms-protection';
import { useProtection } from '@/providers/protection-provider';
import type { ProtectionDetection } from '@/types';

function fromNative(detection: Awaited<ReturnType<typeof getNativeDetection>>): ProtectionDetection | null {
  if (!detection) return null;
  return {
    id: detection.id,
    sender: detection.sender || 'Unknown sender',
    message: detection.body,
    status: detection.status,
    confidence: detection.confidence,
    fraudProbability: detection.fraudProbability,
    normalProbability: detection.normalProbability,
    explanation: detection.explanation,
    signals: detection.signals ?? [],
    receivedAt: new Date(detection.timestamp || Date.now()).toISOString(),
    detectedAt: new Date(detection.detectedAt || detection.timestamp || Date.now()).toISOString(),
    subscriptionId: detection.subscriptionId,
    analysisSource: detection.analysisSource,
  };
}

export default function DetectionDetailsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detections, removeDetection, supported } = useProtection();
  const fromProvider = detections.find((item) => item.id === id);
  const [loaded, setLoaded] = useState<{ id: string; detection: ProtectionDetection | null } | null>(
    null,
  );

  useEffect(() => {
    if (fromProvider || !id) return;
    const requestedId = String(id);
    let cancelled = false;
    void getNativeDetection(requestedId).then((detection) => {
      if (cancelled) return;
      setLoaded({ id: requestedId, detection: fromNative(detection) });
    });
    return () => {
      cancelled = true;
    };
  }, [fromProvider, id]);

  const detection = fromProvider ?? (loaded?.id === String(id) ? loaded.detection : null);
  const loading = !detection && Boolean(id) && loaded?.id !== String(id);

  function confirmDelete() {
    if (!detection) return;
    Alert.alert(
      'Delete this detection?',
      'The saved SMS and its result will be removed from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeDetection(detection.id);
            router.back();
          },
        },
      ],
    );
  }

  if (!detection) {
    return (
      <Screen>
        <ScreenHeader title="Detection details" subtitle="Automatic SMS protection" />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
          <EmptyState
            icon={loading ? 'time-outline' : 'document-outline'}
            title={loading ? 'Loading detection…' : 'Detection not found'}
            body={
              loading
                ? 'Reading the on-device detection record.'
                : supported
                  ? 'This record may have been deleted or cleared from history.'
                  : 'Automatic detections are only stored by the Android build of MoneyGuard.'
            }
            action={<Button label="Go back" onPress={() => router.back()} />}
          />
        </View>
      </Screen>
    );
  }

  const isFraud = detection.status === 'FRAUD';
  const isNormal = detection.status === 'NORMAL';
  const accent = isFraud ? theme.danger : isNormal ? theme.success : theme.warning;
  const accentSoft = isFraud ? theme.dangerSoft : isNormal ? theme.successSoft : theme.warningSoft;
  const label = isFraud ? 'FRAUD' : isNormal ? 'NORMAL' : 'NOT ANALYSED';
  const sender = detection.sender || 'Unknown sender';

  return (
    <Screen>
      <ScreenHeader
        title="Detection details"
        subtitle={formatDateTime(detection.receivedAt)}
        right={
          <Button
            label="Delete"
            variant="ghost"
            size="sm"
            icon="trash-outline"
            fullWidth={false}
            onPress={confirmDelete}
          />
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}>
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          {detection.confidence !== null ? (
            <ScoreRing label={isFraud ? 'fraud' : 'normal'} confidence={detection.confidence} />
          ) : (
            <View style={[styles.unknownRing, { borderColor: accent, backgroundColor: accentSoft }]}>
              <Ionicons name="help-circle-outline" size={52} color={accent} />
            </View>
          )}
          <View style={{ marginTop: 16, alignItems: 'center', gap: 6 }}>
            <Badge
              label={label}
              tone={isFraud ? 'fraud' : isNormal ? 'normal' : 'warning'}
              icon={isFraud ? 'alert-circle' : isNormal ? 'shield-checkmark' : 'help-circle'}
            />
            <AppText variant="heading" center style={{ color: accent }}>
              {isFraud
                ? 'This incoming SMS looks like a scam'
                : isNormal
                  ? 'No strong scam signals found'
                  : 'This message could not be analysed'}
            </AppText>
            <AppText variant="caption" tone="secondary" center style={{ maxWidth: 320 }}>
              {isFraud
                ? 'MoneyGuard checked this message automatically when it arrived. Treat the sender as hostile and do not follow its instructions.'
                : isNormal
                  ? 'MoneyGuard checked this message automatically. This is an automated risk result, not a guarantee that the message is safe.'
                  : 'The model could not produce a result. Treat the message with caution and verify it with your provider.'}
            </AppText>
          </View>
        </Card>

        <Card style={{ gap: 12 }}>
          <SectionHeader title="Message details" />
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <AppText variant="tiny" tone="muted">
                SENDER
              </AppText>
              <AppText variant="bodyStrong" selectable>
                {sender}
              </AppText>
            </View>
            <View style={styles.metaItem}>
              <AppText variant="tiny" tone="muted">
                RECEIVED
              </AppText>
              <AppText variant="bodyStrong">{formatDateTime(detection.receivedAt)}</AppText>
            </View>
            <View style={styles.metaItem}>
              <AppText variant="tiny" tone="muted">
                SIM / SUBSCRIPTION
              </AppText>
              <AppText variant="bodyStrong">
                {detection.subscriptionId !== null
                  ? `SIM ${detection.subscriptionId + 1}`
                  : 'Not reported'}
              </AppText>
            </View>
            <View style={styles.metaItem}>
              <AppText variant="tiny" tone="muted">
                DETECTED BY
              </AppText>
              <AppText variant="bodyStrong">
                {detection.analysisSource === 'ON_DEVICE'
                  ? 'On-device model'
                  : 'Remote fallback'}
              </AppText>
            </View>
          </View>
          <View
            style={[
              styles.messageBox,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}>
            <AppText variant="body" selectable>
              {detection.message || 'No message body was stored.'}
            </AppText>
          </View>
        </Card>

        {detection.confidence !== null && detection.fraudProbability !== null ? (
          <Card style={{ gap: 14 }}>
            <SectionHeader title="Model result" />
            <View style={{ gap: 7 }}>
              <View style={styles.probRow}>
                <AppText variant="caption" tone="secondary">
                  Fraud probability
                </AppText>
                <AppText variant="caption" style={{ color: theme.danger, fontWeight: '700' }}>
                  {formatPercent(detection.fraudProbability, 1)}
                </AppText>
              </View>
              <ProgressBar value={detection.fraudProbability} tone="danger" />
            </View>
            <View style={{ gap: 7 }}>
              <View style={styles.probRow}>
                <AppText variant="caption" tone="secondary">
                  Legitimate probability
                </AppText>
                <AppText variant="caption" style={{ color: theme.success, fontWeight: '700' }}>
                  {formatPercent(detection.normalProbability ?? 1 - detection.fraudProbability, 1)}
                </AppText>
              </View>
              <ProgressBar
                value={detection.normalProbability ?? 1 - detection.fraudProbability}
                tone="success"
              />
            </View>
            <AppText variant="tiny" tone="muted">
              Scores come from the bundled TF-IDF + Logistic Regression model. They are automated
              risk estimates, not proof.
            </AppText>
          </Card>
        ) : null}

        <Card style={{ gap: 12 }}>
          <SectionHeader title="Why this result?" />
          <AppText variant="body" tone="secondary">
            {detection.explanation ||
              'No explanation was recorded for this message.'}
          </AppText>
          {detection.signals.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {detection.signals.map((signal) => (
                <View
                  key={signal}
                  style={[
                    styles.signal,
                    {
                      backgroundColor: accentSoft,
                      borderColor: accent,
                    },
                  ]}>
                  <Ionicons
                    name={isFraud ? 'trending-up' : 'trending-down'}
                    size={13}
                    color={accent}
                  />
                  <AppText variant="caption" style={{ color: accent, fontWeight: '600' }}>
                    {signal}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

        <Callout
          tone={isFraud ? 'danger' : isNormal ? 'success' : 'warning'}
          title={isFraud ? 'What to do now' : isNormal ? 'Stay careful' : 'Verify this message'}
        >
          <View style={{ gap: 6, marginTop: 4 }}>
            {(isFraud
              ? [
                  'Do not reply, call any number in the message, or tap links.',
                  'Never share your PIN, OTP, or account details.',
                  'Report the message to Airtel Money or TNM Mpamba support.',
                ]
              : isNormal
                ? [
                    'Genuine providers never ask for your PIN or OTP.',
                    'Verify unexpected requests in the official provider app or USSD menu.',
                    'A normal result does not guarantee that a message is safe.',
                  ]
                : [
                    'Do not act on the message until you verify the sender.',
                    'Open your provider app or dial its official USSD code.',
                    'Report persistent suspicious messages to your provider.',
                  ]
            ).map((line) => (
              <AppText key={line} variant="caption" style={{ color: accent }}>
                • {line}
              </AppText>
            ))}
          </View>
        </Callout>

        <Button
          label="Delete this detection"
          variant="outline"
          icon="trash-outline"
          onPress={confirmDelete}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  unknownRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  metaItem: { minWidth: '44%', flexGrow: 1, gap: 3 },
  messageBox: { borderRadius: 12, borderWidth: 1, padding: 12 },
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
});
