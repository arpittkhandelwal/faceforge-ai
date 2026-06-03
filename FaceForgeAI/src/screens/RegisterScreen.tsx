/**
 * RegisterScreen — Face registration with multi-frame capture
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { MultiFrameRegistration } from '../services/RegistrationService';
import { embeddingToBase64 } from '../ai/FaceRecognizer';
import { registerUser } from '../storage/EmbeddingStore';
import { useTheme } from '../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { NeonButton } from '../components/common/NeonButton';
import { GlassCard } from '../components/common/GlassCard';
import { HUDOverlay } from '../components/camera/HUDOverlay';

const { width } = Dimensions.get('window');
type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [userName, setUserName] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [captureCount, setCaptureCount] = useState(0);
  const [status, setStatus] = useState<'idle' | 'capturing' | 'processing' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('Enter your name and tap Start Capture');

  const registrationRef = useRef(new MultiFrameRegistration(5));
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  useEffect(() => {
    progressAnim.value = withTiming(progress, { duration: 400 });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const startCapture = () => {
    if (!userName.trim()) {
      Alert.alert('Name Required', 'Please enter a name before capturing.');
      return;
    }
    registrationRef.current.reset();
    setProgress(0);
    setCaptureCount(0);
    setCapturing(true);
    setStatus('capturing');
    setMessage('Hold still — capturing your face...');
    captureFrames();
  };

  const captureFrames = async () => {
    // In production, this integrates with VisionCamera frame processor
    // Simulating frame capture flow here
    const targetFrames = 5;

    for (let i = 0; i < targetFrames; i++) {
      await new Promise(r => setTimeout(r, 600));
      const newCount = i + 1;
      setCaptureCount(newCount);
      setProgress(newCount / targetFrames);
      setMessage(`Captured ${newCount}/${targetFrames} frames...`);
    }

    // Process registration
    setStatus('processing');
    setMessage('Processing face data...');

    try {
      // Create a dummy embedding for demonstration
      // In production: registrationRef.current.getAverageEmbedding()
      const dummyEmbedding = new Float32Array(128).fill(0).map(() => Math.random() - 0.5);
      const embeddingBase64 = embeddingToBase64(dummyEmbedding);

      const user = await registerUser(userName.trim(), embeddingBase64);
      setStatus('done');
      setMessage(`✓ ${user.name} registered successfully!`);
      setCapturing(false);

      setTimeout(() => {
        Alert.alert(
          'Registration Complete',
          `${user.name} has been registered. They can now use Face Authentication.`,
          [{ text: 'Go Home', onPress: () => navigation.popToTop() }],
        );
      }, 500);
    } catch (error) {
      setStatus('error');
      setMessage(`Error: ${(error as Error).message}`);
      setCapturing(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'done': return colors.success;
      case 'error': return colors.error;
      case 'capturing':
      case 'processing': return colors.cyan;
      default: return colors.textMuted;
    }
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundSecondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Camera Preview */}
      <View style={styles.cameraWrap}>
        {device && hasPermission && (
          <Camera
            style={StyleSheet.absoluteFillObject}
            device={device}
            isActive={true}
            fps={15}
          />
        )}
        <HUDOverlay
          faceBox={null}
          frameWidth={1080}
          frameHeight={1920}
          isActive={capturing}
          accentColor={getStatusColor()}
          showGrid={true}
          instructionText={capturing ? 'Hold still · Look at camera' : undefined}
        />
        {/* Overlay for name input area */}
        <LinearGradient
          colors={['rgba(5,10,24,0.8)', 'transparent', 'transparent', 'rgba(5,10,24,0.9)']}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <GlassCard style={styles.card} glowColor={getStatusColor()}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Register New Face
            </Text>

            {/* Name Input */}
            <TextInput
              style={[
                styles.nameInput,
                {
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceGlassLight,
                },
              ]}
              placeholder="Full Name"
              placeholderTextColor={colors.textMuted}
              value={userName}
              onChangeText={setUserName}
              editable={!capturing && status !== 'processing'}
              returnKeyType="done"
            />

            {/* Progress bar */}
            {capturing && (
              <View style={styles.progressWrap}>
                <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle }]}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { backgroundColor: colors.cyan },
                      progressStyle,
                    ]}
                  />
                </View>
                <Text style={[styles.captureCount, { color: colors.cyan }]}>
                  {captureCount}/5 frames
                </Text>
              </View>
            )}

            {/* Status message */}
            <Text style={[styles.statusMsg, { color: getStatusColor() }]}>
              {message}
            </Text>

            {/* Action button */}
            <NeonButton
              label={status === 'done' ? 'Done' : capturing ? 'Capturing...' : 'Start Capture'}
              onPress={status === 'done' ? () => navigation.popToTop() : startCapture}
              variant={status === 'done' ? 'primary' : 'primary'}
              loading={capturing && status !== 'done'}
              disabled={!userName.trim() || (capturing && status !== 'done')}
              fullWidth
            />

            <NeonButton
              label="Cancel"
              onPress={() => navigation.goBack()}
              variant="ghost"
              fullWidth
            />
          </GlassCard>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cameraWrap: {
    flex: 1,
    backgroundColor: '#000',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  card: {
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  nameInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.base,
    fontFamily: 'Inter-Regular',
  },
  progressWrap: {
    gap: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  captureCount: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    letterSpacing: 1,
  },
  statusMsg: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    minHeight: 20,
  },
});
