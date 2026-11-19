import type { HistoryEntry, ProtectionDetection, ScanRecord } from '@/types';

/** Combine manual checks with real automatic detections, newest first. */
export function mergeHistory(
  scans: ScanRecord[],
  detections: ProtectionDetection[],
): HistoryEntry[] {
  const manual: HistoryEntry[] = scans.map((scan) => ({
    id: scan.id,
    kind: 'manual',
    sender: scan.sender,
    message: scan.message,
    status: scan.label === 'fraud' ? 'FRAUD' : 'NORMAL',
    label: scan.label,
    confidence: scan.confidence,
    explanationSummary: scan.explanation.summary,
    signals: scan.explanation.topSignals.map((signal) => signal.term),
    createdAt: scan.createdAt,
    scan,
  }));

  const automatic: HistoryEntry[] = detections.map((detection) => ({
    id: detection.id,
    kind: 'automatic',
    sender: detection.sender,
    message: detection.message,
    status: detection.status,
    label:
      detection.status === 'FRAUD'
        ? 'fraud'
        : detection.status === 'NORMAL'
          ? 'normal'
          : null,
    confidence: detection.confidence,
    explanationSummary: detection.explanation,
    signals: detection.signals,
    createdAt: detection.receivedAt,
    detection,
  }));

  return [...manual, ...automatic].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function historyCounts(entries: HistoryEntry[]) {
  return {
    total: entries.length,
    fraud: entries.filter((entry) => entry.status === 'FRAUD').length,
    normal: entries.filter((entry) => entry.status === 'NORMAL').length,
    unanalysed: entries.filter((entry) => entry.status === 'NOT_ANALYSED').length,
    automatic: entries.filter((entry) => entry.kind === 'automatic').length,
    manual: entries.filter((entry) => entry.kind === 'manual').length,
  };
}
