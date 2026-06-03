/**
 * SettingsScreen — App configuration with theme toggle
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { purgeAllUsers, getAllUsers, getUserCount } from '../storage/EmbeddingStore';
import { setAWSEndpoint } from '../storage/SyncQueue';
import { useTheme } from '../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { GlassCard } from '../components/common/GlassCard';
import { NeonButton } from '../components/common/NeonButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SETTINGS_KEY = '@faceauth:app_settings';

export function SettingsScreen({ navigation }: Props) {
  const { colors, theme, toggleTheme, isDark } = useTheme();
  const [awsEndpoint, setAWSEndpointState] = useState('');
  const [threshold, setThreshold] = useState('0.7');
  const [livenessEnabled, setLivenessEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [userCount, setUserCountState] = useState(0);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    StatusBar.setHidden(false);
    StatusBar.setBarStyle('light-content');
    loadSettings();
    loadUsers();
  }, []);

  const loadSettings = async () => {
    const saved = await AsyncStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const s = JSON.parse(saved);
      setAWSEndpointState(s.awsEndpoint ?? '');
      setThreshold(s.recognitionThreshold?.toString() ?? '0.7');
      setLivenessEnabled(s.livenessEnabled ?? true);
      setHapticEnabled(s.hapticFeedback ?? true);
      setGpsEnabled(s.gpsLogsEnabled ?? true);
      setPerformanceMode(s.performanceMode ?? false);
    }
  };

  const loadUsers = async () => {
    const u = await getAllUsers();
    setUserCountState(u.length);
    setUsers(u.map(x => ({ id: x.id, name: x.name })));
  };

  const saveSettings = async () => {
    const settings = {
      awsEndpoint,
      recognitionThreshold: parseFloat(threshold) || 0.7,
      livenessEnabled,
      hapticFeedback: hapticEnabled,
      gpsLogsEnabled: gpsEnabled,
      performanceMode,
      theme,
    };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    await setAWSEndpoint(awsEndpoint);
    Alert.alert('Saved', 'Settings have been saved successfully.');
  };

  const handlePurgeUsers = () => {
    Alert.alert(
      'Delete All Users',
      `This will permanently delete all ${userCount} registered users. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await purgeAllUsers();
            setUserCountState(0);
            setUsers([]);
          },
        },
      ],
    );
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundSecondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.cyan }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
        <TouchableOpacity onPress={saveSettings}>
          <Text style={[styles.saveText, { color: colors.cyan }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Appearance ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <SectionHeader label="APPEARANCE" colors={colors} />
          <GlassCard>
            <SettingRow
              label="Dark Mode"
              colors={colors}
              right={
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.textMuted, true: colors.cyanDim }}
                  thumbColor={isDark ? colors.cyan : colors.textSecondary}
                />
              }
            />
          </GlassCard>
        </Animated.View>

        {/* ── Security ────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <SectionHeader label="SECURITY" colors={colors} />
          <GlassCard style={styles.card}>
            <SettingRow
              label="Liveness Detection"
              sublabel="Blink & head turn verification"
              colors={colors}
              right={
                <Switch
                  value={livenessEnabled}
                  onValueChange={setLivenessEnabled}
                  trackColor={{ false: colors.textMuted, true: colors.cyanDim }}
                  thumbColor={livenessEnabled ? colors.cyan : '#ccc'}
                />
              }
            />
            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.inputRow}>
              <View>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  Match Threshold
                </Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                  0.0–1.0 (default: 0.7)
                </Text>
              </View>
              <TextInput
                style={[
                  styles.thresholdInput,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceGlassLight,
                  },
                ]}
                value={threshold}
                onChangeText={setThreshold}
                keyboardType="decimal-pad"
                maxLength={4}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* ── Experience ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <SectionHeader label="EXPERIENCE" colors={colors} />
          <GlassCard style={styles.card}>
            <SettingRow
              label="Haptic Feedback"
              colors={colors}
              right={
                <Switch
                  value={hapticEnabled}
                  onValueChange={setHapticEnabled}
                  trackColor={{ false: colors.textMuted, true: colors.cyanDim }}
                  thumbColor={hapticEnabled ? colors.cyan : '#ccc'}
                />
              }
            />
            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
            <SettingRow
              label="GPS Logging"
              sublabel="Include location in auth logs"
              colors={colors}
              right={
                <Switch
                  value={gpsEnabled}
                  onValueChange={setGpsEnabled}
                  trackColor={{ false: colors.textMuted, true: colors.cyanDim }}
                  thumbColor={gpsEnabled ? colors.cyan : '#ccc'}
                />
              }
            />
            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
            <SettingRow
              label="Performance Mode"
              sublabel="Process fewer frames (faster)"
              colors={colors}
              right={
                <Switch
                  value={performanceMode}
                  onValueChange={setPerformanceMode}
                  trackColor={{ false: colors.textMuted, true: colors.cyanDim }}
                  thumbColor={performanceMode ? colors.cyan : '#ccc'}
                />
              }
            />
          </GlassCard>
        </Animated.View>

        {/* ── AWS Sync ────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <SectionHeader label="CLOUD SYNC (OPTIONAL)" colors={colors} />
          <GlassCard>
            <View>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                AWS Endpoint URL
              </Text>
              <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                Leave empty for fully offline operation
              </Text>
              <TextInput
                style={[
                  styles.endpointInput,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceGlassLight,
                  },
                ]}
                value={awsEndpoint}
                onChangeText={setAWSEndpointState}
                placeholder="https://api.example.aws.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* ── Registered Users ─────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <SectionHeader label={`REGISTERED USERS (${userCount})`} colors={colors} />
          {users.length > 0 ? (
            <GlassCard style={styles.card}>
              {users.map((user, i) => (
                <React.Fragment key={user.id}>
                  {i > 0 && (
                    <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
                  )}
                  <View style={styles.userRow}>
                    <View style={[styles.userAvatar, { backgroundColor: colors.cyanGlow }]}>
                      <Text style={[styles.avatarText, { color: colors.cyan }]}>
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>
                      {user.name}
                    </Text>
                  </View>
                </React.Fragment>
              ))}
            </GlassCard>
          ) : (
            <GlassCard>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No users registered yet
              </Text>
            </GlassCard>
          )}
        </Animated.View>

        {/* ── Danger Zone ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.dangerZone}>
          <SectionHeader label="DANGER ZONE" colors={colors} />
          <NeonButton
            label="Delete All Users"
            onPress={handlePurgeUsers}
            variant="danger"
            fullWidth
            disabled={userCount === 0}
          />
        </Animated.View>

        {/* Version footer */}
        <Text style={[styles.version, { color: colors.textMuted }]}>
          FaceForge AI v1.0.0 · Hackathon 7.0 · Offline Build
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

