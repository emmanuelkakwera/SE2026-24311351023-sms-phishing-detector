/**
 * MoneyGuard design tokens.
 *
 * Colours are defined for light and dark mode. Every screen reads them through
 * `useTheme()` so the look stays consistent across the whole app.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#F3F6F4',
    surface: '#FFFFFF',
    surfaceAlt: '#EAF1EC',
    surfaceRaised: '#FFFFFF',
    inputBackground: '#F7FAF8',
    border: '#DCE7E0',
    borderStrong: '#C4D6CA',
    text: '#14261D',
    textSecondary: '#5F6F66',
    textMuted: '#83938A',
    primary: '#176B4B',
    primaryDark: '#104B37',
    primarySoft: '#E3F2E9',
    primaryContrast: '#FFFFFF',
    accent: '#C98A13',
    accentSoft: '#FFF3D6',
    danger: '#B3261E',
    dangerSoft: '#FCEBEA',
    dangerContrast: '#FFFFFF',
    success: '#1D7A4F',
    successSoft: '#E6F5EC',
    warning: '#8A5A00',
    warningSoft: '#FFF3D6',
    info: '#215E8A',
    infoSoft: '#E7F1F8',
    tabBar: '#FFFFFF',
    shadow: '#0F2C1D',
    overlay: 'rgba(10, 24, 16, 0.45)',
    // Backwards-compatible aliases used by the starter components.
    backgroundElement: '#EAF1EC',
    backgroundSelected: '#DDEAE2',
  },
  dark: {
    background: '#0E1512',
    surface: '#17211C',
    surfaceAlt: '#1E2B24',
    surfaceRaised: '#1C2822',
    inputBackground: '#131D18',
    border: '#2C3A33',
    borderStrong: '#3C4E44',
    text: '#E7F0EA',
    textSecondary: '#AABBB1',
    textMuted: '#7E9085',
    primary: '#7DD3A8',
    primaryDark: '#5DB98B',
    primarySoft: '#1C382B',
    primaryContrast: '#0B2217',
    accent: '#F2C15B',
    accentSoft: '#3A2F10',
    danger: '#FF8A80',
    dangerSoft: '#3A1A18',
    dangerContrast: '#2A0D0B',
    success: '#7DD3A8',
    successSoft: '#173327',
    warning: '#F2C15B',
    warningSoft: '#3A2F10',
    info: '#8DC7E8',
    infoSoft: '#152B38',
    tabBar: '#121C17',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.55)',
    backgroundElement: '#1E2B24',
    backgroundSelected: '#27372E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type AppTheme = (typeof Colors)['light'];

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
  nine: 56,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 760;
export const TabBarSpace = 108;
