import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { AppText, Button, Callout, Input, Screen, ScreenScroll } from '@/components/ui';
import { useApp } from '@/providers/app-provider';

export default function SignInScreen() {
  const { signIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={{ paddingTop: 24, gap: 24 }}>
        <BrandMark />

        <View style={{ gap: 6 }}>
          <AppText variant="title">Welcome back</AppText>
          <AppText variant="body" tone="secondary">
            Sign in to see your saved scans and keep your protection settings.
          </AppText>
        </View>

        {error ? <Callout tone="danger" title="Sign-in failed" body={error} /> : null}

        <View style={{ gap: 16 }}>
          <Input
            label="Email address"
            icon="mail-outline"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="next"
          />
          <Input
            label="Password"
            icon="lock-closed-outline"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightPress={() => setShowPassword((value) => !value)}
            autoCapitalize="none"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />
        </View>

        <Button label="Sign in" icon="log-in-outline" loading={loading} onPress={handleSubmit} />

        <View style={styles.switchRow}>
          <AppText variant="caption" tone="secondary">
            New to MoneyGuard?
          </AppText>
          <Button
            label="Create an account"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={() => router.replace('/sign-up')}
          />
        </View>

        <Callout
          tone="info"
          title="Local accounts only"
          body="MoneyGuard accounts are stored on this device. There is no cloud password recovery, so keep your password safe."
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
});
