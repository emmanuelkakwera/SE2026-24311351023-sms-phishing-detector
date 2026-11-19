import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type {
  ScrollViewProps,
  TextInputProps,
  TextProps,
  TextStyle,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/* -------------------------------------------------------------------------- */
/* Text                                                                       */
/* -------------------------------------------------------------------------- */

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label'
  | 'tiny';

export type TextTone =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'primary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'inverse';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  center?: boolean;
}

const textVariants: Record<TextVariant, TextStyle> = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.3 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  subheading: { fontSize: 17, lineHeight: 23, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.7 },
  tiny: { fontSize: 11, lineHeight: 15, fontWeight: '600' },
};

export function AppText({
  variant = 'body',
  tone = 'default',
  center,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const color =
    tone === 'secondary'
      ? theme.textSecondary
      : tone === 'muted'
        ? theme.textMuted
        : tone === 'primary'
          ? theme.primary
          : tone === 'danger'
            ? theme.danger
            : tone === 'success'
              ? theme.success
              : tone === 'warning'
                ? theme.warning
                : tone === 'inverse'
                  ? theme.primaryContrast
                  : theme.text;

  return (
    <Text
      style={[
        textVariants[variant],
        { color },
        center && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

export function Screen({ children, style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: theme.background }, style]}
      edges={['top', 'left', 'right']}
      {...rest}>
      {children}
    </SafeAreaView>
  );
}

export function ScreenScroll({
  children,
  contentContainerStyle,
  ...rest
}: ScrollViewProps & { children: ReactNode }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        { paddingHorizontal: Spacing.four, paddingBottom: Spacing.nine },
        contentContainerStyle,
      ]}
      {...rest}>
      {children}
    </ScrollView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  right,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && { opacity: 0.6 },
          ]}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <AppText variant="heading" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="secondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="subheading">{title}</AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <AppText variant="caption" tone="primary" style={{ fontWeight: '700' }}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : (
        <View style={{ width: 1, backgroundColor: theme.border, opacity: 0 }} />
      )}
    </View>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  const theme = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }, style]} />;
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

export interface CardProps extends ViewProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  padded?: boolean;
  tone?: 'surface' | 'alt' | 'primary';
  accentColor?: string;
}

export function Card({
  children,
  onPress,
  onLongPress,
  padded = true,
  tone = 'surface',
  accentColor,
  style,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const backgroundColor =
    tone === 'alt' ? theme.surfaceAlt : tone === 'primary' ? theme.primarySoft : theme.surface;

  const cardStyle: ViewStyle = {
    backgroundColor,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: tone === 'primary' ? theme.primary : theme.border,
    padding: padded ? Spacing.four : 0,
    overflow: 'hidden',
  };

  const content = (
    <>
      {accentColor ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: accentColor,
          }}
        />
      ) : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          cardStyle,
          accentColor ? { paddingLeft: Spacing.four + 4 } : null,
          style,
          pressed && { opacity: 0.85 },
        ]}
        {...rest}>
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[cardStyle, accentColor ? { paddingLeft: Spacing.four + 4 } : null, style]}
      {...rest}>
      {content}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  fullWidth = true,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const background =
    variant === 'primary'
      ? theme.primary
      : variant === 'danger'
        ? theme.danger
        : variant === 'secondary'
          ? theme.primarySoft
          : 'transparent';
  const foreground =
    variant === 'primary'
      ? theme.primaryContrast
      : variant === 'danger'
        ? theme.dangerContrast
        : variant === 'secondary'
          ? theme.primary
          : variant === 'ghost'
            ? theme.primary
            : theme.text;
  const borderColor =
    variant === 'outline' ? theme.borderStrong : variant === 'secondary' ? theme.primary : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(isDisabled), busy: Boolean(loading) }}
      style={({ pressed }) => [
        {
          backgroundColor: background,
          borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0,
          borderColor,
          borderRadius: Radius.md,
          paddingVertical: size === 'sm' ? 10 : 15,
          paddingHorizontal: Spacing.four,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: Spacing.two,
          minHeight: size === 'sm' ? 40 : 52,
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.5 : pressed ? 0.82 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={foreground} /> : null}
          <Text
            style={{
              color: foreground,
              fontSize: size === 'sm' ? 14 : 16,
              fontWeight: '700',
            }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  tone = 'default',
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  tone?: 'default' | 'danger';
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: tone === 'danger' ? theme.dangerSoft : theme.surface,
          borderColor: theme.border,
        },
        pressed && { opacity: 0.6 },
      ]}>
      <Ionicons
        name={icon}
        size={20}
        color={tone === 'danger' ? theme.danger : theme.text}
      />
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Badge / pill                                                               */
/* -------------------------------------------------------------------------- */

