import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';

import {
  clearNativeDetections,
  deleteNativeDetection,
  deleteNativeDeviceData,
  getNativeDetections,
  getNativeSettings,
  hasSmsPermission,
  hasNotificationPermission,
  isAutomaticProtectionSupported,
  nativeSms,
  requestProtectionNotificationPermission,
  requestSmsPermission,
  setNativeSettings,
} from '@/lib/sms-protection';
import type { NativeDetection, NativeSettings } from '../../modules/moneyguard-sms/src/MoneyGuardSms.types';
import type { ProtectionDetection } from '@/types';

interface ProtectionContextValue {
  /** True only when the Android native module is present in this build. */
  supported: boolean;
  ready: boolean;
  smsPermission: boolean;
  notificationPermission: boolean;
  monitoringEnabled: boolean;
  fraudAlertsEnabled: boolean;
  notifyOnAnalysisFailure: boolean;
  /** True only when the module, SMS permission and monitoring are all available. */
  active: boolean;
  detections: ProtectionDetection[];
  error: string | null;
  requestPermissions: () => Promise<boolean>;
  requestSmsAccess: () => Promise<boolean>;
  requestNotificationAccess: () => Promise<boolean>;
  refresh: () => Promise<void>;
  setMonitoringEnabled: (enabled: boolean) => Promise<void>;
  setFraudAlertsEnabled: (enabled: boolean) => Promise<void>;
  setNotifyOnAnalysisFailure: (enabled: boolean) => Promise<void>;
  removeDetection: (id: string) => Promise<void>;
  clearDetections: () => Promise<void>;
  deleteDeviceData: () => Promise<void>;
}

interface ProtectionSnapshot {
  sms: boolean;
  notification: boolean;
  settings: NativeSettings | null;
  records: NativeDetection[];
}

const ProtectionContext = createContext<ProtectionContextValue | null>(null);

function toProtectionDetection(detection: NativeDetection): ProtectionDetection {
  return {
    id: detection.id,
    sender: detection.sender || 'Unknown sender',
    message: detection.body,
    status: detection.status,
    confidence: detection.confidence,
    fraudProbability: detection.fraudProbability,
    normalProbability: detection.normalProbability,
    explanation: detection.explanation,
    signals: Array.isArray(detection.signals) ? detection.signals : [],
    receivedAt: new Date(detection.timestamp || Date.now()).toISOString(),
    detectedAt: new Date(detection.detectedAt || detection.timestamp || Date.now()).toISOString(),
    subscriptionId: detection.subscriptionId,
    analysisSource: detection.analysisSource,
  };
}

