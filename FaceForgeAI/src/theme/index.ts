/**
 * Theme System — Colors, Typography, Spacing
 * Glassmorphism + Neon Cyberpunk aesthetic
 */

// ─── Color Palette ────────────────────────────────────────────
export const Colors = {
  // Dark theme (primary)
  dark: {
    background: '#050A18',
    backgroundSecondary: '#0A1628',
    backgroundTertiary: '#0F1F3D',
    surface: 'rgba(10, 22, 40, 0.85)',
    surfaceGlass: 'rgba(15, 31, 61, 0.6)',
    surfaceGlassLight: 'rgba(255, 255, 255, 0.05)',

    // Neon accents
    cyan: '#00F5FF',
    cyanDim: '#00B8C1',
    cyanGlow: 'rgba(0, 245, 255, 0.3)',
    blue: '#0EA5E9',
    blueDim: '#0284C7',
    purple: '#8B5CF6',
    purpleDim: '#7C3AED',

    // Status colors
    success: '#00FF88',
    successDim: '#00CC6A',
    successGlow: 'rgba(0, 255, 136, 0.35)',
    error: '#FF3366',
    errorDim: '#CC0044',
    errorGlow: 'rgba(255, 51, 102, 0.35)',
    warning: '#FFB800',
    warningGlow: 'rgba(255, 184, 0, 0.3)',

    // Text
    textPrimary: '#E8F4FD',
    textSecondary: '#7CB9D4',
    textMuted: '#3D6B8A',
    textInverse: '#050A18',

    // Borders
    border: 'rgba(0, 245, 255, 0.15)',
    borderBright: 'rgba(0, 245, 255, 0.5)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',

    // Gradients (used as array for LinearGradient)
    gradientPrimary: ['#050A18', '#0A1628', '#0F1F3D'],
    gradientCyan: ['rgba(0, 245, 255, 0.2)', 'rgba(0, 245, 255, 0)'],
    gradientSuccess: ['rgba(0, 255, 136, 0.3)', 'rgba(0, 255, 136, 0)'],
    gradientError: ['rgba(255, 51, 102, 0.3)', 'rgba(255, 51, 102, 0)'],

    // Overlay
    overlay: 'rgba(5, 10, 24, 0.7)',
    scanLine: 'rgba(0, 245, 255, 0.6)',
    grid: 'rgba(0, 245, 255, 0.08)',
  },

  // Light theme
  light: {
    background: '#F0F4F8',
    backgroundSecondary: '#E2EBF4',
    backgroundTertiary: '#D1E2F0',
    surface: 'rgba(255, 255, 255, 0.9)',
    surfaceGlass: 'rgba(255, 255, 255, 0.7)',
    surfaceGlassLight: 'rgba(0, 0, 0, 0.03)',

    cyan: '#0284C7',
    cyanDim: '#0EA5E9',
    cyanGlow: 'rgba(2, 132, 199, 0.2)',
    blue: '#1D4ED8',
    blueDim: '#2563EB',
    purple: '#7C3AED',
    purpleDim: '#8B5CF6',

    success: '#059669',
    successDim: '#10B981',
    successGlow: 'rgba(5, 150, 105, 0.25)',
    error: '#DC2626',
    errorDim: '#EF4444',
    errorGlow: 'rgba(220, 38, 38, 0.25)',
    warning: '#D97706',
    warningGlow: 'rgba(217, 119, 6, 0.2)',

    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#F8FAFC',

    border: 'rgba(2, 132, 199, 0.2)',
    borderBright: 'rgba(2, 132, 199, 0.6)',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',

    gradientPrimary: ['#F0F4F8', '#E2EBF4', '#D1E2F0'],
    gradientCyan: ['rgba(2, 132, 199, 0.15)', 'rgba(2, 132, 199, 0)'],
    gradientSuccess: ['rgba(5, 150, 105, 0.2)', 'rgba(5, 150, 105, 0)'],
    gradientError: ['rgba(220, 38, 38, 0.2)', 'rgba(220, 38, 38, 0)'],

    overlay: 'rgba(15, 23, 42, 0.5)',
    scanLine: 'rgba(2, 132, 199, 0.7)',
    grid: 'rgba(2, 132, 199, 0.06)',
  },
};

// ─── Typography ───────────────────────────────────────────────
export const Typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    extraBold: 'Inter-ExtraBold',
    mono: 'SpaceMono-Regular',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 1.5,
    wider: 3,
    widest: 6,
  },
};

// ─── Spacing ──────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
};

// ─── Border Radius ────────────────────────────────────────────
export const Radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
};

// ─── Shadows ──────────────────────────────────────────────────
export const Shadows = {
  glow: (color: string, radius = 20, opacity = 0.6) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: 20,
  }),
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

// ─── Animations ───────────────────────────────────────────────
export const Animation = {
  duration: {
    instant: 150,
    fast: 250,
    normal: 400,
    slow: 600,
    verySlow: 1000,
  },
  easing: {
    spring: { mass: 1, damping: 15, stiffness: 150 },
    bounce: { mass: 0.8, damping: 10, stiffness: 180 },
    smooth: { mass: 1, damping: 20, stiffness: 120 },
  },
};

// ─── Camera UI ────────────────────────────────────────────────
export const CameraUI = {
  faceBoxPadding: 20,
  scanLineHeight: 2,
  gridOpacity: 0.08,
  cornerBracketSize: 24,
  cornerBracketWidth: 3,
};

export type ColorTheme = typeof Colors.dark;
export type ThemeName = 'dark' | 'light';