export type BadgeTone = 'fraud' | 'normal' | 'neutral' | 'info' | 'warning' | 'primary';

export function Badge({
  label,
  tone = 'neutral',
  icon,
  size = 'md',
}: {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
  size?: 'sm' | 'md';
}) {
  const theme = useTheme();
  const background =
    tone === 'fraud'
      ? theme.dangerSoft
      : tone === 'normal'
        ? theme.successSoft
        : tone === 'info'
          ? theme.infoSoft
          : tone === 'warning'
            ? theme.warningSoft
            : tone === 'primary'
              ? theme.primarySoft
              : theme.surfaceAlt;
  const foreground =
    tone === 'fraud'
      ? theme.danger
      : tone === 'normal'
        ? theme.success
        : tone === 'info'
          ? theme.info
          : tone === 'warning'
            ? theme.warning
            : tone === 'primary'
              ? theme.primary
              : theme.textSecondary;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: background,
        paddingHorizontal: size === 'sm' ? 8 : 10,
        paddingVertical: size === 'sm' ? 3 : 5,
        borderRadius: Radius.pill,
      }}>
      {icon ? <Ionicons name={icon} size={size === 'sm' ? 11 : 13} color={foreground} /> : null}
      <Text
        style={{
          color: foreground,
          fontSize: size === 'sm' ? 11 : 12,
          fontWeight: '700',
          letterSpacing: 0.2,
        }}>
        {label}
      </Text>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingHorizontal: 13,
          paddingVertical: 8,
          borderRadius: Radius.pill,
          borderWidth: 1,
          borderColor: selected ? theme.primary : theme.border,
          backgroundColor: selected ? theme.primary : theme.surface,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? theme.primaryContrast : theme.textSecondary}
        />
      ) : null}
      <Text
        style={{
          color: selected ? theme.primaryContrast : theme.textSecondary,
          fontSize: 13,
          fontWeight: '600',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Input                                                                      */
/* -------------------------------------------------------------------------- */

export interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  icon?: IconName;
  rightIcon?: IconName;
  onRightPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  hint,
  error,
  icon,
  rightIcon,
  onRightPress,
  containerStyle,
  multiline,
  style,
  ...rest
}: InputProps) {
  const theme = useTheme();
  return (
    <View style={[{ gap: 7 }, containerStyle]}>
      {label ? <AppText variant="caption" style={{ fontWeight: '600' }}>{label}</AppText> : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: theme.inputBackground,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: error ? theme.danger : theme.border,
          paddingHorizontal: Spacing.three,
          minHeight: multiline ? 132 : 50,
        }}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={theme.textMuted}
            style={{ marginRight: 9, marginTop: multiline ? 14 : 0 }}
          />
        ) : null}
        <TextInput
          placeholderTextColor={theme.textMuted}
          selectionColor={theme.primary}
          multiline={multiline}
          style={[
            {
              flex: 1,
              color: theme.text,
              fontSize: 15,
              lineHeight: 21,
              paddingVertical: multiline ? 13 : 0,
              minHeight: multiline ? 130 : 48,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            style,
          ]}
          {...rest}
        />
        {rightIcon ? (
          <Pressable
            onPress={onRightPress}
            hitSlop={10}
            style={{ padding: 4, marginTop: multiline ? 8 : 0 }}>
            <Ionicons name={rightIcon} size={19} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Callout / empty state / progress                                           */
/* -------------------------------------------------------------------------- */

export type CalloutTone = 'info' | 'warning' | 'danger' | 'success';

export function Callout({
  tone = 'info',
  title,
  body,
  icon,
  children,
}: {
  tone?: CalloutTone;
  title?: string;
  body?: string;
  icon?: IconName;
  children?: ReactNode;
}) {
  const theme = useTheme();
  const background =
    tone === 'danger'
      ? theme.dangerSoft
      : tone === 'warning'
        ? theme.warningSoft
        : tone === 'success'
          ? theme.successSoft
          : theme.infoSoft;
  const foreground =
    tone === 'danger'
      ? theme.danger
      : tone === 'warning'
        ? theme.warning
        : tone === 'success'
          ? theme.success
          : theme.info;
  const defaultIcon: IconName =
    tone === 'danger'
      ? 'alert-circle'
      : tone === 'warning'
        ? 'warning'
        : tone === 'success'
          ? 'checkmark-circle'
          : 'information-circle';

  return (
    <View
      style={{
        backgroundColor: background,
        borderRadius: Radius.md,
        padding: Spacing.three,
        flexDirection: 'row',
        gap: Spacing.three,
        alignItems: 'flex-start',
      }}>
      <Ionicons name={icon ?? defaultIcon} size={21} color={foreground} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, gap: 3 }}>
        {title ? (
          <AppText variant="bodyStrong" style={{ color: foreground }}>
            {title}
          </AppText>
        ) : null}
        {body ? (
          <AppText variant="caption" style={{ color: foreground, opacity: 0.92 }}>
            {body}
          </AppText>
        ) : null}
        {children}
      </View>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.emptyState}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: theme.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.four,
        }}>
        <Ionicons name={icon} size={32} color={theme.primary} />
      </View>
      <AppText variant="subheading" center>
        {title}
      </AppText>
      <AppText variant="caption" tone="secondary" center style={{ marginTop: 6, maxWidth: 280 }}>
        {body}
      </AppText>
      {action ? <View style={{ marginTop: Spacing.five, width: '100%', maxWidth: 280 }}>{action}</View> : null}
    </View>
  );
}

