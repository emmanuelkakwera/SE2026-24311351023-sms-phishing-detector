import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { HistoryCard } from '@/components/history-card';
import {
  AppText,
  Button,
  Chip,
  EmptyState,
  IconButton,
  Input,
  Screen,
} from '@/components/ui';
import { TabBarSpace } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { pluralize } from '@/lib/format';
import { historyCounts, mergeHistory } from '@/lib/history';
import { useApp } from '@/providers/app-provider';
import { useProtection } from '@/providers/protection-provider';
import type { HistoryEntry } from '@/types';

type Filter = 'all' | 'fraud' | 'normal';

export default function HistoryScreen() {
  const theme = useTheme();
  const { scans, removeScan, clearHistory } = useApp();
  const {
    detections,
    supported,
    removeDetection,
    clearDetections,
  } = useProtection();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const entries = useMemo(() => mergeHistory(scans, detections), [detections, scans]);
  const counts = useMemo(() => historyCounts(entries), [entries]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (filter !== 'all' && entry.label !== filter) return false;
      if (!needle) return true;
      return (
        entry.message.toLowerCase().includes(needle) ||
        (entry.sender ?? '').toLowerCase().includes(needle) ||
        entry.signals.some((signal) => signal.toLowerCase().includes(needle))
      );
    });
  }, [entries, filter, query]);

  function openEntry(entry: HistoryEntry) {
    if (entry.kind === 'automatic') {
      router.push({ pathname: '/detection/[id]', params: { id: entry.id } });
    } else {
      router.push(`/result/${entry.id}`);
    }
  }

  function confirmDelete(entry: HistoryEntry) {
    Alert.alert(
      'Delete this record?',
      entry.kind === 'automatic'
        ? 'The saved incoming SMS, its classification and confidence will be removed from this device.'
        : 'The manual check and its explanation will be removed from history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (entry.kind === 'automatic') void removeDetection(entry.id);
            else void removeScan(entry.id);
          },
        },
      ],
    );
  }

  function confirmClear() {
    if (!entries.length) return;
    Alert.alert(
      'Clear detection history?',
      `This removes all ${pluralize(entries.length, 'saved record')} from this device, including automatic SMS detections. It cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: () => {
            void clearHistory();
            void clearDetections();
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <FlatList
        data={filtered}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: TabBarSpace,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 14 }}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1, gap: 3 }}>
                <AppText variant="title">Detection history</AppText>
                <AppText variant="caption" tone="secondary">
                  {entries.length
                    ? `${pluralize(entries.length, 'message')} checked on this device`
                    : 'Automatic and manual checks will appear here.'}
                </AppText>
              </View>
              {entries.length ? (
                <IconButton
                  icon="trash-outline"
                  tone="danger"
                  label="Clear detection history"
                  onPress={confirmClear}
                />
              ) : null}
            </View>

            {!supported ? (
              <View style={[styles.notice, { backgroundColor: theme.warningSoft }]}>
                <Ionicons name="information-circle-outline" size={17} color={theme.warning} />
                <AppText variant="tiny" style={{ color: theme.warning, flex: 1 }}>
                  Automatic SMS history is only available in the Android build. Manual checks are
                  still saved here.
                </AppText>
              </View>
            ) : null}

            <Input
              placeholder="Search sender, message or signal…"
              icon="search-outline"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              rightIcon={query ? 'close-circle' : undefined}
              onRightPress={() => setQuery('')}
            />

            <View style={styles.filters}>
              <Chip
                label={`All ${counts.total}`}
                selected={filter === 'all'}
                onPress={() => setFilter('all')}
              />
              <Chip
                label={`Fraud ${counts.fraud}`}
                icon="warning-outline"
                selected={filter === 'fraud'}
                onPress={() => setFilter('fraud')}
              />
              <Chip
                label={`Normal ${counts.normal}`}
                icon="shield-checkmark-outline"
                selected={filter === 'normal'}
                onPress={() => setFilter('normal')}
              />
            </View>

            {entries.length > 0 ? (
              <AppText variant="tiny" tone="muted">
                {filtered.length === entries.length
                  ? 'Tap a record to review it. Long-press to delete.'
                  : `Showing ${filtered.length} of ${entries.length} records.`}
              </AppText>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <HistoryCard
            entry={item}
            onPress={() => openEntry(item)}
            onLongPress={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          entries.length ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="funnel-outline"
                title="No matching records"
                body="Try a different search term or clear the filter to see every saved detection."
                action={
                  <Button
                    label="Reset filters"
                    variant="outline"
                    onPress={() => {
                      setQuery('');
                      setFilter('all');
                    }}
                  />
                }
              />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="shield-outline"
                title="No detections yet"
                body={
                  supported
                    ? 'When an SMS arrives and protection is active, its result is saved here automatically. Nothing appears until a real message is checked.'
                    : 'Automatic SMS checking is only available in the Android app. You can still run a manual check.'
                }
                action={
                  <Button
                    label={supported ? 'Set up protection' : 'Check a message manually'}
                    onPress={() => router.push(supported ? '/protection' : '/scan')}
                  />
                }
              />
            </View>
          )
        }
        ListFooterComponent={
          filtered.length ? (
            <View style={styles.footer}>
              <Ionicons name="lock-closed-outline" size={13} color={theme.textMuted} />
              <AppText variant="tiny" tone="muted">
                Detection history is stored locally on this phone and never uploaded.
              </AppText>
            </View>
          ) : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  emptyWrap: { flex: 1, justifyContent: 'center', paddingVertical: 26 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    borderRadius: 12,
    padding: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 22,
  },
});
