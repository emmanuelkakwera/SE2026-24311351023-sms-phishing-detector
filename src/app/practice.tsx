import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Badge,
  Button,
  Callout,
  Card,
  ProgressBar,
  Screen,
  ScreenHeader,
  ScreenScroll,
} from '@/components/ui';
import { QUIZ_QUESTIONS } from '@/data/awareness';
import { useTheme } from '@/hooks/use-theme';

export default function PracticeScreen() {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = QUIZ_QUESTIONS[index];
  const answered = selected !== null;
  const isCorrect = answered && selected === question.answerIndex;

  function choose(optionIndex: number) {
    if (answered) return;
    setSelected(optionIndex);
    if (optionIndex === question.answerIndex) setScore((value) => value + 1);
  }

  function next() {
    if (index + 1 >= QUIZ_QUESTIONS.length) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const percent = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    const passed = percent >= 70;
    return (
      <Screen>
        <ScreenHeader title="Practice quiz" subtitle="Results" />
        <ScreenScroll contentContainerStyle={{ gap: 18, paddingTop: 10 }}>
          <Card style={{ alignItems: 'center', paddingVertical: 26, gap: 8 }}>
            <View
              style={[
                styles.trophy,
                { backgroundColor: passed ? theme.successSoft : theme.warningSoft },
              ]}>
              <Ionicons
                name={passed ? 'trophy' : 'refresh-circle'}
                size={38}
                color={passed ? theme.success : theme.warning}
              />
            </View>
            <AppText variant="display">{percent}%</AppText>
            <AppText variant="heading" center>
              {passed ? 'Scam-spotting pro!' : 'Keep practising'}
            </AppText>
            <AppText variant="caption" tone="secondary" center style={{ maxWidth: 290 }}>
              You answered {score} of {QUIZ_QUESTIONS.length} questions correctly.{' '}
              {passed
                ? 'You know the key warning signs. Share what you learned with family.'
                : 'Review the scam guides, then try again — repetition builds the habit.'}
            </AppText>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Badge
                label={`${score} correct`}
                tone="normal"
                icon="checkmark-circle-outline"
              />
              <Badge
                label={`${QUIZ_QUESTIONS.length - score} missed`}
                tone={score === QUIZ_QUESTIONS.length ? 'neutral' : 'warning'}
                icon="close-circle-outline"
              />
            </View>
          </Card>

          <Button label="Try again" icon="refresh" onPress={restart} />
          <Button
            label="Review the scam guides"
            variant="outline"
            icon="book-outline"
            onPress={() => router.replace('/learn')}
          />
          <Button label="Back to home" variant="ghost" onPress={() => router.replace('/')} />
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Practice quiz"
        subtitle={`Question ${index + 1} of ${QUIZ_QUESTIONS.length}`}
      />
      <ScreenScroll contentContainerStyle={{ gap: 16, paddingTop: 10 }}>
        <View style={{ gap: 8 }}>
          <ProgressBar value={(index + (answered ? 1 : 0)) / QUIZ_QUESTIONS.length} height={7} />
          <View style={styles.progressRow}>
            <AppText variant="tiny" tone="muted">
              {index + 1} / {QUIZ_QUESTIONS.length}
            </AppText>
            <AppText variant="tiny" tone="muted">
              Score: {score}
            </AppText>
          </View>
        </View>

        <Card style={{ gap: 7 }}>
          <Badge label={`QUESTION ${index + 1}`} tone="primary" size="sm" />
          <AppText variant="heading" style={{ marginTop: 4, lineHeight: 28 }}>
            {question.question}
          </AppText>
        </Card>

        <View style={{ gap: 9 }}>
          {question.options.map((option, optionIndex) => {
            const isAnswer = optionIndex === question.answerIndex;
            const isPicked = selected === optionIndex;
            const showCorrect = answered && isAnswer;
            const showWrong = answered && isPicked && !isAnswer;

            return (
              <Pressable
                key={option}
                onPress={() => choose(optionIndex)}
                accessibilityRole="button"
                accessibilityState={{ selected: isPicked, disabled: answered }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: showCorrect
                      ? theme.successSoft
                      : showWrong
                        ? theme.dangerSoft
                        : theme.surface,
                    borderColor: showCorrect
                      ? theme.success
                      : showWrong
                        ? theme.danger
                        : isPicked
                          ? theme.primary
                          : theme.border,
                    opacity: pressed && !answered ? 0.8 : 1,
                  },
                ]}>
                <View
                  style={[
                    styles.optionLetter,
                    {
                      backgroundColor: showCorrect
                        ? theme.success
                        : showWrong
                          ? theme.danger
                          : theme.surfaceAlt,
                    },
                  ]}>
                  {showCorrect ? (
                    <Ionicons name="checkmark" size={15} color={theme.primaryContrast} />
                  ) : showWrong ? (
                    <Ionicons name="close" size={15} color={theme.dangerContrast} />
                  ) : (
                    <AppText variant="caption" tone="secondary" style={{ fontWeight: '700' }}>
                      {String.fromCharCode(65 + optionIndex)}
                    </AppText>
                  )}
                </View>
                <AppText variant="body" style={{ flex: 1 }}>
                  {option}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {answered ? (
          <Callout
            tone={isCorrect ? 'success' : 'danger'}
            title={isCorrect ? 'Correct!' : 'Not quite'}
            body={question.explanation}
          />
        ) : null}

        <Button
          label={
            answered
              ? index + 1 >= QUIZ_QUESTIONS.length
                ? 'See my results'
                : 'Next question'
              : 'Choose an answer'
          }
          icon={answered ? 'arrow-forward' : 'hand-left-outline'}
          disabled={!answered}
          onPress={next}
        />

        <AppText variant="tiny" tone="muted" center>
          The quiz is for awareness only. When in doubt, verify with your provider.
        </AppText>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophy: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
