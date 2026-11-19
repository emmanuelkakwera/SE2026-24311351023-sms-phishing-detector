import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Badge,
  Button,
  Callout,
  Card,
  Input,
  Screen,
  ScreenScroll,
  SectionHeader,
} from '@/components/ui';
import { EXAMPLE_MESSAGES } from '@/data/awareness';
import { useTheme } from '@/hooks/use-theme';
import { MAX_MESSAGE_LENGTH } from '@/lib/classifier';
import { useApp } from '@/providers/app-provider';
import { useProtection } from '@/providers/protection-provider';

const SAMPLES = [
  EXAMPLE_MESSAGES[0],
  EXAMPLE_MESSAGES[2],
  EXAMPLE_MESSAGES[3],
  EXAMPLE_MESSAGES[4],
].filter(Boolean);

export default function ScanScreen() {
  const theme = useTheme();
  const { addScan, settings } = useApp();
  const { supported, active } = useProtection();
  const params = useLocalSearchParams<{ sample?: string }>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedSample, setAppliedSample] = useState<string>();

  const sample = typeof params.sample === 'string' ? params.sample : undefined;
  // Adjust state during render when a new example is handed to the detector.
  if (sample !== appliedSample) {
    setAppliedSample(sample);
    if (sample) {
      setMessage(sample.slice(0, MAX_MESSAGE_LENGTH));
      setError('');
    }
  }

  async function handlePaste() {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text.trim()) {
        setError('Your clipboard is empty. Copy an SMS first and try again.');
        return;
      }
      setMessage(text.slice(0, MAX_MESSAGE_LENGTH));
      setError('');
      if (settings.hapticsEnabled) {
        void Haptics.selectionAsync().catch(() => undefined);
      }
    } catch {
      setError('MoneyGuard could not read the clipboard.');
    }
  }

  async function handleScan() {
    setError('');
    setLoading(true);
    try {
      const record = await addScan(message);
      setMessage('');
      router.push(`/result/${record.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The message could not be analysed.');
    } finally {
      setLoading(false);
    }
  }

  function loadSample(sample: string) {
    setMessage(sample);
    setError('');
    if (settings.hapticsEnabled) {
      void Haptics.selectionAsync().catch(() => undefined);
    }
  }

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={{ paddingTop: 10, gap: 18 }}>
        <View style={{ gap: 4 }}>
          <AppText variant="title">SMS Detector</AppText>
          <AppText variant="caption" tone="secondary">
            Check a message manually by pasting or typing it. On Android, incoming SMS is also
            checked automatically when protection is on.
          </AppText>
        </View>

        <Card style={{ gap: 13 }}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="chatbox-ellipses-outline" size={19} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">Message to check</AppText>
              <AppText variant="tiny" tone="muted">
                {message.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()} characters
              </AppText>
            </View>
            <Pressable
              onPress={handlePaste}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.pasteButton,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                pressed && { opacity: 0.7 },
              ]}>
              <Ionicons name="clipboard-outline" size={15} color={theme.text} />
              <AppText variant="caption" style={{ fontWeight: '600' }}>
                Paste
              </AppText>
            </Pressable>
          </View>

          <Input
            placeholder="Paste or type the SMS exactly as you received it…"
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              if (error) setError('');
            }}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
            autoCapitalize="none"
            autoCorrect={false}
            textAlignVertical="top"
          />

          {error ? <Callout tone="danger" title="Cannot scan yet" body={error} /> : null}

          <Button
            label={loading ? 'Analysing…' : 'Analyse message'}
            icon="shield-checkmark-outline"
            loading={loading}
            onPress={handleScan}
            disabled={!message.trim()}
          />

          <View style={styles.privacyRow}>
            <Ionicons name="lock-closed-outline" size={13} color={theme.textMuted} />
            <AppText variant="tiny" tone="muted">
              Your message never leaves this device.
            </AppText>
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Try an example" />
          <View style={{ gap: 8 }}>
            {SAMPLES.map((sample) => (
              <Card
                key={sample.id}
                onPress={() => loadSample(sample.message)}
                style={{ padding: 13 }}>
                <View style={styles.sampleTop}>
                  <Badge
                    label={sample.badge === 'fraud' ? 'SCAM EXAMPLE' : 'GENUINE EXAMPLE'}
                    tone={sample.badge}
                    size="sm"
                  />
                  <Ionicons name="arrow-up-left-box" size={14} color={theme.textMuted} />
                </View>
                <AppText variant="caption" tone="secondary" numberOfLines={2} style={{ marginTop: 7 }}>
                  {sample.message}
                </AppText>
              </Card>
            ))}
          </View>
        </View>

        <Callout
          tone="info"
          title="How the check works"
          body="The message is converted into TF-IDF word and phrase features, then scored by a Logistic Regression model trained on 1,070 English and Chichewa SMS examples. You will see the strongest text signals behind the result."
        />

        <Callout
          tone={supported ? (active ? 'success' : 'warning') : 'info'}
          title={
            supported
              ? active
                ? 'Automatic protection is on'
                : 'Automatic protection is off'
              : 'Manual checks only'
          }
          body={
            supported
              ? active
                ? 'Incoming carrier SMS is checked as it arrives. Use this screen for messages you want to re-check, such as an old SMS or one someone forwarded to you.'
                : 'SMS permission or monitoring is switched off, so incoming messages are not being checked. Turn protection on to get automatic fraud alerts.'
              : 'Automatic SMS monitoring is available in the installed Android app. This build can still check messages you paste here.'
          }>
          {supported && !active ? (
            <Button
              label="Open protection settings"
              variant="outline"
              size="sm"
              fullWidth={false}
              onPress={() => router.push('/protection')}
            />
          ) : null}
        </Callout>

        <View style={styles.hintRow}>
          <Ionicons name="information-circle-outline" size={15} color={theme.textMuted} />
          <AppText variant="tiny" tone="muted" style={{ flex: 1 }}>
            A prediction is not proof. Always verify unexpected requests with your provider using an
            official number or app.
          </AppText>
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  sampleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, paddingHorizontal: 4 },
});