function SectionHeader({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{label}</Text>
  );
}

function SettingRow({
  label,
  sublabel,
  right,
  colors,
}: {
  label: string;
  sublabel?: string;
  right: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>
        {sublabel && (
          <Text style={[styles.settingSub, { color: colors.textMuted }]}>{sublabel}</Text>
        )}
      </View>
      {right}
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
  backText: { fontSize: Typography.fontSize.base, fontFamily: 'Inter-Medium' },
  title: { fontSize: Typography.fontSize.xl, fontFamily: 'Inter-Bold' },
  saveText: { fontSize: Typography.fontSize.base, fontFamily: 'Inter-SemiBold' },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 60,
    gap: Spacing.sm,
  },
  sectionHeader: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: Typography.letterSpacing.wider,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  card: { gap: 0 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  settingText: { flex: 1, paddingRight: Spacing.base },
  settingLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: 'Inter-Medium',
  },
  settingSub: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  divider: { height: 1, marginVertical: Spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  thresholdInput: {
    width: 64,
    height: 40,
    borderWidth: 1,
    borderRadius: Radius.md,
    textAlign: 'center',
    fontSize: Typography.fontSize.base,
    fontFamily: 'Inter-Medium',
  },
  endpointInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.md,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontFamily: 'Inter-Bold' },
  userName: { fontSize: Typography.fontSize.base, fontFamily: 'Inter-Medium' },
  emptyText: { fontSize: Typography.fontSize.sm, fontFamily: 'Inter-Regular' },
  dangerZone: { gap: Spacing.sm },
  version: {
    textAlign: 'center',
    fontSize: Typography.fontSize.xs,
    fontFamily: 'Inter-Regular',
    marginTop: Spacing.xl,
    letterSpacing: 0.5,
  },
});
