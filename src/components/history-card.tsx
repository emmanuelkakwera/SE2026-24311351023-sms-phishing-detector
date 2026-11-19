import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card, ProgressBar } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { formatPercent, formatRelativeTime, truncate } from '@/lib/format';
import type { HistoryEntry } from '@/types';

export function HistoryCard({
  entry,
  onPress,
  onLongPress,
}: {
  entry: HistoryEntry;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const theme = useTheme();
  const isFraud = entry.status === 'FRAUD';
  const isNormal = entry.status === 'NORMAL';
  const accent = isFraud ? theme.danger : isNormal ? theme.success : theme.warning;

  return (
    <Card onPress={onPress} onLongPress={onLongPress} accentColor={accent} style={styles.card}>
      <View style={styles.topRow}>
        <Badge
          label={isFraud ? 'FRAUD' : isNormal ? 'NORMAL' : 'NOT ANALYSED'}
          tone={isFraud ? 'fraud' : isNormal ? 'normal' : 'warning'}
          icon={isFraud ? 'alert-circle' : isNormal ? 'checkmark-circle' : 'help-circle'}
          size="sm"
        />
        <View style={styles.origin}>
          <Ionicons
            name={entry.kind === 'automatic' ? 'radio-outline' : 'create-outline'}
            size={12}
            color={theme.textMuted}
          />
          <AppText variant="tiny" tone="muted">
            {entry.kind === 'automatic' ? 'AUTO' : 'MANUAL'} · {formatRelativeTime(entry.createdAt)}
          </AppText>
        </View>
      </View>

      <View style={styles.senderRow}>
        <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
          {entry.sender || 'Unknown sender'}
        </AppText>
      </View>
      <AppText variant="body" numberOfLines={2} style={{ marginTop: 6 }}>
        {truncate(entry.message, 150)}
      </AppText>

      <View style={styles.footer}>
        {entry.confidence !== null ? (
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.confidenceRow}>
              <AppText variant="tiny" tone="muted">
                CONFIDENCE
              </AppText>
              <AppText variant="tiny" style={{ color: accent }}>
                {formatPercent(entry.confidence, 1)}
              </AppText>
            </View>
            <ProgressBar
              value={entry.confidence}
              tone={isFraud ? 'danger' : isNormal ? 'success' : 'warning'}
              height={5}
            />
          </View>
        ) : (
          <AppText variant="tiny" tone="warning" style={{ flex: 1 }}>
            Open to see why this message was not analysed.
          </AppText>
        )}
        <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 15 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  origin: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  senderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 13 },
  confidenceRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
