/**
 * ResultScreen — Authentication result with particle burst animation
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { GlassCard } from '../components/common/GlassCard';
import { NeonButton } from '../components/common/NeonButton';
import { PulseRing } from '../components/animations/PulseRing';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');
type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export function ResultScreen({ navigation, route }: Props) {
  const { result } = route.params;
  const { colors } = useTheme();
  const isSuccess = result.success;

  const iconScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);

  const accentColor = isSuccess ? Colors.dark.success : Colors.dark.error;
  const bgGlow = isSuccess ? Colors.dark.successGlow : Colors.dark.errorGlow;

  useEffect(() => {
    StatusBar.setHidden(true);

    // Haptic feedback
    ReactNativeHapticFeedback.trigger(
      isSuccess ? 'notificationSuccess' : 'notificationError',
      { enableVibrateFallback: true, ignoreAndroidSystemSettings: false },
    );

    // Animations
    iconScale.value = withDelay(200, withSpring(1, { mass: 0.6, damping: 10, stiffness: 150 }));
    textOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    cardOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));
    glowScale.value = withDelay(
      200,
      withSequence(
        withTiming(1.4, { duration: 400 }),
        withSpring(1, { damping: 12 }),
      ),
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value }));
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: 0.25,
  }));

  const confidence = result.confidence
    ? Math.round(result.confidence * 100)
    : null;

  return (
    <LinearGradient
      colors={[Colors.dark.background, Colors.dark.backgroundSecondary]}
      style={styles.container}
    >
      <StatusBar hidden />

      {/* Background glow */}
      <Animated.View
        style={[
          styles.bgGlow,
          { backgroundColor: accentColor },
          glowStyle,
        ]}
      />

      {/* Pulse rings */}
      <View style={styles.ringArea}>
        <PulseRing
          size={260}
          color={accentColor}
          count={4}
          duration={2500}
          active={true}
        />

        {/* Result icon */}
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <LinearGradient
            colors={
              isSuccess
                ? ['#006633', '#00CC6A', '#00FF88']
                : ['#660022', '#CC0044', '#FF3366']
            }
            style={[styles.iconGradient, { shadowColor: accentColor }]}
          >
            <Text style={styles.resultIcon}>{isSuccess ? '✓' : '✗'}</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Result text */}
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={[styles.resultTitle, { color: accentColor }]}>
          {isSuccess ? 'AUTHENTICATED' : 'ACCESS DENIED'}
        </Text>
        <Text style={[styles.resultSub, { color: Colors.dark.textSecondary }]}>
          {isSuccess
            ? 'Identity verified successfully'
            : result.error ?? 'Authentication failed'}
        </Text>
      </Animated.View>

      {/* User info card */}
      <Animated.View style={[styles.cardWrap, cardStyle]}>
        {isSuccess && result.user ? (
          <GlassCard glowColor={accentColor} style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {result.user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: Colors.dark.textPrimary }]}>
                {result.user.name}
              </Text>
              <Text style={[styles.userTime, { color: Colors.dark.textMuted }]}>
                {new Date().toLocaleTimeString()} · {new Date().toLocaleDateString()}
              </Text>
            </View>
            {confidence !== null && (
              <View style={[styles.confidence, { borderColor: accentColor }]}>
                <Text style={[styles.confidenceText, { color: accentColor }]}>
                  {confidence}%
                </Text>
                <Text style={[styles.confidenceLabel, { color: Colors.dark.textMuted }]}>
                  MATCH
                </Text>
              </View>
            )}
          </GlassCard>
        ) : (
          <GlassCard glowColor={accentColor} style={styles.errorCard}>
            <Text style={{ fontSize: 40 }}>🚫</Text>
            <Text style={[styles.errorText, { color: Colors.dark.textSecondary }]}>
              {result.error ?? 'No matching identity found in the system.'}
            </Text>
          </GlassCard>
        )}
      </Animated.View>

      {/* Actions */}
      <Animated.View style={[styles.actions, cardStyle]}>
        <NeonButton
          label={isSuccess ? 'Done' : 'Try Again'}
          onPress={() => {
            if (isSuccess) {
              navigation.popToTop();
            } else {
              navigation.replace('Camera', { mode: 'auth' });
            }
          }}
          variant="primary"
          fullWidth
        />
        <NeonButton
          label="Home"
          onPress={() => navigation.popToTop()}
          variant="ghost"
          fullWidth
        />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  bgGlow: {
    position: 'absolute',
    top: height * 0.2,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  ringArea: {
    marginTop: height * 0.12,
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    zIndex: 10,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 15,
  },
  resultIcon: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '700',
  },
  textBlock: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  resultTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: 'Inter-ExtraBold',
    letterSpacing: Typography.letterSpacing.wider,
  },
  resultSub: {
    fontSize: Typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  cardWrap: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,245,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.success,
  },
  userAvatarText: {
    fontSize: 24,
    color: Colors.dark.textPrimary,
    fontFamily: 'Inter-Bold',
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'Inter-SemiBold',
  },
  userTime: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  confidence: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  confidenceText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'Inter-Bold',
  },
  confidenceLabel: {
    fontSize: Typography.fontSize.xs,
    letterSpacing: Typography.letterSpacing.wide,
  },
  errorCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorText: {
    textAlign: 'center',
    fontSize: Typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    lineHeight: Typography.fontSize.base * 1.6,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
    marginTop: 'auto',
    paddingBottom: 50,
  },
});
