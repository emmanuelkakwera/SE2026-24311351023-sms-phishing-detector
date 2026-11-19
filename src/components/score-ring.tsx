import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { formatPercent } from '@/lib/format';
import type { ScanLabel } from '@/types';

export function ScoreRing({
  label,
  confidence,
  size = 148,
}: {
  label: ScanLabel;
  confidence: number;
  size?: number;
}) {
  const theme = useTheme();
  const isFraud = label === 'fraud';
  const color = isFraud ? theme.danger : theme.success;
  const soft = isFraud ? theme.dangerSoft : theme.successSoft;

  return (
    <View
      accessibilityLabel={`${isFraud ? 'Fraudulent' : 'Legitimate'} with ${formatPercent(confidence)} confidence`}
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          backgroundColor: soft,
        },
      ]}>
      <View
        style={[
          styles.inner,
          {
            width: size - 26,
            height: size - 26,
            borderRadius: (size - 26) / 2,
            backgroundColor: theme.surface,
          },
        ]}>
        <Ionicons
          name={isFraud ? 'warning' : 'shield-checkmark'}
          size={24}
          color={color}
          style={{ marginBottom: 2 }}
        />
        <AppText variant="title" style={{ color, fontSize: 30 }}>
          {formatPercent(confidence)}
        </AppText>
        <AppText variant="tiny" tone="muted">
          CONFIDENCE
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
