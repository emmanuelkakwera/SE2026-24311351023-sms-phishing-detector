import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { AppText, Button, Screen, ScreenScroll } from '@/components/ui';
import { useApp } from '@/providers/app-provider';
import { useProtection } from '@/providers/protection-provider';
import { useTheme } from '@/hooks/use-theme';

const FEATURES = [
  {
    icon: 'notifications-outline' as const,
    title: 'Automatic SMS checks',
    body: 'Incoming carrier SMS is checked as it arrives, and suspicious messages trigger an alert.',
  },
  {
    icon: 'phone-portrait-outline' as const,
    title: 'On-device model',
    body: 'The trained model is bundled with the app — no internet connection needed.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Clear explanations',
    body: 'See which words pushed the model towards fraud or safety.',
  },
  {
    icon: 'lock-closed-outline' as const,
    title: 'Private by design',
    body: 'Messages stay on your phone. Nothing is uploaded to a server.',
  },
];

export default function WelcomeScreen() {
  const theme = useTheme();
  const { continueAsGuest } = useApp();
  const { supported, requestPermissions } = useProtection();
  const [guestLoading, setGuestLoading] = useState(false);
  const [protectLoading, setProtectLoading] = useState(false);

  async function handleProtect() {
    setProtectLoading(true);
    try {
      if (supported) {
        await requestPermissions();
      }
      await continueAsGuest();
      router.replace('/');
    } finally {
      setProtectLoading(false);
    }
  }

  async function handleGuest() {
    setGuestLoading(true);
    try {
      await continueAsGuest();
      router.replace('/');
    } finally {
      setGuestLoading(false);
    }
  }

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={{ paddingTop: 18, gap: 26 }}>
        <BrandMark size="lg" showTagline />

        <View style={{ gap: 12 }}>
          <AppText variant="display">Stop SMS scams before they cost you.</AppText>
          <AppText variant="body" tone="secondary">
            MoneyGuard checks incoming mobile money messages for signs of fraud — automatically,
            instantly, and without sending your SMS anywhere.
          </AppText>
        </View>

        <LinearGradient
          colors={['#176B4B', '#0A3A27']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
            </View>
            <AppText variant="tiny" style={{ color: '#CBEADB', letterSpacing: 1.2 }}>
              BUILT FOR MALAWI
            </AppText>
          </View>
          <AppText variant="heading" style={{ color: '#FFFFFF', marginTop: 14 }}>
            Protection while messages arrive.
          </AppText>
          <AppText variant="caption" style={{ color: '#D3EBDF', marginTop: 6 }}>
            Incoming SMS is checked on your phone. Fraud alerts show the sender, a preview, and what
            to do next. Trained on 1,070 English and Chichewa SMS messages.
          </AppText>
        </LinearGradient>

        <View style={{ gap: 14 }}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureRow}>
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: theme.primarySoft, borderColor: theme.border },
                ]}>
                <Ionicons name={feature.icon} size={19} color={theme.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">{feature.title}</AppText>
                <AppText variant="caption" tone="secondary">
                  {feature.body}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          <Button
            label={supported ? 'Turn on automatic protection' : 'Continue to MoneyGuard'}
            icon={supported ? 'shield-checkmark-outline' : 'arrow-forward-outline'}
            loading={protectLoading}
            onPress={handleProtect}
          />
          <Button
            label="Create a free account"
            variant="outline"
            icon="person-add-outline"
            onPress={() => router.push('/sign-up')}
          />
          <Button
            label="I already have an account"
            variant="ghost"
            icon="log-in-outline"
            onPress={() => router.push('/sign-in')}
          />
          <Button
            label="Continue as guest"
            variant="ghost"
            loading={guestLoading}
            onPress={handleGuest}
          />
        </View>

        <AppText variant="tiny" tone="muted" center style={{ paddingHorizontal: 10 }}>
          Automatic SMS monitoring requires the installed Android app and SMS permission. It never
          replaces your SMS app, and it cannot read RCS, WhatsApp, or other chat apps. Guest profiles
          keep results on this device only.
        </AppText>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { borderRadius: 22, padding: 20 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureRow: { flexDirection: 'row', gap: 13, alignItems: 'flex-start' },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
