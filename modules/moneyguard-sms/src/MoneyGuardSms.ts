import { NativeModule, requireNativeModule } from 'expo';

import type {
  AnalyzeResult,
  DetectionStatus,
  DetectionSource,
  MoneyGuardSmsEvents,
  NativeDetection,
  NativeSettings,
} from './MoneyGuardSms.types';

declare class MoneyGuardSmsModule extends NativeModule<MoneyGuardSmsEvents> {
  getDetections(): Promise<NativeDetection[]>;
  getDetection(id: string): Promise<NativeDetection | null>;
  deleteDetection(id: string): Promise<void>;
  getSettings(): Promise<NativeSettings>;
  setSettings(
    monitoringEnabled: boolean,
    fraudAlertsEnabled: boolean,
    notifyOnAnalysisFailure: boolean,
  ): Promise<void>;
  setMonitoringEnabled(enabled: boolean): Promise<void>;
  clearDetections(): Promise<void>;
  deleteAllData(): Promise<void>;
  hasSmsPermission(): Promise<boolean>;
  hasNotificationPermission(): Promise<boolean>;
  analyzeMessage(message: string, sender: string): Promise<AnalyzeResult>;
}

export type { DetectionStatus, DetectionSource, NativeDetection, NativeSettings, AnalyzeResult };

export default requireNativeModule<MoneyGuardSmsModule>('MoneyGuardSms');
