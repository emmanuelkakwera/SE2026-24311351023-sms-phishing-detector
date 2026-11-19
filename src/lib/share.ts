import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import type { ScanRecord } from '@/types';
import { formatDateTime, formatPercent, truncate } from '@/lib/format';

const APP_SIGNATURE = 'Checked offline with MoneyGuard — Mobile Money SMS Protection.';

export async function shareScan(scan: ScanRecord): Promise<void> {
  const lines = [
    `MoneyGuard result: ${scan.classification.toUpperCase()}`,
    `Confidence: ${formatPercent(scan.confidence, 1)}`,
    `Scanned: ${formatDateTime(scan.createdAt)}`,
    '',
    `Message: "${truncate(scan.message, 300)}"`,
    '',
    scan.label === 'fraud'
      ? 'This message shows signs of mobile money fraud. Do not reply, tap links, or share your PIN.'
      : 'No strong fraud signals were found. Still verify unexpected requests with your provider.',
    '',
    APP_SIGNATURE,
  ];
  await Share.share({ message: lines.join('\n'), title: 'MoneyGuard scan result' });
}

export async function shareText(message: string, title = 'MoneyGuard'): Promise<void> {
  await Share.share({ message, title });
}

export async function copyText(value: string): Promise<void> {
  await Clipboard.setStringAsync(value);
}
