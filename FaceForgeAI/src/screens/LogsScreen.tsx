/**
 * LogsScreen — Authentication history with sync badges
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, AuthLog } from '../types';
import { getRecentLogs, getLogStats } from '../storage/LogStore';
import { triggerManualSync } from '../storage/SyncQueue';
import { useTheme } from '../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { GlassCard } from '../components/common/GlassCard';
import { StatusBadge } from '../components/common/StatusBadge';

type Props = NativeStackScreenProps<RootStackParamList, 'Logs'>;

export function LogsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [stats, setStats] = useState({ total: 0, successes: 0, failures: 0, pending: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setHidden(false);
      loadLogs();
    }, []),
  );

  const loadLogs = async () => {
    const [allLogs, logStats] = await Promise.all([
      getRecentLogs(100),
      getLogStats(),
    ]);
    setLogs(allLogs);
    setStats(logStats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    await triggerManualSync();
    await loadLogs();
    setSyncing(false);
  };

  const getResultColor = (result: AuthLog['result']) => {
    switch (result) {
      case 'success': return colors.success;
      case 'failure': return colors.error;
      default: return colors.warning;
    }
  };

  const renderLog = ({ item, index }: { item: AuthLog; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(400)}>
      <GlassCard
        style={styles.logCard}
        borderColor={`${getResultColor(item.result)}40`}
        glowColor={item.result === 'success' ? colors.success : undefined}
      >
        <View style={styles.logLeft}>
          <View
            style={[
              styles.resultDot,
              { backgroundColor: getResultColor(item.result) },
            ]}
          />
          <View style={styles.logInfo}>
            <Text style={[styles.logUser, { color: colors.textPrimary }]}>
              {item.userName ?? 'Unknown'}
            </Text>
            <Text style={[styles.logTime, { color: colors.textMuted }]}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
            {item.latitude && (
              <Text style={[styles.logGps, { color: colors.textMuted }]}>
                📍 {item.latitude.toFixed(4)}, {item.longitude?.toFixed(4)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.logRight}>
          <StatusBadge
            variant={
              item.result === 'success' ? 'success' : 'error'
            }
            label={item.result.replace('_', ' ').toUpperCase()}
            size="sm"
          />
          {item.confidence && (
            <Text style={[styles.confidence, { color: getResultColor(item.result) }]}>
              {Math.round(item.confidence * 100)}%
            </Text>
          )}
          {!item.synced && (
            <StatusBadge variant="pending" label="PENDING" size="sm" />
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundSecondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.cyan }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Auth Logs</Text>
        <TouchableOpacity onPress={handleSync} disabled={syncing}>
          <Text style={[styles.syncBtn, { color: colors.cyan, opacity: syncing ? 0.5 : 1 }]}>
            {syncing ? 'Syncing...' : '⟳ Sync'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats summary */}
      <View style={styles.statsRow}>
        <StatChip value={stats.total} label="Total" color={colors.cyan} colors={colors} />
        <StatChip value={stats.successes} label="Success" color={colors.success} colors={colors} />
        <StatChip value={stats.failures} label="Failed" color={colors.error} colors={colors} />
        <StatChip value={stats.pending} label="Pending" color={colors.warning} colors={colors} />
      </View>

      {/* Log list */}
      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        renderItem={renderLog}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.cyan}
            colors={[colors.cyan]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyIcon]}>📋</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No authentication logs yet
            </Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

function StatChip({ value, label, color, colors }: any) {
  return (
    <View style={[styles.chip, { borderColor: `${color}40` }]}>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={[styles.chipLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: 56,
    paddingBottom: Spacing.base,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: Typography.fontSize.base, fontFamily: 'Inter-Medium' },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'Inter-Bold',
  },
  syncBtn: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'Inter-SemiBold',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
    marginBottom: Spacing.base,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
  },
  chipValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'Inter-Bold',
  },
  chipLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'Inter-Regular',
  },
  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 40,
    gap: Spacing.sm,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    flex: 1,
  },
  resultDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  logInfo: { flex: 1 },
  logUser: {
    fontSize: Typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
  },
  logTime: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  logGps: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  confidence: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'Inter-Bold',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.base,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: {
    fontSize: Typography.fontSize.base,
    fontFamily: 'Inter-Regular',
  },
});
