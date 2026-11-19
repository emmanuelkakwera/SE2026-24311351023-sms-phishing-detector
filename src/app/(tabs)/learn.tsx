import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Accordion } from '@/components/accordion';
import {
  AppText,
  Badge,
  Button,
  Card,
  Screen,
  ScreenScroll,
  SectionHeader,
} from '@/components/ui';
import {
  EXAMPLE_MESSAGES,
  RECOVERY_STEPS,
  SAFETY_TIPS,
  SCAM_TYPES,
  VIDEOS,
} from '@/data/awareness';
import { useTheme } from '@/hooks/use-theme';

export default function LearnScreen() {
  const theme = useTheme();

  async function openVideo(searchQuery: string) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  }

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={{ paddingTop: 10, gap: 22 }}>
        <View style={{ gap: 4 }}>
          <AppText variant="title">Learn & stay sharp</AppText>
          <AppText variant="caption" tone="secondary">
            Know how mobile money scammers operate before the next message arrives.
          </AppText>
        </View>

        <LinearGradient
          colors={theme.isDark ? ['#1C382B', '#12241B'] : ['#123B2A', '#176B4B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderColor: theme.isDark ? theme.border : 'transparent' }]}>
          <View style={styles.heroBadge}>
            <Ionicons name="school-outline" size={14} color="#D6EDE1" />
            <AppText variant="tiny" style={{ color: '#D6EDE1', letterSpacing: 1 }}>
              AWARENESS MODULE
            </AppText>
          </View>
          <AppText variant="title" style={{ color: '#FFFFFF', marginTop: 12 }}>
            Learn the tricks.{'\n'}Spot the scam.
          </AppText>
          <AppText variant="caption" style={{ color: '#D3EBDF', marginTop: 7 }}>
            Six patterns cover most mobile money scams reported on Airtel Money and TNM Mpamba.
          </AppText>
          <View style={{ marginTop: 15 }}>
            <Button
              label="Take the 2-minute quiz"
              icon="help-buoy-outline"
              onPress={() => router.push('/practice')}
              style={{ backgroundColor: '#FFFFFF' }}
            />
          </View>
        </LinearGradient>

        <View style={{ gap: 11 }}>
          <SectionHeader title="Common scam types" />
          {SCAM_TYPES.map((scam) => (
            <Card
              key={scam.id}
              onPress={() => router.push(`/learn/${scam.id}`)}
              accentColor={scam.badge === 'fraud' ? theme.danger : theme.success}
              style={{ gap: 8 }}>
              <View style={styles.scamTop}>
                <Badge
                  label={scam.badge === 'fraud' ? 'FRAUD' : 'NORMAL'}
                  tone={scam.badge}
                  size="sm"
                />
                <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
              </View>
              <AppText variant="bodyStrong">{scam.title}</AppText>
              <AppText variant="caption" tone="secondary" numberOfLines={3}>
                {scam.summary}
              </AppText>
            </Card>
          ))}
        </View>

        <View style={{ gap: 11 }}>
          <SectionHeader title="Example messages" />
          {EXAMPLE_MESSAGES.slice(0, 3).map((example) => (
            <Card key={example.id} style={{ gap: 8 }}>
              <Badge
                label={example.badge === 'fraud' ? 'FRAUDULENT' : 'LEGITIMATE'}
                tone={example.badge}
                size="sm"
              />
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.border,
                  },
                ]}>
                <AppText variant="caption" style={{ fontStyle: 'italic' }}>
                  {example.message}
                </AppText>
              </View>
              <AppText variant="caption" tone="secondary">
                <AppText variant="caption" style={{ fontWeight: '700' }}>
                  Why:{' '}
                </AppText>
                {example.why}
              </AppText>
            </Card>
          ))}
        </View>

        <View style={{ gap: 11 }}>
          <SectionHeader title="Watch & learn" />
          {VIDEOS.map((video) => (
            <Pressable
              key={video.id}
              onPress={() => void openVideo(video.searchQuery)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.videoRow,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <View style={[styles.playButton, { backgroundColor: theme.primary }]}>
                <Ionicons name="play" size={20} color={theme.primaryContrast} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">{video.title}</AppText>
                <AppText variant="caption" tone="secondary" numberOfLines={2}>
                  {video.description}
                </AppText>
              </View>
              <Ionicons name="open-outline" size={17} color={theme.textMuted} />
            </Pressable>
          ))}
          <AppText variant="tiny" tone="muted">
            Videos open a YouTube search in your browser.
          </AppText>
        </View>

        <View style={{ gap: 11 }}>
          <SectionHeader title="Safety tips" />
          {SAFETY_TIPS.map((tip) => (
            <Accordion key={tip.id} title={tip.title} icon="shield-checkmark-outline">
              <AppText variant="caption" tone="secondary">
                {tip.body}
              </AppText>
            </Accordion>
          ))}
        </View>

        <View style={{ gap: 11 }}>
          <SectionHeader title="If you receive a scam SMS" />
          {RECOVERY_STEPS.map((step, index) => (
            <Card key={step.id} style={{ padding: 13 }}>
              <View style={{ flexDirection: 'row', gap: 11 }}>
                <View style={[styles.stepNum, { backgroundColor: theme.primarySoft }]}>
                  <AppText variant="caption" tone="primary" style={{ fontWeight: '800' }}>
                    {index + 1}
                  </AppText>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong">{step.title}</AppText>
                  <AppText variant="caption" tone="secondary">
                    {step.body}
                  </AppText>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Button
          label="Report a scam to support"
          variant="outline"
          icon="headset-outline"
          onPress={() => router.push('/support')}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, padding: 19, borderWidth: 1 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  scamTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bubble: { borderRadius: 12, borderWidth: 1, padding: 11 },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  playButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  stepNum: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
