import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/providers/app-provider';

export type ColorSchemeName = 'light' | 'dark';

/**
 * Resolve the app palette from the saved theme preference, falling back to the
 * operating-system appearance when the preference is "system".
 */
export function useTheme() {
  const systemScheme = useColorScheme();
  const { settings } = useApp();
  const scheme: ColorSchemeName =
    settings.theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : settings.theme;

  return {
    ...Colors[scheme],
    scheme,
    isDark: scheme === 'dark',
  };
}
