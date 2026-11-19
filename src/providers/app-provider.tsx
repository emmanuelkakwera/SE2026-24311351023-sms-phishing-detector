import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { classifyMessage } from '@/lib/classifier';
import { isValidEmail, normalizeEmail } from '@/lib/format';
import { hasNotificationPermission, notifyFraudScan } from '@/lib/notifications';
import { DEFAULT_SETTINGS, storage } from '@/lib/storage';
import type { AppSettings, ScanRecord, StoredAccount, User } from '@/types';

export class AppError extends Error {}

interface AppContextValue {
  ready: boolean;
  user: User | null;
  isGuest: boolean;
  settings: AppSettings;
  scans: ScanRecord[];
  notificationsSeenAt: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  continueAsGuest: (name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: { name?: string; email?: string }) => Promise<void>;
  changePassword: (currentPassword: string, nextPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  addScan: (message: string) => Promise<ScanRecord>;
  removeScan: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
}

function toUser(account: StoredAccount): User {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    createdAt: account.createdAt,
    isGuest: account.isGuest,
  };
}

function sortScans(scans: ScanRecord[]): ScanRecord[] {
  return [...scans].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [allScans, setAllScans] = useState<ScanRecord[]>([]);
  const [notificationsSeenAt, setNotificationsSeenAt] = useState<string | null>(null);
  const sessionUserRef = useRef<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const [accounts, session, scans, storedSettings, seenAt] = await Promise.all([
        storage.loadAccounts(),
        storage.loadSession(),
        storage.loadScans(),
        storage.loadSettings(),
        storage.loadNotificationsSeenAt(),
      ]);
      if (cancelled) return;

      if (session) {
        const account = accounts.find((item) => item.id === session.userId);
        if (account) {
          sessionUserRef.current = toUser(account);
          setUser(toUser(account));
        } else if (session.user) {
          sessionUserRef.current = session.user;
          setUser(session.user);
        }
      }

      setAllScans(sortScans(scans));
      setSettings(storedSettings);
      setNotificationsSeenAt(seenAt);
      setReady(true);
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistUser = useCallback(async (next: User | null) => {
    sessionUserRef.current = next;
    setUser(next);
    if (next) {
      await storage.saveSession(next.id, next.isGuest ? next : undefined);
    } else {
      await storage.clearSession();
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const normalized = normalizeEmail(email);
      if (!normalized || !password) {
        throw new AppError('Enter your email and password.');
      }
      const accounts = await storage.loadAccounts();
      const account = accounts.find((item) => item.email === normalized);
      if (!account) {
        throw new AppError('No MoneyGuard account matches that email.');
      }
      if (account.isGuest) {
        throw new AppError('This profile is a guest profile.');
      }
      const hash = await hashPassword(password, account.salt);
      if (hash !== account.passwordHash) {
        throw new AppError('The password you entered is incorrect.');
      }
      await persistUser(toUser(account));
    },
    [persistUser],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const cleanName = name.trim();
      const normalized = normalizeEmail(email);
      if (cleanName.length < 2) throw new AppError('Enter your full name.');
      if (!isValidEmail(normalized)) throw new AppError('Enter a valid email address.');
      if (password.length < 6) {
        throw new AppError('Choose a password with at least 6 characters.');
      }

      const accounts = await storage.loadAccounts();
      if (accounts.some((item) => item.email === normalized)) {
        throw new AppError('An account with that email already exists.');
      }

      const salt = Crypto.randomUUID();
      const account: StoredAccount = {
        id: Crypto.randomUUID(),
        name: cleanName,
        email: normalized,
        createdAt: new Date().toISOString(),
        salt,
        passwordHash: await hashPassword(password, salt),
      };
      await storage.saveAccounts([...accounts, account]);
      await persistUser(toUser(account));
    },
    [persistUser],
  );

  const continueAsGuest = useCallback(
    async (name?: string) => {
      const guest: User = {
        id: `guest-${Crypto.randomUUID()}`,
        name: name?.trim() || 'Guest',
        email: 'guest@local',
        createdAt: new Date().toISOString(),
        isGuest: true,
      };
      await persistUser(guest);
    },
    [persistUser],
  );

  const signOut = useCallback(async () => {
    await persistUser(null);
  }, [persistUser]);

  const updateProfile = useCallback(
    async (patch: { name?: string; email?: string }) => {
      const current = sessionUserRef.current;
      if (!current) throw new AppError('You need to be signed in first.');

      const cleanName = patch.name?.trim() ?? current.name;
      const normalized = patch.email ? normalizeEmail(patch.email) : current.email;
      if (cleanName.length < 2) throw new AppError('Enter your full name.');
      if (!current.isGuest && !isValidEmail(normalized)) {
        throw new AppError('Enter a valid email address.');
      }

      const next: User = { ...current, name: cleanName, email: normalized };

      if (current.isGuest) {
        await persistUser(next);
        return;
      }

      const accounts = await storage.loadAccounts();
      if (
        accounts.some((item) => item.email === normalized && item.id !== current.id)
      ) {
        throw new AppError('Another account already uses that email.');
      }
      const nextAccounts = accounts.map((item) =>
        item.id === current.id ? { ...item, name: cleanName, email: normalized } : item,
      );
      await storage.saveAccounts(nextAccounts);
      await persistUser(next);
    },
    [persistUser],
  );

  const changePassword = useCallback(
    async (currentPassword: string, nextPassword: string) => {
      const current = sessionUserRef.current;
      if (!current) throw new AppError('You need to be signed in first.');
      if (current.isGuest) {
        throw new AppError('Create an account to protect your scans with a password.');
      }
      if (nextPassword.length < 6) {
        throw new AppError('Choose a new password with at least 6 characters.');
      }

      const accounts = await storage.loadAccounts();
      const account = accounts.find((item) => item.id === current.id);
      if (!account) throw new AppError('Your account could not be found.');

      const currentHash = await hashPassword(currentPassword, account.salt);
      if (currentHash !== account.passwordHash) {
        throw new AppError('Your current password is incorrect.');
      }

      const salt = Crypto.randomUUID();
      const nextAccount: StoredAccount = {
        ...account,
        salt,
        passwordHash: await hashPassword(nextPassword, salt),
      };
      await storage.saveAccounts(
        accounts.map((item) => (item.id === account.id ? nextAccount : item)),
      );
    },
    [],
  );

  const deleteAccount = useCallback(async () => {
    const current = sessionUserRef.current;
    if (!current) return;
    if (!current.isGuest) {
      const accounts = await storage.loadAccounts();
      await storage.saveAccounts(accounts.filter((item) => item.id !== current.id));
    }
    await storage.clearUserData(current.id);
    setAllScans((previous) => previous.filter((scan) => scan.userId !== current.id));
    await persistUser(null);
  }, [persistUser]);

  const addScan = useCallback(
    async (message: string) => {
      const current = sessionUserRef.current;
      if (!current) throw new AppError('You need to be signed in to save a scan.');

      const result = classifyMessage(message);
      const record: ScanRecord = {
        id: Crypto.randomUUID(),
        userId: current.id,
        message: message.trim(),
        label: result.label,
        classification: result.classification,
        confidence: result.confidence,
        fraudProbability: result.fraudProbability,
        normalProbability: result.normalProbability,
        explanation: result.explanation,
        source: 'on-device',
        createdAt: new Date().toISOString(),
      };

      const next = sortScans([record, ...allScans]).slice(0, 500);
      setAllScans(next);
      await storage.saveScans(next);

      if (settings.hapticsEnabled) {
        void Haptics.notificationAsync(
          result.label === 'fraud'
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
      }

      if (result.label === 'fraud' && settings.notificationsEnabled) {
        const allowed = await hasNotificationPermission();
        if (allowed) void notifyFraudScan(record);
      }

      return record;
    },
    [allScans, settings.hapticsEnabled, settings.notificationsEnabled],
  );

  const removeScan = useCallback(
    async (id: string) => {
      const next = allScans.filter((scan) => scan.id !== id);
      setAllScans(next);
      await storage.saveScans(next);
    },
    [allScans],
  );

  const clearHistory = useCallback(async () => {
    const current = sessionUserRef.current;
    if (!current) return;
    const next = allScans.filter((scan) => scan.userId !== current.id);
    setAllScans(next);
    await storage.saveScans(next);
  }, [allScans]);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      void storage.saveSettings(next);
      return next;
    });
  }, []);

  const markNotificationsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotificationsSeenAt(now);
    await storage.saveNotificationsSeenAt(now);
  }, []);

  const scans = useMemo(
    () => (user ? allScans.filter((scan) => scan.userId === user.id) : []),
    [allScans, user],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      user,
      isGuest: Boolean(user?.isGuest),
      settings,
      scans,
      notificationsSeenAt,
      signIn,
      signUp,
      continueAsGuest,
      signOut,
      updateProfile,
      changePassword,
      deleteAccount,
      addScan,
      removeScan,
      clearHistory,
      updateSettings,
      markNotificationsRead,
    }),
    [
      ready,
      user,
      settings,
      scans,
      notificationsSeenAt,
      signIn,
      signUp,
      continueAsGuest,
      signOut,
      updateProfile,
      changePassword,
      deleteAccount,
      addScan,
      removeScan,
      clearHistory,
      updateSettings,
      markNotificationsRead,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
