/**
 * SplashScreen — Animated boot sequence with FaceForge AI logo
 */

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { initDatabase } from '../storage/DatabaseManager';
import { initializeModels } from '../ai/ModelLoader';
import { initSyncQueue } from '../storage/SyncQueue';
import { Colors, Typography, Spacing } from '../theme';
import { PulseRing } from '../components/animations/PulseRing';

const { width, height } = Dimensions.get('window');
type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const LOGO_SIZE = 120;

export function SplashScreen({ navigation }: Props) {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const loadingOpacity = useSharedValue(0);
  const ringActive = useSharedValue(false);

  useEffect(() => {
    StatusBar.setHidden(true);
    initApp();

    // Animation sequence
    logoScale.value = withDelay(
      300,
      withSpring(1, { mass: 0.8, damping: 12, stiffness: 100 }),
    );
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));

    titleOpacity.value = withDelay(900, withTiming(1, { duration: 700 }));
    subtitleOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));
    loadingOpacity.value = withDelay(1500, withTiming(1, { duration: 400 }));
  }, []);

  const initApp = async () => {
    try {
      await Promise.all([initDatabase(), initSyncQueue()]);
      // Models loaded separately to not block splash
      initializeModels().catch(console.warn);
    } catch (err) {
      console.error('[Splash] Init error:', err);
    }

    // Navigate to Home after animation
    setTimeout(() => {
      navigation.replace('Home');
    }, 3000);
  };

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const loadingStyle = useAnimatedStyle(() => ({ opacity: loadingOpacity.value }));

  return (
    <LinearGradient
      colors={[Colors.dark.background, Colors.dark.backgroundSecondary, '#060E24']}
      style={styles.container}
    >
      <StatusBar hidden />

      {/* Particle dots background */}
      <Svg
        style={StyleSheet.absoluteFillObject}
        width={width}
        height={height}
        pointerEvents="none"
      >
        {[...Array(30)].map((_, i) => (
          <Circle
            key={i}
            cx={Math.random() * width}
            cy={Math.random() * height}
            r={Math.random() * 1.5 + 0.5}
            fill={Colors.dark.cyan}
            opacity={Math.random() * 0.4 + 0.1}
          />
        ))}
        {/* Connecting lines */}
        {[...Array(8)].map((_, i) => (
          <Line
            key={`l${i}`}
            x1={Math.random() * width}
            y1={Math.random() * height}
            x2={Math.random() * width}
            y2={Math.random() * height}
            stroke={Colors.dark.cyan}
            strokeWidth={0.3}
            opacity={0.1}
          />
        ))}
      </Svg>

      {/* Logo area */}
      <View style={styles.logoArea}>
        <PulseRing
          size={LOGO_SIZE + 80}
          color={Colors.dark.cyan}
          count={3}
          duration={2000}
          active={true}
        />

        <Animated.View style={[styles.logoContainer, logoStyle]}>
          {/* FaceForge AI Logo Image */}
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Title */}
      <Animated.View style={[styles.titleBlock, titleStyle]}>
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>FaceForge </Text>
          <Text style={styles.titleCyan}>AI</Text>
        </View>
        <View style={styles.titleLine} />
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          SECURE · PRIVATE · AUTHENTIC
        </Animated.Text>
      </Animated.View>

      {/* Loading indicator */}
      <Animated.View style={[styles.loadingBlock, loadingStyle]}>
        <View style={styles.loadingBar}>
          <ProgressBar color={Colors.dark.cyan} duration={2500} />
        </View>
        <Text style={styles.loadingText}>INITIALIZING SECURE ENCLAVE...</Text>
      </Animated.View>

      {/* Version */}
      <Text style={styles.version}>v1.0.0 · Hackathon 7.0</Text>
    </LinearGradient>
  );
}

function ProgressBar({ color, duration }: { color: string; duration: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      1600,
      withTiming(1, { duration, easing: Easing.out(Easing.quad) }),
    );
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[styles.progressTrack, { borderColor: color }]}>
      <Animated.View
        style={[
          styles.progressFill,
          { backgroundColor: color },
          barStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoArea: {
    width: LOGO_SIZE + 80,
    height: LOGO_SIZE + 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['3xl'],
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    zIndex: 10,
  },
  logoImage: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    shadowColor: Colors.dark.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 20,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleWhite: {
    fontSize: Typography.fontSize['4xl'],
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.dark.textPrimary,
    letterSpacing: -0.5,
  },
  titleCyan: {
    fontSize: Typography.fontSize['4xl'],
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.dark.cyan,
    letterSpacing: -0.5,
    textShadowColor: Colors.dark.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  titleLine: {
    width: 60,
    height: 2,
    backgroundColor: Colors.dark.cyan,
    marginVertical: Spacing.sm,
    shadowColor: Colors.dark.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.dark.textSecondary,
    letterSpacing: Typography.letterSpacing.wider,
    fontFamily: Typography.fontFamily.medium,
  },
  loadingBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
    position: 'absolute',
    bottom: 120,
    left: 40,
    right: 40,
  },
  loadingBar: {
    width: '100%',
    height: 2,
  },
  loadingText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.dark.textMuted,
    letterSpacing: Typography.letterSpacing.wide,
    fontFamily: Typography.fontFamily.mono,
  },
  progressTrack: {
    width: '100%',
    height: 1,
    borderWidth: 0.5,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  version: {
    position: 'absolute',
    bottom: 50,
    fontSize: Typography.fontSize.xs,
    color: Colors.dark.textMuted,
    fontFamily: Typography.fontFamily.mono,
    letterSpacing: 1,
  },
});
