import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { AppText, Button, Callout, Input, Screen, ScreenScroll } from '@/components/ui';
import { useApp } from '@/providers/app-provider';

export default function SignUpScreen() {
  const { signUp } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await signUp(name, email, password);
      router.replace('/');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Could not create the account. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={{ paddingTop: 20, gap: 22 }}>
        <View style={styles.topRow}>
          <BrandMark size="sm" />
          <Button
            label="Sign in"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={() => router.replace('/sign-in')}
          />
        </View>

        <View style={{ gap: 6 }}>
          <AppText variant="title">Create your account</AppText>
          <AppText variant="body" tone="secondary">
            A local profile protects your scan history with a password. It takes less than a
            minute.
          </AppText>
        </View>

        {error ? <Callout tone="danger" title="Check your details" body={error} /> : null}

        <View style={{ gap: 15 }}>
          <Input
            label="Full name"
            icon="person-outline"
            placeholder="e.g. Thoko Banda"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
          />
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
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightPress={() => setShowPassword((value) => !value)}
            autoCapitalize="none"
            autoComplete="new-password"
            hint="Use a password you do not use for mobile money."
            returnKeyType="next"
          />
          <Input
            label="Confirm password"
            icon="shield-checkmark-outline"
            placeholder="Repeat your password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            error={confirm && confirm !== password ? 'Passwords do not match.' : undefined}
          />
        </View>

        <Button
          label="Create account"
          icon="person-add-outline"
          loading={loading}
          onPress={handleSubmit}
        />

        <AppText variant="tiny" tone="muted" center>
          Your profile and scans are stored only on this device. MoneyGuard never asks for your
          mobile money PIN.
        </AppText>

        <Button
          label="Continue as guest instead"
          variant="ghost"
          onPress={() => router.replace('/welcome')}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
