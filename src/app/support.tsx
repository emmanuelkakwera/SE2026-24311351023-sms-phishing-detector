import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { Accordion } from '@/components/accordion';
import {
  AppText,
  Button,
  Callout,
  Card,
  Input,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

const SUPPORT_PHONE = '+265982204439';
const WHATSAPP = 'https://wa.me/265982204439';

const FAQ = [
  {
    id: 'faq-money',
    title: 'I already sent money to a scammer. What now?',
    body: 'Contact your mobile money provider immediately and ask them to freeze or reverse the transaction if possible. Change your PIN, report the number to the provider, and file a police report. The sooner you act, the better the chance of limiting the loss.',
  },
  {
    id: 'faq-pin',
    title: 'I shared my PIN. Is my money gone?',
    body: 'Change your PIN immediately using your provider’s official USSD menu or app. Check your transaction history for anything you did not authorise and report it to your provider straight away.',
  },
  {
    id: 'faq-data',
    title: 'Does MoneyGuard upload my messages?',
    body: 'No. The classifier runs entirely on your phone using a bundled model. Scan history and your profile are stored locally with AsyncStorage. Nothing is sent to a MoneyGuard server because the app does not use one.',
  },
  {
    id: 'faq-accuracy',
    title: 'Can the detector be wrong?',
    body: 'Yes. No classifier is perfect. A "fraud" result means the text pattern resembles known scams, and "legitimate" means no strong scam signals were found. Always verify unexpected requests through an official channel.',
  },
  {
    id: 'faq-sms',
    title: 'Does MoneyGuard read my SMS?',
    body: 'On an installed Android build with SMS permission and monitoring switched on, MoneyGuard checks each incoming carrier SMS with the bundled model. It does not read your existing inbox, replace your SMS app, delete messages, or monitor RCS, WhatsApp, Messenger or other internet messaging apps. In Expo Go, on iOS, or with protection switched off, only messages you paste are checked.',
  },
];

export default function SupportScreen() {
  const theme = useTheme();
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');

  async function open(url: string) {
    setError('');
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        setError('This action is not supported on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      setError('The link could not be opened. Please try the phone number instead.');
    }
  }

  function reportOnWhatsApp() {
    const text = [
      'MoneyGuard scam report',
      subject.trim() ? `Subject: ${subject.trim()}` : '',
      details.trim(),
    ]
      .filter(Boolean)
      .join('\n\n');
    void open(`${WHATSAPP}?text=${encodeURIComponent(text)}`);
  }

  return (
    <Screen>
      <ScreenHeader title="Support" subtitle="Help, reporting & contact" />
      <ScreenScroll contentContainerStyle={{ gap: 16, paddingTop: 8 }}>
        <Callout
          tone="danger"
          title="Lost money right now?"
          body="Call your mobile money provider immediately, then report to the police. Do not wait for a reply on WhatsApp."
        />

        <Card style={{ gap: 13 }}>
          <View style={styles.contactTop}>
            <View style={[styles.contactIcon, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="headset-outline" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong">MoneyGuard support line</AppText>
              <AppText variant="caption" tone="secondary">
                {SUPPORT_PHONE} · calls and WhatsApp
              </AppText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <Button
              label="Call"
              icon="call-outline"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => void open(`tel:${SUPPORT_PHONE}`)}
            />
            <Button
              label="WhatsApp"
              icon="logo-whatsapp"
              variant="secondary"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => void open(WHATSAPP)}
            />
          </View>
          <Button
            label="Text the support line"
            icon="chatbubble-outline"
            variant="outline"
            size="sm"
            onPress={() => void open(`sms:${SUPPORT_PHONE}`)}
          />
        </Card>

        <Card style={{ gap: 12 }}>
          <SectionHeader title="Report a scam" />
          <AppText variant="caption" tone="secondary">
            Describe the message or incident. The form opens WhatsApp with your details ready to
            send — nothing is submitted automatically.
          </AppText>
          <Input
            label="Subject"
            placeholder="e.g. Fake reversal SMS"
            value={subject}
            onChangeText={setSubject}
            maxLength={80}
          />
          <Input
            label="What happened?"
            placeholder="Include the sender number, the message text, and whether you responded…"
            value={details}
            onChangeText={setDetails}
            multiline
            maxLength={1200}
          />
          {error ? <Callout tone="warning" title="Could not open WhatsApp" body={error} /> : null}
          <Button
            label="Continue in WhatsApp"
            icon="logo-whatsapp"
            disabled={details.trim().length < 10}
            onPress={reportOnWhatsApp}
          />
          <AppText variant="tiny" tone="muted">
            Never include your PIN, OTP, or password in a report.
          </AppText>
        </Card>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Frequently asked questions" />
          {FAQ.map((item) => (
            <Accordion key={item.id} title={item.title} icon="help-circle-outline">
              <AppText variant="caption" tone="secondary">
                {item.body}
              </AppText>
            </Accordion>
          ))}
        </View>

        <Card tone="alt" style={{ gap: 6 }}>
          <AppText variant="bodyStrong">Official provider contacts</AppText>
          <AppText variant="caption" tone="secondary">
            Airtel Money and TNM Mpamba publish their customer care numbers on their official
            websites and SIM packs. Use those numbers — never a number supplied by a suspicious SMS.
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <Ionicons name="lock-closed-outline" size={13} color={theme.textMuted} />
            <AppText variant="tiny" tone="muted">
              MoneyGuard staff will never ask for your PIN.
            </AppText>
          </View>
        </Card>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contactTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
