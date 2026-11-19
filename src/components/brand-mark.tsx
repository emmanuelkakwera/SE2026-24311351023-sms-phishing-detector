import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

export function BrandMark({
  size = 'md',
  showTagline = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}) {
  const theme = useTheme();
  const box = size === 'lg' ? 60 : size === 'sm' ? 36 : 44;
  const icon = size === 'lg' ? 32 : size === 'sm' ? 19 : 24;

  return (
    <View style={styles.row}>
      <LinearGradient
        colors={theme.isDark ? [theme.primary, theme.primaryDark] : [theme.primary, '#0E4A33']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.mark,
          { width: box, height: box, borderRadius: box * 0.3 },
        ]}>
        <Ionicons name="shield-checkmark" size={icon} color={theme.primaryContrast} />
      </LinearGradient>
      <View style={{ gap: 1 }}>
        <AppText
          variant={size === 'lg' ? 'title' : size === 'sm' ? 'subheading' : 'heading'}
          style={{ letterSpacing: -0.4 }}>
          Money<AppText variant="heading" tone="primary">Guard</AppText>
        </AppText>
        {showTagline ? (
          <AppText variant="tiny" tone="muted">
            SMS scam protection, offline
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  mark: { alignItems: 'center', justifyContent: 'center' },
});
