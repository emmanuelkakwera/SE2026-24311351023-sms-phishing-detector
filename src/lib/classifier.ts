/**
 * Offline SMS classifier for MoneyGuard.
 *
 * This is a JavaScript port of the reference implementations used by the
 * Flask app (`export_mobile_model.py`) and the Android companion app
 * (`OfflineSmsClassifier.kt`). It recreates scikit-learn's TF-IDF transform
 * (word 1-2 grams, L2 norm, smooth IDF) and then applies the fitted Logistic
 * Regression weights bundled in `assets/model/moneyguard_model.json`.
 *
 * Everything runs on the device. No message text ever leaves the phone.
 */

import rawModel from '@/assets/model/moneyguard_model.json';

import type {
  ClassificationResult,
  ModelMetrics,
  ScanExplanation,
  ScanLabel,
  ScanSignal,
} from '@/types';

interface ModelPayload {
  version: number;
  generatedBy: string;
  modelFile: string;
  trainedWith: string;
  classes: string[];
  positiveClass: string;
  featureCount: number;
  maxFeatures: number;
  ngramMin: number;
  ngramMax: number;
  lowercase: boolean;
  tokenPattern: string;
  unicodeTokens: boolean;
  norm: string;
  useIdf: boolean;
  sublinearTf: boolean;
  smoothIdf: boolean;
  analyzer: string;
  stopWords: string[] | null;
  stripAccents: string | null;
  intercept: number;
  idf: number[];
  coefficients: number[];
  vocabulary: Record<string, number>;
  metrics?: ModelMetrics;
}

const model = rawModel as unknown as ModelPayload;

export const MAX_MESSAGE_LENGTH = 5000;
export const MIN_MESSAGE_LENGTH = 3;

export class ClassifierError extends Error {}

/** Common function words that add noise when shown as explanation signals. */
const STOPWORDS = new Set(
  `a an and are as at be been but by for from had has have he her his i if
  in is it its me my of on or our she so that the their them they this to
  was we were what when where which who will with you your
  wa pa ndi kuti mu ku la za ndipo iyi iyo uyu uyo ali`
    .split(/\s+/)
    .filter(Boolean),
);

const UNICODE_WORD = /[\p{L}\p{N}_]{2,}/gu;

function tokenize(text: string): string[] {
  const prepared = model.lowercase ? text.toLowerCase() : text;
  // Python uses `\b\w\w+\b` with re.UNICODE. JavaScript's `\w` is ASCII-only,
  // so a Unicode letter/number class is the closest equivalent.
  return prepared.match(UNICODE_WORD) ?? [];
}

function termCounts(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (let n = model.ngramMin; n <= model.ngramMax; n += 1) {
    if (tokens.length < n) continue;
    for (let index = 0; index <= tokens.length - n; index += 1) {
      const term = tokens.slice(index, index + n).join(' ');
      counts.set(term, (counts.get(term) ?? 0) + 1);
    }
  }
  return counts;
}

interface WeightedFeature {
  term: string;
  index: number;
  value: number;
}

function transform(message: string): { features: WeightedFeature[]; norm: number } {
  const counts = termCounts(tokenize(message));
  const features: WeightedFeature[] = [];
  let normSquared = 0;

  counts.forEach((count, term) => {
    const index = model.vocabulary[term];
    if (index === undefined) return;
    const value = count * model.idf[index];
    features.push({ term, index, value });
    normSquared += value * value;
  });

  return { features, norm: Math.sqrt(normSquared) };
}

/** Numerically stable sigmoid, matching the Python/Kotlin references. */
function sigmoid(value: number): number {
  if (value >= 0) return 1 / (1 + Math.exp(-value));
  const exponential = Math.exp(value);
  return exponential / (1 + exponential);
}

function isMeaningful(term: string): boolean {
  if (!/\p{L}/u.test(term)) return false;
  if (term.includes(' ')) return true;
  return !STOPWORDS.has(term.toLowerCase());
}