export function ProtectionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isAutomaticProtectionSupported);
  const [smsPermission, setSmsPermission] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [monitoringEnabled, setMonitoring] = useState(true);
  const [fraudAlertsEnabled, setFraudAlerts] = useState(true);
  const [notifyOnAnalysisFailure, setFailureAlerts] = useState(true);
  const [detections, setDetections] = useState<ProtectionDetection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const readSnapshot = useCallback(async (): Promise<ProtectionSnapshot | null> => {
    if (!nativeSms) return null;
    const [sms, notification, settings, records] = await Promise.all([
      hasSmsPermission(),
      hasNotificationPermission(),
      getNativeSettings(),
      getNativeDetections(),
    ]);
    return { sms, notification, settings, records };
  }, []);

  const applySnapshot = useCallback((snapshot: ProtectionSnapshot) => {
    setSmsPermission(snapshot.sms);
    setNotificationPermission(snapshot.notification);
    if (snapshot.settings) {
      setMonitoring(snapshot.settings.monitoringEnabled);
      setFraudAlerts(snapshot.settings.fraudAlertsEnabled);
      setFailureAlerts(snapshot.settings.notifyOnAnalysisFailure);
    }
    setDetections(
      snapshot.records
        .map(toProtectionDetection)
        .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()),
    );
  }, []);

  const refresh = useCallback(async () => {
    try {
      const snapshot = await readSnapshot();
      if (!snapshot) return;
      applySnapshot(snapshot);
      setError(null);
    } catch {
      setError('MoneyGuard could not read the automatic protection status on this device.');
    } finally {
      setReady(true);
    }
  }, [applySnapshot, readSnapshot]);

  useEffect(() => {
    if (!nativeSms) return;
    let cancelled = false;

    void (async () => {
      try {
        const snapshot = await readSnapshot();
        if (cancelled || !snapshot) return;
        applySnapshot(snapshot);
        setError(null);
      } catch {
        if (!cancelled) {
          setError('MoneyGuard could not read the automatic protection status on this device.');
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    const subscription = nativeSms.addListener('onDetection', (event) => {
      const next = toProtectionDetection(event);
      setDetections((previous) => {
        const withoutDuplicate = previous.filter((item) => item.id !== next.id);
        return [next, ...withoutDuplicate].sort(
          (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
        );
      });
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });

    return () => {
      cancelled = true;
      subscription.remove();
      appStateSubscription.remove();
    };
  }, [applySnapshot, readSnapshot, refresh]);

  const requestSmsAccess = useCallback(async () => {
    const granted = await requestSmsPermission();
    setSmsPermission(granted);
    if (granted) {
      setMonitoring(true);
      try {
        await setNativeSettings({
          monitoringEnabled: true,
          fraudAlertsEnabled,
          notifyOnAnalysisFailure,
        });
      } catch {
        setError('Automatic protection is allowed, but the monitoring setting could not be saved.');
      }
    } else {
      setError('SMS access was not granted. Automatic protection cannot run without it.');
    }
    return granted;
  }, [fraudAlertsEnabled, notifyOnAnalysisFailure]);

  const requestNotificationAccess = useCallback(async () => {
    const granted = await requestProtectionNotificationPermission();
    setNotificationPermission(granted);
    if (!granted) {
      setError(
        'Notification access was not granted. Detections will still be saved, but warning alerts cannot appear.',
      );
    }
    return granted;
  }, []);

  const requestPermissions = useCallback(async () => {
    setError(null);
    const smsGranted = await requestSmsAccess();
    if (smsGranted) {
      await requestNotificationAccess();
    }
    await refresh();
    return smsGranted;
  }, [refresh, requestNotificationAccess, requestSmsAccess]);

  const setMonitoringEnabled = useCallback(
    async (enabled: boolean) => {
      setMonitoring(enabled);
      if (!nativeSms) return;
      try {
        await setNativeSettings({
          monitoringEnabled: enabled,
          fraudAlertsEnabled,
          notifyOnAnalysisFailure,
        });
      } catch {
        setError('The monitoring setting could not be saved.');
        await refresh();
      }
    },
    [fraudAlertsEnabled, notifyOnAnalysisFailure, refresh],
  );

  const setFraudAlertsEnabled = useCallback(
    async (enabled: boolean) => {
      setFraudAlerts(enabled);
      if (!nativeSms) return;
      try {
        await setNativeSettings({
          monitoringEnabled,
          fraudAlertsEnabled: enabled,
          notifyOnAnalysisFailure,
        });
      } catch {
        setError('The alert setting could not be saved.');
        await refresh();
      }
    },
    [monitoringEnabled, notifyOnAnalysisFailure, refresh],
  );

  const setNotifyOnAnalysisFailure = useCallback(
    async (enabled: boolean) => {
      setFailureAlerts(enabled);
      if (!nativeSms) return;
      try {
        await setNativeSettings({
          monitoringEnabled,
          fraudAlertsEnabled,
          notifyOnAnalysisFailure: enabled,
        });
      } catch {
        setError('The alert setting could not be saved.');
        await refresh();
      }
    },
    [fraudAlertsEnabled, monitoringEnabled, refresh],
  );

  const removeDetection = useCallback(async (id: string) => {
    setDetections((previous) => previous.filter((item) => item.id !== id));
    await deleteNativeDetection(id);
  }, []);

  const clearDetections = useCallback(async () => {
    setDetections([]);
    await clearNativeDetections();
  }, []);

  const deleteDeviceData = useCallback(async () => {
    setDetections([]);
    setSmsPermission(false);
    setNotificationPermission(false);
    await deleteNativeDeviceData();
    await refresh();
  }, [refresh]);

  const value = useMemo<ProtectionContextValue>(
    () => ({
      supported: isAutomaticProtectionSupported,
      ready,
      smsPermission,
      notificationPermission,
      monitoringEnabled,
      fraudAlertsEnabled,
      notifyOnAnalysisFailure,
      active: isAutomaticProtectionSupported && smsPermission && monitoringEnabled,
      detections,
      error,
      requestPermissions,
      requestSmsAccess,
      requestNotificationAccess,
      refresh,
      setMonitoringEnabled,
      setFraudAlertsEnabled,
      setNotifyOnAnalysisFailure,
      removeDetection,
      clearDetections,
      deleteDeviceData,
    }),
    [
      ready,
      smsPermission,
      notificationPermission,
      monitoringEnabled,
      fraudAlertsEnabled,
      notifyOnAnalysisFailure,
      detections,
      error,
      requestPermissions,
      requestSmsAccess,
      requestNotificationAccess,
      refresh,
      setMonitoringEnabled,
      setFraudAlertsEnabled,
      setNotifyOnAnalysisFailure,
      removeDetection,
      clearDetections,
      deleteDeviceData,
    ],
  );

  return <ProtectionContext.Provider value={value}>{children}</ProtectionContext.Provider>;
}

export function useProtection(): ProtectionContextValue {
  const context = useContext(ProtectionContext);
  if (!context) throw new Error('useProtection must be used inside ProtectionProvider');
  return context;
}
