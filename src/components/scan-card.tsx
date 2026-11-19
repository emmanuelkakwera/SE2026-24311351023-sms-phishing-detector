import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card, ProgressBar } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { formatPercent, formatRelativeTime, truncate } from '@/lib/format';
import type { ScanRecord } from '@/types';

export function ScanCard({
  scan,
  onPress,
  onLongPress,
}: {
  scan: ScanRecord;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const theme = useTheme();
  const isFraud = scan.label === 'fraud';
  const accent = isFraud ? theme.danger : theme.success;

  return (
    <Card onPress={onPress} onLongPress={onLongPress} accentColor={accent} style={styles.card}>
      <View style={styles.topRow}>
        <Badge
          label={isFraud ? 'FRAUD' : 'LIKELY SAFE'}
          tone={isFraud ? 'fraud' : 'normal'}
          icon={isFraud ? 'alert-circle' : 'checkmark-circle'}
          size="sm"
        />
        <AppText variant="tiny" tone="muted">
          {formatRelativeTime(scan.createdAt)}
        </AppText>
      </View>

      <AppText variant="body" numberOfLines={2} style={{ marginTop: 9 }}>
        {truncate(scan.message, 150)}
      </AppText>

      <View style={styles.footer}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.confidenceRow}>
            <AppText variant="tiny" tone="muted">
              CONFIDENCE
            </AppText>
            <AppText variant="tiny" style={{ color: accent }}>
              {formatPercent(scan.confidence, 1)}
            </AppText>
          </View>
          <ProgressBar
            value={scan.confidence}
            tone={isFraud ? 'danger' : 'success'}
            height={5}
          />
        </View>
        <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 15 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 13 },
  confidenceRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