function buildExplanation(
  features: WeightedFeature[],
  norm: number,
  label: ScanLabel,
): ScanExplanation {
  const fraudDirection = model.positiveClass === 'fraud' ? 1 : -1;
  const candidates = features.map((feature) => ({
    term: feature.term,
    impact:
      norm > 0
        ? (fraudDirection * model.coefficients[feature.index] * feature.value) / norm
        : 0,
  }));

  const wantsFraud = label === 'fraud';
  const filtered = candidates
    .filter(
      (candidate) =>
        isMeaningful(candidate.term) &&
        (wantsFraud ? candidate.impact > 0 : candidate.impact < 0),
    )
    .sort(
      (a, b) => Math.abs(b.impact) - Math.abs(a.impact) || b.term.length - a.term.length,
    );

  const selected: { term: string; impact: number }[] = [];
  for (const candidate of filtered) {
    if (
      selected.some(
        (chosen) => candidate.term.includes(chosen.term) || chosen.term.includes(candidate.term),
      )
    ) {
      continue;
    }
    selected.push(candidate);
    if (selected.length >= 5) break;
  }

  const topSignals: ScanSignal[] = selected.map((signal) => ({
    term: signal.term,
    impact: Math.round(signal.impact * 1e6) / 1e6,
    supports: signal.impact > 0 ? 'fraud' : 'legitimate',
  }));

  const quoted = topSignals.map((signal) => `'${signal.term}'`).join(', ');
  const classWord = label === 'fraud' ? 'fraudulent' : 'legitimate';
  const direction = label === 'fraud' ? 'fraud-associated' : 'legitimate-associated';

  const summary = topSignals.length
    ? `The model classified this message as ${classWord}. The strongest ${direction} text signals were: ${quoted}.`
    : `The model classified this message as ${classWord}. No individual ${direction} terms dominated; the decision is based on the model's overall text pattern.`;

  return {
    summary,
    topSignals,
    disclaimer:
      "This explanation lists the strongest text features contributing to the model's decision. It is not proof that the message is safe or fraudulent.",
  };
}

/**
 * Classify a single SMS message. Throws a `ClassifierError` when the input is
 * empty or too long so callers can show a friendly validation message.
 */
export function classifyMessage(message: string): ClassificationResult {
  const text = message.trim();
  if (!text) throw new ClassifierError('Paste or type the SMS text before scanning.');
  if (text.length < MIN_MESSAGE_LENGTH) {
    throw new ClassifierError('Add a little more of the message so the model can analyse it.');
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new ClassifierError(
      `Messages must be at most ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.`,
    );
  }

  const { features, norm } = transform(text);

  let decision = model.intercept;
  if (norm > 0) {
    for (const feature of features) {
      decision += model.coefficients[feature.index] * (feature.value / norm);
    }
  }

  const positiveProbability = sigmoid(decision);
  const fraudProbability =
    model.positiveClass === 'fraud' ? positiveProbability : 1 - positiveProbability;
  const normalProbability = 1 - fraudProbability;
  const label: ScanLabel = fraudProbability >= normalProbability ? 'fraud' : 'normal';

  return {
    label,
    classification: label === 'fraud' ? 'Fraudulent' : 'Legitimate',
    confidence: Math.max(fraudProbability, normalProbability),
    fraudProbability,
    normalProbability,
    explanation: buildExplanation(features, norm, label),
  };
}

export function getModelInfo() {
  return {
    version: model.version,
    trainedWith: model.trainedWith,
    featureCount: model.featureCount,
    ngramRange: `${model.ngramMin}–${model.ngramMax}`,
    classes: model.classes,
    metrics: model.metrics ?? {},
    /** Approximate size of the bundled asset in kilobytes. */
    sizeKb: 468,
  };
}

export function getModelMetrics(): ModelMetrics {
  return model.metrics ?? {};
}

export type RiskLevel = 'high' | 'medium' | 'low';

/** A simple, user-facing risk band derived from the model probabilities. */
export function getRiskLevel(result: Pick<ClassificationResult, 'label' | 'confidence'>): RiskLevel {
  if (result.label === 'fraud') {
    return result.confidence >= 0.75 ? 'high' : 'medium';
  }
  return result.confidence >= 0.75 ? 'low' : 'medium';
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function describeProbability(result: ClassificationResult): string {
  const fraud = formatPercent(result.fraudProbability, 1);
  return result.label === 'fraud'
    ? `${fraud} chance this message is a scam`
    : `${formatPercent(result.normalProbability, 1)} chance this message is genuine`;
}
