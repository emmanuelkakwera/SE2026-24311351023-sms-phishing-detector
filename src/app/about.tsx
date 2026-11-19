import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { StatCard } from '@/components/stat-card';
import {
  AppText,
  Badge,
  Callout,
  Card,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
} from '@/components/ui';
import { getModelInfo } from '@/lib/classifier';
import { formatPercent, pluralize } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';

export default function AboutScreen() {
  const theme = useTheme();
  const info = getModelInfo();
  const metrics = info.metrics;

  return (
    <Screen>
      <ScreenHeader title="About" subtitle="How MoneyGuard works" />
      <ScreenScroll contentContainerStyle={{ gap: 16, paddingTop: 8 }}>
        <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 22 }}>
          <BrandMark size="lg" showTagline />
          <Badge label="VERSION 1.0.0" tone="primary" size="sm" />
          <AppText variant="caption" tone="secondary" center style={{ maxWidth: 300 }}>
            Offline mobile money SMS phishing and fraud detection for Airtel Money and TNM Mpamba
            users in Malawi.
          </AppText>
        </Card>

        <View style={styles.statsRow}>
          <StatCard
            icon="layers-outline"
            value={metrics.datasetSize ? String(metrics.datasetSize) : '1,070'}
            label="Training messages"
          />
          <StatCard
            icon="text-outline"
            value={info.featureCount.toLocaleString()}
            label="TF-IDF features"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            icon="checkmark-done-outline"
            value={metrics.trainingAccuracy ? formatPercent(metrics.trainingAccuracy, 1) : '—'}
            label="Training accuracy"
            tone="success"
          />
          <StatCard
            icon="git-compare-outline"
            value={metrics.cvAccuracy ? formatPercent(metrics.cvAccuracy, 1) : '—'}
            label="5-fold CV accuracy"
            tone="primary"
          />
        </View>
        {metrics.fraudCount && metrics.normalCount ? (
          <AppText variant="tiny" tone="muted" center>
            Dataset: {pluralize(metrics.fraudCount, 'fraud message')} and{' '}
            {pluralize(metrics.normalCount, 'legitimate message')}.
          </AppText>
        ) : null}

        <Card style={{ gap: 10 }}>
          <SectionHeader title="How a scan works" />
          {[
            {
              icon: 'create-outline' as const,
              title: 'Normalise the text',
              body: 'The message is lower-cased and split into Unicode word tokens of two or more characters.',
            },
            {
              icon: 'albums-outline' as const,
              title: 'Build TF-IDF features',
              body: `Word and phrase features (${info.ngramRange}-grams) are weighted with the model’s learned IDF values and L2-normalised.`,
            },
            {
              icon: 'analytics-outline' as const,
              title: 'Score with Logistic Regression',
              body: 'The fitted coefficients and intercept produce a fraud probability. The higher probability becomes the label and confidence.',
            },
            {
              icon: 'list-outline' as const,
              title: 'Explain the result',
              body: 'The strongest weighted terms are shown as fraud or legitimate signals, so the prediction is not a black box.',
            },
          ].map((step, index) => (
            <View key={step.title} style={styles.stepRow}>
              <View style={[styles.stepIcon, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name={step.icon} size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">
                  {index + 1}. {step.title}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {step.body}
                </AppText>
              </View>
            </View>
          ))}
        </Card>

        <Card style={{ gap: 8 }}>
          <SectionHeader title="Offline and private" />
          <AppText variant="caption" tone="secondary">
            The vocabulary, IDF vector, coefficients, and intercept are bundled in the app as a
            JSON asset. Classification uses only device CPU and memory — there is no network call,
            no account server, and no analytics upload.
          </AppText>
          <View style={styles.chipRow}>
            <Badge label="NO INTERNET NEEDED" tone="normal" icon="cloud-offline-outline" size="sm" />
            <Badge label="NO PIN REQUESTS" tone="primary" icon="lock-closed-outline" size="sm" />
          </View>
        </Card>

        <Card style={{ gap: 9 }}>
          <SectionHeader title="Limitations" />
          <AppText variant="caption" tone="secondary">
            The model was trained on a modest dataset of 1,070 English and Chichewa messages. It can
            make mistakes, and new scam wording may not resemble the training examples. Use the
            result as one signal, not proof. Always verify unexpected requests with your provider.
          </AppText>
          <AppText variant="caption" tone="secondary">
            Automatic incoming-SMS monitoring requires the installed Android build with SMS
            permission and monitoring enabled. It is unavailable in Expo Go, on iOS, and on the web,
            where the manual paste checker remains available.
          </AppText>
        </Card>

        <Callout
          tone="info"
          title="Built with"
          body="Expo and React Native · scikit-learn TF-IDF + Logistic Regression · AsyncStorage · Expo Notifications and Clipboard. Training data combines English and Chichewa mobile money SMS."
        />

        <AppText variant="tiny" tone="muted" center>
          MoneyGuard · made for safer mobile money in Malawi
        </AppText>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 9 },
  stepRow: { flexDirection: 'row', gap: 11, alignItems: 'flex-start' },
  stepIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 2 },
});
