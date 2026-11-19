export type DetectionStatus = 'FRAUD' | 'NORMAL' | 'NOT_ANALYSED';

export type DetectionSource = 'ON_DEVICE' | 'FLASK_API';

export interface NativeDetection {
  id: string;
  sender: string;
  body: string;
  status: DetectionStatus;
  confidence: number | null;
  fraudProbability: number | null;
  normalProbability: number | null;
  explanation: string | null;
  signals: string[];
  timestamp: number;
  subscriptionId: number | null;
  detectedAt: number;
  analysisSource: DetectionSource;
}

export interface NativeSettings {
  monitoringEnabled: boolean;
  fraudAlertsEnabled: boolean;
  notifyOnAnalysisFailure: boolean;
}

export interface AnalyzeResult {
  status: 'fraud' | 'normal' | 'not_analysed';
  confidence: number | null;
  explanation: string | null;
  stored: boolean;
  detection: NativeDetection | null;
}

export type MoneyGuardSmsEvents = {
  onDetection: (event: NativeDetection) => void;
};
