/**
 * StatusBadge — Sync status and auth result badges
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Typography, Radius, Spacing } from '../../theme';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'synced' | 'pending';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ variant, label, size = 'md' }: StatusBadgeProps) {
  const { colors } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
      case 'synced':
        return { bg: colors.successGlow, text: colors.success, dot: colors.success };
      case 'error':
        return { bg: colors.errorGlow, text: colors.error, dot: colors.error };
      case 'warning':
      case 'pending':
        return { bg: colors.warningGlow, text: colors.warning, dot: colors.warning };
      case 'info':
        return { bg: colors.cyanGlow, text: colors.cyan, dot: colors.cyan };
    }
  };

  const { bg, text, dot } = getColors();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: text,
          paddingVertical: isSmall ? 2 : Spacing.xs,
          paddingHorizontal: isSmall ? Spacing.xs : Spacing.md,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text
        style={[
          styles.label,
          {
            color: text,
            fontSize: isSmall ? Typography.fontSize.xs : Typography.fontSize.sm,
            fontFamily: Typography.fontFamily.medium,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  label: {
    letterSpacing: 0.5,
  },
});
