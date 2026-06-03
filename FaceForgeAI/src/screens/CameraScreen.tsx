/**
 * CameraScreen — Live face scan with HUD, liveness, recognition
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  runAsync,
} from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, AuthStage, LivenessState, BoundingBox } from '../types';
import { AuthService } from '../services/AuthService';
import { Colors, Typography, Spacing } from '../theme';
import { HUDOverlay } from '../components/camera/HUDOverlay';
import { LivenessStepIndicator } from '../components/camera/LivenessStepIndicator';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

export function CameraScreen({ navigation, route }: Props) {
  const { mode } = route.params;
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [stage, setStage] = useState<AuthStage>('detecting');
  const [livenessState, setLivenessState] = useState<LivenessState>({
    currentStep: 'idle',
    blinkDetected: false,
    headTurnDetected: false,
    stepProgress: 0,
    timeoutMs: 10000,
    startedAt: Date.now(),
  });
  const [faceBox, setFaceBox] = useState<BoundingBox | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 1080, height: 1920 });

  const authServiceRef = useRef(new AuthService({ livenessEnabled: true, gpsLogsEnabled: true }));

  // JS callbacks from Worklet context
  const onStageChangeJS = Worklets.createRunOnJS((s: AuthStage) => {
    setStage(s);
    if (s === 'success' || s === 'failure') {
      // Navigate to result after short delay
      setTimeout(() => {
        navigation.replace('Result', {
          result: {
            success: s === 'success',
            stage: s,
            log: { id: '', userId: null, userName: null, timestamp: Date.now(), result: s === 'success' ? 'success' : 'failure', synced: false, deviceId: '' },
          },
        });
      }, 800);
    }
  });

  const onLivenessUpdateJS = Worklets.createRunOnJS((state: LivenessState) => {
    setLivenessState(state);
  });

  const onFaceBoxUpdateJS = Worklets.createRunOnJS((box: BoundingBox | null) => {
    setFaceBox(box);
  });

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }

    const service = authServiceRef.current;
    service.setCallbacks(onStageChangeJS, onLivenessUpdateJS);
    service.startAuth();

    return () => {
      service.reset();
    };
  }, [hasPermission]);

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    runAsync(frame, () => {
      'worklet';
      // Note: In production, use VisionCamera Frame Processor Plugin
      // This is the integration point for native TFLite frame processing
      // The actual pixel data extraction happens via native plugin
    });
  }, []);

  const getHUDColor = () => {
    switch (stage) {
      case 'success': return Colors.dark.success;
      case 'failure': return Colors.dark.error;
      case 'liveness_blink':
      case 'liveness_turn': return Colors.dark.warning;
      default: return Colors.dark.cyan;
    }
  };

  const getInstruction = () => {
    switch (stage) {
      case 'detecting': return 'Align your face in the frame';
      case 'liveness_blink': return livenessState.currentStep === 'blink' ? '👁  Blink your eyes naturally' : '';
      case 'liveness_turn':
        return livenessState.currentStep === 'turn_left'
          ? '← Turn your head LEFT'
          : '→ Turn your head RIGHT';
      case 'recognizing': return '⚡ Identifying...';
      case 'success': return '✓ Identity Verified';
      case 'failure': return '✗ Authentication Failed';
      default: return '';
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={{ color: Colors.dark.cyan }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No front camera found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* ── Camera Feed ──────────────────────────────── */}
      <Camera
        style={StyleSheet.absoluteFillObject}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        fps={30}
        pixelFormat="rgb"
      />

      {/* ── HUD Overlay ──────────────────────────────── */}
      <HUDOverlay
        faceBox={faceBox}
        frameWidth={frameSize.width}
        frameHeight={frameSize.height}
        isActive={stage === 'detecting' || stage === 'liveness_blink' || stage === 'liveness_turn'}
        accentColor={getHUDColor()}
        instructionText={getInstruction()}
      />

      {/* ── Top Bar ──────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.modeTag}>
          <Text style={styles.modeText}>
            {mode === 'auth' ? '🔐 AUTHENTICATE' : '📋 REGISTER'}
          </Text>
        </View>
      </View>

      {/* ── Bottom Panel ─────────────────────────────── */}
      <LinearGradient
        colors={['transparent', 'rgba(5,10,24,0.95)']}
        style={styles.bottomPanel}
      >
        {/* Liveness Steps */}
        {(stage === 'liveness_blink' || stage === 'liveness_turn') && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <LivenessStepIndicator state={livenessState} />
          </Animated.View>
        )}

        {/* Stage label */}
        <View style={styles.stageRow}>
          <View style={[styles.stageDot, { backgroundColor: getHUDColor() }]} />
          <Text style={[styles.stageText, { color: getHUDColor() }]}>
            {stage.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        {/* Progress step dots */}
        <View style={styles.stepDots}>
          {['detecting', 'liveness_blink', 'liveness_turn', 'recognizing'].map((s, i) => {
            const stages: AuthStage[] = ['detecting', 'liveness_blink', 'liveness_turn', 'recognizing', 'success', 'failure'];
            const currentIdx = stages.indexOf(stage);
            const done = currentIdx > i;
            const active = currentIdx === i;
            return (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: done
                      ? Colors.dark.success
                      : active
                      ? getHUDColor()
                      : Colors.dark.textMuted,
                    opacity: done || active ? 1 : 0.3,
                    width: active ? 20 : 8,
                  },
                ]}
              />
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: Spacing.base,
    zIndex: 20,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modeTag: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  modeText: {
    color: Colors.dark.cyan,
    fontSize: Typography.fontSize.xs,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: Typography.letterSpacing.wide,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    alignItems: 'center',
    zIndex: 15,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stageText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: Typography.letterSpacing.wider,
  },
  stepDots: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  permissionText: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: 'Inter-Medium',
  },
  permissionBtn: {
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cyan,
    borderRadius: 12,
  },
});
