import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui';
import { getScamType, SCAM_TYPES } from '@/data/awareness';
import { useTheme } from '@/hooks/use-theme';

export default function ScamDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scam = getScamType(id ?? '');

  if (!scam) {
    return (
      <Screen>
        <ScreenHeader title="Scam guide" />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
          <EmptyState
            icon="book-outline"
            title="Guide not found"
            body="The awareness article you were looking for does not exist."
            action={<Button label="Back to Learn" onPress={() => router.replace('/learn')} />}
          />
        </View>
      </Screen>
    );
  }

  const isFraud = scam.badge === 'fraud';
  const accent = isFraud ? theme.danger : theme.success;
  const related = SCAM_TYPES.filter((item) => item.id !== scam.id).slice(0, 3);

  return (
    <Screen>
      <ScreenHeader title="Scam guide" subtitle={isFraud ? 'Fraud pattern' : 'Genuine pattern'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}>
        <Card accentColor={accent} style={{ gap: 10 }}>
          <Badge
            label={isFraud ? 'FRAUD PATTERN' : 'GENUINE MESSAGE'}
            tone={scam.badge}
            icon={isFraud ? 'alert-circle' : 'shield-checkmark'}
          />
          <AppText variant="title">{scam.title}</AppText>
          <AppText variant="body" tone="secondary">
            {scam.summary}
          </AppText>
        </Card>

        <Card style={{ gap: 10 }}>
          <SectionHeader title="How it works" />
          <AppText variant="body" tone="secondary" style={{ lineHeight: 23 }}>
            {scam.overview}
          </AppText>
        </Card>

        <Card style={{ gap: 12 }}>
          <SectionHeader title="Example message" />
          <View
            style={[
              styles.bubble,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}>
            <AppText variant="caption" selectable style={{ fontStyle: 'italic', lineHeight: 20 }}>
              {scam.example}
            </AppText>
          </View>
          <Button
            label="Scan a similar message"
            variant="secondary"
            size="sm"
            icon="scan-outline"
            onPress={() =>
              router.push({ pathname: '/scan', params: { sample: scam.example } })
            }
          />
        </Card>

        <Card style={{ gap: 12 }}>
          <SectionHeader title="Red flags" />
          {scam.redFlags.map((flag) => (
            <View key={flag} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: theme.dangerSoft }]}>
                <Ionicons name="close" size={13} color={theme.danger} />
              </View>
              <AppText variant="caption" tone="secondary" style={{ flex: 1, lineHeight: 20 }}>
                {flag}
              </AppText>
            </View>
          ))}
        </Card>

        <Card style={{ gap: 12 }}>
          <SectionHeader title="How to stay safe" />
          {scam.staySafe.map((tip) => (
            <View key={tip} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: theme.successSoft }]}>
                <Ionicons name="checkmark" size={13} color={theme.success} />
              </View>
              <AppText variant="caption" tone="secondary" style={{ flex: 1, lineHeight: 20 }}>
                {tip}
              </AppText>
            </View>
          ))}
        </Card>

        {isFraud ? (
          <Callout
            tone="danger"
            title="Already responded?"
            body="Contact your mobile money provider immediately, change your PIN if you shared it, and report the incident to the police if money was lost."
          />
        ) : (
          <Callout
            tone="success"
            title="Still verify"
            body="Even genuine-looking alerts should be checked in your provider’s official app or USSD menu."
          />
        )}

        <View style={{ gap: 10 }}>
          <SectionHeader title="Related guides" />
          {related.map((item) => (
            <Card key={item.id} onPress={() => router.push(`/learn/${item.id}`)} style={{ padding: 13 }}>
              <View style={styles.relatedRow}>
                <Badge
                  label={item.badge === 'fraud' ? 'FRAUD' : 'NORMAL'}
                  tone={item.badge}
                  size="sm"
                />
                <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {item.title}
                </AppText>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </View>
            </Card>
          ))}
        </View>

        <Button
          label="Test yourself with the quiz"
          icon="help-buoy-outline"
          onPress={() => router.push('/practice')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bubble: { borderRadius: 12, borderWidth: 1, padding: 12 },
  bulletRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  bullet: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  relatedRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
});
