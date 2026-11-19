import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppSettings, ScanRecord, StoredAccount, User } from '@/types';

const KEYS = {
  accounts: '@moneyguard/accounts/v1',
  session: '@moneyguard/session/v1',
  scans: '@moneyguard/scans/v1',
  settings: '@moneyguard/settings/v1',
  notificationsSeenAt: '@moneyguard/notifications-seen/v1',
} as const;

const MAX_STORED_SCANS = 500;

export const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  hapticsEnabled: true,
  theme: 'system',
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  async loadAccounts(): Promise<StoredAccount[]> {
    const accounts = await readJson<StoredAccount[]>(KEYS.accounts, []);
    return Array.isArray(accounts) ? accounts : [];
  },

  async saveAccounts(accounts: StoredAccount[]): Promise<void> {
    await writeJson(KEYS.accounts, accounts);
  },

  async loadSession(): Promise<{ userId: string; user?: User } | null> {
    return readJson<{ userId: string; user?: User } | null>(KEYS.session, null);
  },

  async saveSession(userId: string, user?: User): Promise<void> {
    await writeJson(KEYS.session, { userId, user });
  },

  async clearSession(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.session);
  },

  async loadScans(): Promise<ScanRecord[]> {
    const scans = await readJson<ScanRecord[]>(KEYS.scans, []);
    return Array.isArray(scans) ? scans : [];
  },

  async saveScans(scans: ScanRecord[]): Promise<void> {
    await writeJson(KEYS.scans, scans.slice(0, MAX_STORED_SCANS));
  },

  async loadSettings(): Promise<AppSettings> {
    const settings = await readJson<Partial<AppSettings>>(KEYS.settings, {});
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      theme:
        settings.theme === 'light' || settings.theme === 'dark' ? settings.theme : 'system',
    };
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await writeJson(KEYS.settings, settings);
  },

  async loadNotificationsSeenAt(): Promise<string | null> {
    return readJson<string | null>(KEYS.notificationsSeenAt, null);
  },

  async saveNotificationsSeenAt(value: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.notificationsSeenAt, value);
  },

  async clearUserData(userId: string): Promise<void> {
    const scans = await storage.loadScans();
    await storage.saveScans(scans.filter((scan) => scan.userId !== userId));
  },

  async clearEverything(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
