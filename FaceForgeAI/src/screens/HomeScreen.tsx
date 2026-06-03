/**
 * HomeScreen — Main hub with scan initiation
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { getAllUsers } from '../storage/EmbeddingStore';
import { getLogStats } from '../storage/LogStore';
import { getSyncStatus } from '../storage/SyncQueue';
import { useTheme } from '../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { PulseRing } from '../components/animations/PulseRing';
import { GlassCard } from '../components/common/GlassCard';
import { NeonButton } from '../components/common/NeonButton';
import { StatusBadge } from '../components/common/StatusBadge';

const { width } = Dimensions.get('window');
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const [userCount, setUserCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, successes: 0, failures: 0, pending: 0 });
  const syncStatus = getSyncStatus();

  // Animations
  const buttonScale = useSharedValue(1);
  const glowPulse = useSharedValue(0.4);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setHidden(false);
      StatusBar.setBarStyle('light-content');
      loadData();
    }, []),
  );

  const loadData = async () => {
    const [count, logStats] = await Promise.all([
      getAllUsers().then(u => u.length),
      getLogStats(),
    ]);
    setUserCount(count);
    setStats(logStats);
  };

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <LinearGradient
      colors={
        isDark
          ? [colors.background, colors.backgroundSecondary, colors.backgroundTertiary]
          : [colors.background, colors.backgroundSecondary]
      }
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <View style={styles.headerTop}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.headerBadge}>
              <Text style={[styles.headerBadgeText, { color: colors.cyan }]}>HACKATHON 7.0</Text>
            </View>
          </View>
          <Text style={[styles.headerLabel, { color: colors.textMuted }]}>
            OFFLINE BIOMETRIC SECURITY
          </Text>
          <View style={styles.titleRow}>
            <Text style={[styles.headerTitleWhite, { color: colors.textPrimary }]}>FaceForge </Text>
            <Text style={[styles.headerTitleCyan, { color: colors.cyan }]}>AI</Text>
          </View>
          <View style={[styles.headerLine, { backgroundColor: colors.cyan }]} />
        </Animated.View>

        {/* ── Main Scan Button ─────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).duration(700)} style={styles.scanArea}>
          {/* Background glow */}
          <Animated.View
            style={[styles.glowBg, { backgroundColor: colors.cyan }, glowStyle]}
          />
          <PulseRing
            size={200}
            color={colors.cyan}
            count={3}
            duration={2200}
            active={true}
          />

          <TouchableOpacity
            style={styles.scanButtonOuter}
            onPress={() => navigation.navigate('Camera', { mode: 'auth' })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#00B8C1', '#0EA5E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scanButton}
            >
              <Text style={styles.scanIcon}>👤</Text>
              <Text style={styles.scanLabel}>SCAN FACE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Stats Row ───────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.statsRow}>
          <StatCard
            value={userCount}
            label="USERS"
            color={colors.cyan}
            colors={colors}
          />
          <StatCard
            value={stats.successes}
            label="SUCCESS"
            color={colors.success}
            colors={colors}
          />
          <StatCard
            value={stats.failures}
            label="FAILED"
            color={colors.error}
            colors={colors}
          />
        </Animated.View>

        {/* ── Sync Status ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(550).duration(600)}>
          <GlassCard style={styles.syncCard} glowColor={syncStatus.isOnline ? colors.success : undefined}>
            <View style={styles.syncRow}>
              <View>
                <Text style={[styles.syncTitle, { color: colors.textPrimary }]}>
                  Sync Status
                </Text>
                <Text style={[styles.syncSub, { color: colors.textMuted }]}>
                  {stats.pending} pending · {syncStatus.lastSyncAt
                    ? `Last: ${new Date(syncStatus.lastSyncAt).toLocaleDateString()}`
                    : 'Never synced'}
                </Text>
              </View>
              <StatusBadge
                variant={syncStatus.isOnline ? 'synced' : 'pending'}
                label={syncStatus.isOnline ? 'ONLINE' : 'OFFLINE'}
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* ── Action Buttons ───────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(650).duration(600)} style={styles.actions}>
          <NeonButton
            label="Register Face"
            onPress={() => navigation.navigate('Register')}
            variant="secondary"
            fullWidth
          />
          <View style={styles.actionRow}>
            <NeonButton
              label="Logs"
              onPress={() => navigation.navigate('Logs')}
              variant="ghost"
              style={styles.halfBtn}
            />
            <NeonButton
              label="Settings"
              onPress={() => navigation.navigate('Settings')}
              variant="ghost"
              style={styles.halfBtn}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

function StatCard({
  value,
  label,
  color,
  colors,
}: {
  value: number;
  label: string;
  color: string;
  colors: any;
}) {
  return (
    <GlassCard style={styles.statCard} glowColor={color}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: 60,
    paddingBottom: 40,
    gap: Spacing.xl,
  },
  header: {
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerLogo: {
    width: 44,
    height: 44,
  },
  headerBadge: {
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,245,255,0.05)',
  },
  headerBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.5,
  },
  headerLabel: {
    fontSize: Typography.fontSize.xs,
    letterSpacing: Typography.letterSpacing.wider,
    fontFamily: 'Inter-Medium',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  headerTitleWhite: {
    fontSize: Typography.fontSize['4xl'],
    fontFamily: 'Inter-ExtraBold',
    letterSpacing: -1,
    lineHeight: Typography.fontSize['4xl'] * 1.1,
  },
  headerTitleCyan: {
    fontSize: Typography.fontSize['4xl'],
    fontFamily: 'Inter-ExtraBold',
    letterSpacing: -1,
    lineHeight: Typography.fontSize['4xl'] * 1.1,
    textShadowColor: 'rgba(0,245,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginTop: Spacing.xs,
  },
  scanArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
    marginVertical: Spacing.md,
  },
  glowBg: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.08,
  },
  scanButtonOuter: {
    zIndex: 20,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 20,
  },
  scanButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  scanIcon: { fontSize: 36 },
  scanLabel: {
    fontSize: Typography.fontSize.xs,
    color: '#050A18',
    fontFamily: 'Inter-Bold',
    letterSpacing: Typography.letterSpacing.wide,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  statValue: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: 'Inter-ExtraBold',
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    letterSpacing: Typography.letterSpacing.wide,
  },
  syncCard: {
    padding: Spacing.base,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
  },
  syncSub: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  actions: { gap: Spacing.md },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfBtn: { flex: 1 },
});
