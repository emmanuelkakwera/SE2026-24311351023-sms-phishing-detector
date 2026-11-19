import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { StatCard } from '@/components/stat-card';
import {
  AppText,
  Badge,
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
import { formatDate, formatPercent, initials } from '@/lib/format';
import { useApp } from '@/providers/app-provider';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, isGuest, scans, updateProfile, changePassword, signOut } = useApp();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(isGuest ? '' : (user?.email ?? ''));
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const fraudCount = scans.filter((scan) => scan.label === 'fraud').length;
  const safeCount = scans.length - fraudCount;
  const averageConfidence = scans.length
    ? scans.reduce((total, scan) => total + scan.confidence, 0) / scans.length
    : 0;

  async function saveProfile() {
    setProfileError('');
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      await updateProfile({ name, email: isGuest ? user?.email : email });
      setProfileSaved(true);
    } catch (caught) {
      setProfileError(caught instanceof Error ? caught.message : 'Could not update the profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    setPasswordError('');
    setPasswordSaved(false);
    if (nextPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, nextPassword);
      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
    } catch (caught) {
      setPasswordError(caught instanceof Error ? caught.message : 'Could not change the password.');
    } finally {
      setSavingPassword(false);
    }
  }

  async function shareSummary() {
    await Share.share({
      message: [
        `My MoneyGuard protection summary`,
        `Messages scanned: ${scans.length}`,
        `Scams caught: ${fraudCount}`,
        `Likely safe: ${safeCount}`,
        '',
        'MoneyGuard checks mobile money SMS offline — no message leaves the phone.',
      ].join('\n'),
      title: 'MoneyGuard summary',
    });
  }

  if (!user) {
    return (
      <Screen>
        <ScreenHeader title="Profile" />
        <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
          <Callout
            tone="warning"
            title="No active profile"
            body="Sign in or continue as a guest to use MoneyGuard."
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Profile" subtitle="Your local MoneyGuard identity" />
      <ScreenScroll contentContainerStyle={{ gap: 16, paddingTop: 8 }}>
        <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 22 }}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <AppText variant="title" style={{ color: theme.primaryContrast }}>
              {initials(user.name)}
            </AppText>
          </View>
          <AppText variant="heading">{user.name}</AppText>
          <Badge
            label={isGuest ? 'GUEST PROFILE' : 'PROTECTED PROFILE'}
            tone={isGuest ? 'warning' : 'normal'}
            icon={isGuest ? 'person-outline' : 'shield-checkmark'}
            size="sm"
          />
          <AppText variant="caption" tone="secondary">
            {isGuest ? 'Stored only on this device' : user.email}
          </AppText>
          <AppText variant="tiny" tone="muted">
            Joined {formatDate(user.createdAt)}
          </AppText>
        </Card>

        <View style={styles.statsRow}>
          <StatCard icon="documents-outline" value={String(scans.length)} label="Scans" />
          <StatCard icon="warning-outline" value={String(fraudCount)} label="Scams" tone="danger" />
          <StatCard
            icon="analytics-outline"
            value={formatPercent(averageConfidence)}
            label="Avg. confidence"
            tone="success"
          />
        </View>

        <Button
          label="Share protection summary"
          variant="outline"
          icon="share-social-outline"
          onPress={() => void shareSummary()}
        />

        <Card style={{ gap: 13 }}>
          <SectionHeader title="Edit profile" />
          {profileSaved ? (
            <Callout tone="success" title="Profile updated" body="Your changes are saved on this device." />
          ) : null}
          {profileError ? <Callout tone="danger" title="Could not save" body={profileError} /> : null}
          <Input
            label="Full name"
            icon="person-outline"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          {isGuest ? (
            <Callout
              tone="info"
              title="Guest profiles do not need an email"
              body="Sign out and create an account if you want a password-protected profile."
            />
          ) : (
            <Input
              label="Email address"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          )}
          <Button
            label="Save profile"
            icon="save-outline"
            loading={savingProfile}
            disabled={!name.trim()}
            onPress={saveProfile}
          />
        </Card>

        {isGuest ? (
          <Card tone="alt" style={{ gap: 9 }}>
            <AppText variant="bodyStrong">Want password protection?</AppText>
            <AppText variant="caption" tone="secondary">
              Sign out and create an account from the welcome screen. Guest scans stay under the
              guest profile on this device.
            </AppText>
          </Card>
        ) : (
          <Card style={{ gap: 13 }}>
            <SectionHeader title="Change password" />
            {passwordSaved ? (
              <Callout
                tone="success"
                title="Password changed"
                body="Use your new password the next time you sign in."
              />
            ) : null}
            {passwordError ? (
              <Callout tone="danger" title="Could not change password" body={passwordError} />
            ) : null}
            <Input
              label="Current password"
              icon="lock-closed-outline"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Input
              label="New password"
              icon="key-outline"
              value={nextPassword}
              onChangeText={setNextPassword}
              secureTextEntry
              autoCapitalize="none"
              hint="At least 6 characters."
            />
            <Input
              label="Confirm new password"
              icon="shield-checkmark-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              error={confirmPassword && confirmPassword !== nextPassword ? 'Passwords do not match.' : undefined}
            />
            <Button
              label="Update password"
              icon="lock-closed-outline"
              loading={savingPassword}
              disabled={!currentPassword || nextPassword.length < 6}
              onPress={savePassword}
            />
          </Card>
        )}

        <View style={{ gap: 9 }}>
          <Button
            label="Settings"
            variant="secondary"
            icon="settings-outline"
            onPress={() => router.push('/settings')}
          />
          <Button
            label="About MoneyGuard"
            variant="outline"
            icon="information-circle-outline"
            onPress={() => router.push('/about')}
          />
          <Button
            label="Sign out"
            variant="ghost"
            icon="log-out-outline"
            onPress={async () => {
              await signOut();
              router.replace('/welcome');
            }}
          />
        </View>

        <View style={styles.noteRow}>
          <Ionicons name="phone-portrait-outline" size={14} color={theme.textMuted} />
          <AppText variant="tiny" tone="muted" style={{ flex: 1 }}>
            Your profile, password hash, and scans are stored only in this app’s local storage.
          </AppText>
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 9 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, paddingHorizontal: 4 },
});
