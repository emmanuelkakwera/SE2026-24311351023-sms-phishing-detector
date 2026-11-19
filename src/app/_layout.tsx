import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import type { Href } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { AppText } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { configureNotifications, extractNotificationUrl } from '@/lib/notifications';
import { AppProvider, useApp } from '@/providers/app-provider';
import { ProtectionProvider } from '@/providers/protection-provider';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function useNotificationObserver() {
  useEffect(() => {
    let active = true;

    function redirect(response: Notifications.NotificationResponse | null) {
      if (!active) return;
      const url = extractNotificationUrl(response);
      if (url) router.push(url as Href);
    }

    void Notifications.getLastNotificationResponseAsync().then(redirect);
    const subscription = Notifications.addNotificationResponseReceivedListener(redirect);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
}

function RootNavigator() {
  const theme = useTheme();
  const { ready, user } = useApp();
  useNotificationObserver();

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          backgroundColor: theme.background,
        }}>
        <BrandMark size="lg" showTagline />
        <ActivityIndicator color={theme.primary} />
        <AppText variant="caption" tone="muted">
          Loading your protected space…
        </AppText>
      </View>
    );
  }

  return (
    <ThemeProvider value={theme.isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Protected guard={Boolean(user)} redirectTo="/welcome">
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="result/[id]" />
          <Stack.Screen name="learn/[id]" />
          <Stack.Screen name="practice" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="support" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="about" />
          <Stack.Screen name="protection" />
        </Stack.Protected>

        {/* A fraud alert must open even when no local profile is signed in. */}
        <Stack.Screen name="detection/[id]" />

        <Stack.Protected guard={!user} redirectTo="/">
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void configureNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <ProtectionProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </ProtectionProvider>
    </SafeAreaProvider>
  );
}
