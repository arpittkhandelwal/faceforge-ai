/**
 * useFaceAuth — Main auth orchestrator hook
 */

import { useRef, useState, useCallback } from 'react';
import { AuthService } from '../services/AuthService';
import { AuthStage, LivenessState, BoundingBox } from '../types';

interface FaceAuthState {
  stage: AuthStage;
  livenessState: LivenessState;
  faceBox: BoundingBox | null;
  isRunning: boolean;
}

export function useFaceAuth() {
  const serviceRef = useRef(
    new AuthService({ livenessEnabled: true, gpsLogsEnabled: true }),
  );

  const [state, setState] = useState<FaceAuthState>({
    stage: 'idle',
    livenessState: {
      currentStep: 'idle',
      blinkDetected: false,
      headTurnDetected: false,
      stepProgress: 0,
      timeoutMs: 10000,
      startedAt: Date.now(),
    },
    faceBox: null,
    isRunning: false,
  });

  const startAuth = useCallback(async () => {
    const service = serviceRef.current;

    service.setCallbacks(
      (stage: AuthStage) => {
        setState(prev => ({ ...prev, stage, isRunning: stage !== 'success' && stage !== 'failure' }));
      },
      (livenessState: LivenessState) => {
        setState(prev => ({ ...prev, livenessState }));
      },
    );

    setState(prev => ({ ...prev, isRunning: true, stage: 'detecting' }));
    await service.startAuth();
  }, []);

  const reset = useCallback(() => {
    serviceRef.current.reset();
    setState({
      stage: 'idle',
      livenessState: {
        currentStep: 'idle',
        blinkDetected: false,
        headTurnDetected: false,
        stepProgress: 0,
        timeoutMs: 10000,
        startedAt: Date.now(),
      },
      faceBox: null,
      isRunning: false,
    });
  }, []);

  const processFrame = useCallback(
    async (rgbData: Uint8Array, width: number, height: number) => {
      await serviceRef.current.processFrame(rgbData, width, height);
    },
    [],
  );

  return {
    ...state,
    startAuth,
    reset,
    processFrame,
    getInstruction: () => serviceRef.current.getLivenessState
      ? serviceRef.current.getLivenessState().currentStep
      : 'idle',
  };
}
