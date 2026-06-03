/**
 * ScanLine — Iron Man HUD scanning line animation
 * Top-to-bottom sweep with gradient fade
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

interface ScanLineProps {
  height?: number;
  color?: string;
  duration?: number;
  active?: boolean;
}

export function ScanLine({
  height = 600,
  color = '#00F5FF',
  duration = 2500,
  active = true,
}: ScanLineProps) {
  const translateY = useSharedValue(-20);

  useEffect(() => {
    if (active) {
      translateY.value = withRepeat(
        withTiming(height + 20, {
          duration,
          easing: Easing.inOut(Easing.sine),
        }),
        -1,
        false,
      );
    } else {
      translateY.value = -20;
    }
  }, [active, duration, height]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      <Animated.View style={[styles.line, animStyle]}>
        {/* Glow trail above */}
        <LinearGradient
          colors={['transparent', `${color}00`, `${color}20`, `${color}80`, color]}
          style={styles.trailAbove}
        />
        {/* Main scan line */}
        <View style={[styles.mainLine, { backgroundColor: color }]} />
        {/* Glow trail below */}
        <LinearGradient
          colors={[color, `${color}40`, `${color}10`, 'transparent']}
          style={styles.trailBelow}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'stretch',
  },
  trailAbove: {
    height: 60,
  },
  mainLine: {
    height: 2,
    opacity: 0.9,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  trailBelow: {
    height: 40,
  },
});
