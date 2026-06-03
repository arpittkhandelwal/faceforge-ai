/**
 * NeonButton — Premium animated neon button
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { Typography, Radius, Spacing } from '../../theme';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface NeonButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

type ReactNode = React.ReactNode;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function NeonButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = false,
}: NeonButtonProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 10, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    ReactNativeHapticFeedback.trigger('impactMedium', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    onPress();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getGradient = () => {
    switch (variant) {
      case 'primary':
        return ['#00B8C1', '#0EA5E9', '#00F5FF'];
      case 'secondary':
        return ['rgba(14,165,233,0.2)', 'rgba(0,245,255,0.1)'];
      case 'danger':
        return ['#CC0044', '#FF3366'];
      case 'ghost':
        return ['transparent', 'transparent'];
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return '#050A18';
      case 'secondary':
      case 'ghost':
        return colors.cyan;
      case 'danger':
        return '#fff';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base };
      case 'md':
        return { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl };
      case 'lg':
        return { paddingVertical: Spacing.base + 4, paddingHorizontal: Spacing['2xl'] };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm': return Typography.fontSize.sm;
      case 'md': return Typography.fontSize.md;
      case 'lg': return Typography.fontSize.lg;
    }
  };

  const glowColor = variant === 'danger' ? colors.error : colors.cyan;

  return (
    <AnimatedTouchable
      style={[animStyle, fullWidth && styles.fullWidth, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.button,
          getSizeStyle(),
          {
            borderColor: variant === 'secondary' || variant === 'ghost'
              ? colors.borderBright
              : 'transparent',
            borderWidth: variant === 'secondary' || variant === 'ghost' ? 1 : 0,
            opacity: disabled ? 0.5 : 1,
          },
          // Glow effect
          variant === 'primary' && {
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.7,
            shadowRadius: 16,
            elevation: 10,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text
              style={[
                styles.label,
                {
                  color: getTextColor(),
                  fontSize: getFontSize(),
                  fontFamily: Typography.fontFamily.bold,
                  letterSpacing: Typography.letterSpacing.wide,
                },
              ]}
            >
              {label.toUpperCase()}
            </Text>
          </View>
        )}
      </LinearGradient>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: 'stretch',
  },
  button: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    textAlign: 'center',
  },
});
