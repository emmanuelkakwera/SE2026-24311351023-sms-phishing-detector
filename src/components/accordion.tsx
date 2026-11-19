import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import type { IconName } from '@/components/ui';

export function Accordion({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon?: IconName;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 14,
        backgroundColor: theme.surface,
        overflow: 'hidden',
      }}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [
          styles.header,
          pressed && { backgroundColor: theme.surfaceAlt },
        ]}>
        {icon ? <Ionicons name={icon} size={19} color={theme.primary} /> : null}
        <AppText variant="bodyStrong" style={{ flex: 1 }}>
          {title}
        </AppText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.textMuted}
        />
      </Pressable>
      {open ? (
        <View style={[styles.body, { borderTopColor: theme.border }]}>{children}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