export function ProgressBar({
  value,
  tone = 'primary',
  height = 8,
}: {
  value: number;
  tone?: 'primary' | 'danger' | 'success' | 'warning';
  height?: number;
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
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{ height, borderRadius: height, backgroundColor: theme.surfaceAlt, overflow: 'hidden' }}>
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          borderRadius: height,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* List row / accordion                                                       */
/* -------------------------------------------------------------------------- */

export function ListRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  showChevron = true,
  right,
  tone = 'default',
  last,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  right?: ReactNode;
  tone?: 'default' | 'danger';
  last?: boolean;
}) {
  const theme = useTheme();
  const content = (
    <>
      {icon ? (
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: tone === 'danger' ? theme.dangerSoft : theme.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons
            name={icon}
            size={19}
            color={tone === 'danger' ? theme.danger : theme.primary}
          />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong" tone={tone === 'danger' ? 'danger' : 'default'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="caption" tone="muted">
          {value}
        </AppText>
      ) : null}
      {right ?? (showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
      ) : null)}
    </>
  );

  return (
    <View>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.listRow,
            pressed && { backgroundColor: theme.surfaceAlt },
          ]}>
          {content}
        </Pressable>
      ) : (
        <View style={styles.listRow}>{content}</View>
      )}
      {last ? null : <Divider style={{ marginLeft: icon ? 54 : 0 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
});
