/**
 * LivenessStepIndicator — Shows blink & head-turn progress
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { LivenessState } from '../../types';
import { useTheme } from '../../theme/ThemeContext';
import { Typography, Spacing, Radius } from '../../theme';

interface Props {
  state: LivenessState;
}

interface Step {
  key: string;
  label: string;
  icon: string;
}

const STEPS: Step[] = [
  { key: 'blink', label: 'Blink Eyes', icon: '👁' },
  { key: 'turn', label: 'Turn Head', icon: '↔' },
  { key: 'match', label: 'Face Match', icon: '✓' },
];

export function LivenessStepIndicator({ state }: Props) {
  const { colors } = useTheme();

  const blinkDone = state.blinkDetected;
  const turnDone = state.headTurnDetected;
  const allDone = state.currentStep === 'passed';

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isDone =
          (index === 0 && blinkDone) ||
          (index === 1 && turnDone) ||
          (index === 2 && allDone);

        const isActive =
          (!blinkDone && index === 0) ||
          (blinkDone && !turnDone && index === 1) ||
          (turnDone && !allDone && index === 2);

        const isProgress =
          isActive &&
          ((state.currentStep === 'blink' && index === 0) ||
            ((state.currentStep === 'turn_left' || state.currentStep === 'turn_right') && index === 1));

        return (
          <StepItem
            key={step.key}
            step={step}
            isDone={isDone}
            isActive={isActive}
            progress={isProgress ? state.stepProgress : isDone ? 1 : 0}
            colors={colors}
          />
        );
      })}
    </View>
  );
}

function StepItem({
  step,
  isDone,
  isActive,
  progress,
  colors,
}: {
  step: Step;
  isDone: boolean;
  isActive: boolean;
  progress: number;
  colors: any;
}) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isDone) {
      scale.value = withSpring(1.15, { damping: 8 }, () => {
        scale.value = withSpring(1);
      });
      glowOpacity.value = withTiming(1, { duration: 300 });
    } else if (isActive) {
      glowOpacity.value = withTiming(0.5, { duration: 300 });
    } else {
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isDone, isActive]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const borderColor = isDone
    ? colors.success
    : isActive
    ? colors.cyan
    : colors.textMuted;

  const bgColor = isDone
    ? colors.successGlow
    : isActive
    ? colors.cyanGlow
    : 'transparent';

  return (
    <Animated.View style={[styles.step, animStyle]}>
      {/* Glow halo */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: isDone ? colors.success : colors.cyan,
          },
          glowStyle,
        ]}
      />

      {/* Step circle */}
      <View
        style={[
          styles.circle,
          {
            borderColor,
            backgroundColor: bgColor,
          },
        ]}
      >
        <Text style={[styles.icon, { opacity: isDone ? 1 : isActive ? 0.9 : 0.3 }]}>
          {isDone ? '✓' : step.icon}
        </Text>

        {/* Progress arc */}
        {isActive && progress > 0 && (
          <View
            style={[
              styles.progressArc,
              {
                width: `${progress * 100}%`,
                backgroundColor: colors.cyan,
                opacity: 0.5,
              },
            ]}
          />
        )}
      </View>

      <Text
        style={[
          styles.label,
          {
            color: isDone
              ? colors.success
              : isActive
              ? colors.cyan
              : colors.textMuted,
            fontFamily: Typography.fontFamily.medium,
          },
        ]}
      >
        {step.label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  step: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -8,
    width: 64,
    height: 64,
    borderRadius: 32,
    opacity: 0.15,
    filter: 'blur(8px)',
  },
  icon: {
    fontSize: 20,
    zIndex: 1,
  },
  progressArc: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
});
