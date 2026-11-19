import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText, type IconName } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';

export function StatCard({
  icon,
  value,
  label,
  tone = 'primary',
}: {
  icon: IconName;
  value: string;
  label: string;
  tone?: 'primary' | 'danger' | 'success' | 'warning';
}) {
  const theme = useTheme();
  const color =
    tone === 'danger'
      ? theme.danger
      : tone === 'success'
        ? theme.success
        : tone === 'warning'
          ? theme.warning
          : theme.primary;
  const background =
    tone === 'danger'
      ? theme.dangerSoft
      : tone === 'success'
        ? theme.successSoft
        : tone === 'warning'
          ? theme.warningSoft
          : theme.primarySoft;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={[styles.icon, { backgroundColor: background }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <AppText variant="heading" style={{ marginTop: 9 }}>
        {value}
      </AppText>
      <AppText variant="caption" tone="secondary" numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: 108,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
