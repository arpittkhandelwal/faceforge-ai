/**
 * PulseRing — Animated pulsing ring effect
 * Used for: face detection halo, scan initiation
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface PulseRingProps {
  size?: number;
  color?: string;
  count?: number;
  duration?: number;
  active?: boolean;
}

export function PulseRing({
  size = 200,
  color = '#00F5FF',
  count = 3,
  duration = 2000,
  active = true,
}: PulseRingProps) {
  const rings = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {rings.map(index => (
        <PulseRingItem
          key={index}
          size={size}
          color={color}
          duration={duration}
          delay={(duration / count) * index}
          active={active}
        />
      ))}
    </View>
  );
}

function PulseRingItem({
  size,
  color,
  duration,
  delay,
  active,
}: {
  size: number;
  color: string;
  duration: number;
  delay: number;
  active: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
          -1,
          false,
        ),
      );
    } else {
      progress.value = 0;
    }
  }, [active, delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.7, 1], [0.8, 0.2, 0]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.4, 1.3]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
});
