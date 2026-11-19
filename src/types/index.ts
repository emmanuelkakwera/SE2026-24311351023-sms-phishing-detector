export type ScanLabel = 'fraud' | 'normal';

export type DetectionStatus = 'FRAUD' | 'NORMAL' | 'NOT_ANALYSED';

export interface ScanSignal {
  term: string;
  impact: number;
  supports: 'fraud' | 'legitimate';
}

export interface ScanExplanation {
  summary: string;
  topSignals: ScanSignal[];
  disclaimer: string;
}

export interface ScanRecord {
  id: string;
  userId: string;
  message: string;
  sender?: string;
  label: ScanLabel;
  classification: 'Fraudulent' | 'Legitimate';
  /** Confidence in the chosen class, from 0 to 1. */
  confidence: number;
  fraudProbability: number;
  normalProbability: number;
  explanation: ScanExplanation;
  source: 'on-device' | 'incoming-sms';
  createdAt: string;
}

/**
 * A real result produced by the automatic SMS receiver. These records live in
 * the native module's private storage and are never fabricated in the UI.
 */
export interface ProtectionDetection {
  id: string;
  sender: string;
  message: string;
  status: DetectionStatus;
  confidence: number | null;
  fraudProbability: number | null;
  normalProbability: number | null;
  explanation: string | null;
  signals: string[];
  receivedAt: string;
  detectedAt: string;
  subscriptionId: number | null;
  analysisSource: 'ON_DEVICE' | 'FLASK_API';
}

export interface HistoryEntry {
  id: string;
  kind: 'manual' | 'automatic';
  sender?: string;
  message: string;
  status: DetectionStatus;
  label: ScanLabel | null;
  confidence: number | null;
  explanationSummary: string | null;
  signals: string[];
  createdAt: string;
  scan?: ScanRecord;
  detection?: ProtectionDetection;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isGuest?: boolean;
}

export interface StoredAccount extends User {
  salt: string;
  passwordHash: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppSettings {
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  theme: ThemePreference;
}

export interface ModelMetrics {
  datasetSize?: number;
  fraudCount?: number;
  normalCount?: number;
  trainingAccuracy?: number;
  cvAccuracy?: number;
  cvAccuracyStd?: number;
}

export interface ClassificationResult {
  label: ScanLabel;
  classification: 'Fraudulent' | 'Legitimate';
  confidence: number;
  fraudProbability: number;
  normalProbability: number;
  explanation: ScanExplanation;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  createdAt: string;
}
