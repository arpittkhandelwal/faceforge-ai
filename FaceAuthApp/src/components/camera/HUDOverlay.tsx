/**
 * HUDOverlay — Iron Man / Face ID style camera HUD
 * SVG-based with corner brackets, grid, and face bounding box
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import Svg, {
  Rect,
  Line,
  Circle,
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  G,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { BoundingBox } from '../../types';
import { Colors } from '../../theme';
import { ScanLine } from '../animations/ScanLine';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GRID_COLS = 12;
const GRID_ROWS = 18;

interface HUDOverlayProps {
  faceBox?: BoundingBox | null;
  frameWidth: number;
  frameHeight: number;
  isActive: boolean;
  accentColor?: string;
  showGrid?: boolean;
  instructionText?: string;
}

export function HUDOverlay({
  faceBox,
  frameWidth,
  frameHeight,
  isActive,
  accentColor = Colors.dark.cyan,
  showGrid = true,
  instructionText,
}: HUDOverlayProps) {
  const opacity = useSharedValue(1);
  const cornerAnim = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // Subtle flicker on corners
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 200 }),
          withTiming(1, { duration: 200 }),
        ),
        -1,
        true,
      );
      cornerAnim.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      opacity.value = 0.5;
    }
  }, [isActive]);

  // Scale face bounding box from frame coordinates to screen coordinates
  const scaleX = SCREEN_W / (frameWidth || 1);
  const scaleY = SCREEN_H / (frameHeight || 1);

  let scaledBox: BoundingBox | null = null;
  if (faceBox) {
    scaledBox = {
      x: faceBox.x * scaleX,
      y: faceBox.y * scaleY,
      width: faceBox.width * scaleX,
      height: faceBox.height * scaleY,
    };
  }

  const gridCellW = SCREEN_W / GRID_COLS;
  const gridCellH = SCREEN_H / GRID_ROWS;

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg
        width={SCREEN_W}
        height={SCREEN_H}
        style={StyleSheet.absoluteFillObject}
      >
        <Defs>
          <SvgGradient id="faceBoxGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={accentColor} stopOpacity="0.8" />
            <Stop offset="1" stopColor={accentColor} stopOpacity="0.3" />
          </SvgGradient>
        </Defs>

        {/* ── Background Grid ──────────────────────────── */}
        {showGrid && (
          <G opacity={0.06}>
            {Array.from({ length: GRID_COLS + 1 }, (_, i) => (
              <Line
                key={`v${i}`}
                x1={i * gridCellW}
                y1={0}
                x2={i * gridCellW}
                y2={SCREEN_H}
                stroke={accentColor}
                strokeWidth={0.5}
              />
            ))}
            {Array.from({ length: GRID_ROWS + 1 }, (_, i) => (
              <Line
                key={`h${i}`}
                x1={0}
                y1={i * gridCellH}
                x2={SCREEN_W}
                y2={i * gridCellH}
                stroke={accentColor}
                strokeWidth={0.5}
              />
            ))}
          </G>
        )}

        {/* ── Screen Corner Brackets ───────────────────── */}
        <CornerBrackets
          x={20}
          y={80}
          size={32}
          color={accentColor}
          opacity={0.8}
          position="top-left"
        />
        <CornerBrackets
          x={SCREEN_W - 20 - 32}
          y={80}
          size={32}
          color={accentColor}
          opacity={0.8}
          position="top-right"
        />
        <CornerBrackets
          x={20}
          y={SCREEN_H - 80 - 32}
          size={32}
          color={accentColor}
          opacity={0.8}
          position="bottom-left"
        />
        <CornerBrackets
          x={SCREEN_W - 20 - 32}
          y={SCREEN_H - 80 - 32}
          size={32}
          color={accentColor}
          opacity={0.8}
          position="bottom-right"
        />

        {/* ── Face Bounding Box ────────────────────────── */}
        {scaledBox && (
          <G>
            {/* Glow fill */}
            <Rect
              x={scaledBox.x}
              y={scaledBox.y}
              width={scaledBox.width}
              height={scaledBox.height}
              fill={accentColor}
              fillOpacity={0.04}
              stroke={accentColor}
              strokeWidth={1.5}
              strokeOpacity={0.8}
              rx={8}
            />
            {/* Corner brackets on face box */}
            <FaceBoxCorners box={scaledBox} color={accentColor} />

            {/* Center crosshair */}
            <Circle
              cx={scaledBox.x + scaledBox.width / 2}
              cy={scaledBox.y + scaledBox.height / 2}
              r={4}
              fill={accentColor}
              fillOpacity={0.6}
            />
          </G>
        )}

        {/* ── Status Indicator (top right) ─────────────── */}
        <G transform={`translate(${SCREEN_W - 80}, 100)`}>
          <Rect
            width={60}
            height={18}
            rx={4}
            fill={isActive ? accentColor : '#555'}
            fillOpacity={0.3}
            stroke={isActive ? accentColor : '#555'}
            strokeWidth={0.5}
          />
          <Line x1={4} y1={9} x2={6} y2={9} stroke={accentColor} strokeWidth={1.5} />
          <Line x1={8} y1={5} x2={8} y2={13} stroke={accentColor} strokeWidth={1.5} />
          <Line x1={10} y1={3} x2={10} y2={15} stroke={accentColor} strokeWidth={1.5} />
          <Line x1={12} y1={6} x2={12} y2={12} stroke={accentColor} strokeWidth={1.5} />
        </G>
      </Svg>

      {/* ── Scan Line ───────────────────────────────────── */}
      {isActive && (
        <ScanLine
          height={SCREEN_H}
          color={accentColor}
          duration={2800}
          active={isActive && !faceBox}
        />
      )}

      {/* ── Instruction Text ─────────────────────────────── */}
      {instructionText && (
        <View style={styles.instructionContainer}>
          <Text style={[styles.instructionText, { color: accentColor }]}>
            {instructionText}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Corner Bracket SVG Helper ────────────────────────────────
function CornerBrackets({
  x,
  y,
  size,
  color,
  opacity,
  position,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const s = size;
  const stroke = color;
  const sw = 2.5;
  const op = opacity;

  const paths: Record<string, string> = {
    'top-left': `M${x + s},${y} L${x},${y} L${x},${y + s}`,
    'top-right': `M${x},${y} L${x + s},${y} L${x + s},${y + s}`,
    'bottom-left': `M${x + s},${y + s} L${x},${y + s} L${x},${y}`,
    'bottom-right': `M${x},${y + s} L${x + s},${y + s} L${x + s},${y}`,
  };

  return (
    <Path
      d={paths[position]}
      stroke={stroke}
      strokeWidth={sw}
      fill="none"
      opacity={op}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

// ─── Face Box Corner Brackets ─────────────────────────────────
function FaceBoxCorners({
  box,
  color,
}: {
  box: BoundingBox;
  color: string;
}) {
  const { x, y, width: w, height: h } = box;
  const s = 20;
  const sw = 2.5;

  return (
    <G stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round">
      {/* Top-left */}
      <Path d={`M${x + s},${y} L${x},${y} L${x},${y + s}`} />
      {/* Top-right */}
      <Path d={`M${x + w - s},${y} L${x + w},${y} L${x + w},${y + s}`} />
      {/* Bottom-left */}
      <Path d={`M${x + s},${y + h} L${x},${y + h} L${x},${y + h - s}`} />
      {/* Bottom-right */}
      <Path d={`M${x + w - s},${y + h} L${x + w},${y + h} L${x + w},${y + h - s}`} />
    </G>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 160,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
});
