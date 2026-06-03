/**
 * AuthService — Full Authentication Pipeline
 *
 * Orchestrates: face detection → liveness → recognition → logging
 */

import { faceDetector } from '../ai/FaceDetector';
import { faceRecognizer, embeddingToBase64 } from '../ai/FaceRecognizer';
import { LivenessDetector } from '../ai/LivenessDetector';
import { getAllUsers, updateLastAuthAt } from '../storage/EmbeddingStore';
import { insertAuthLog } from '../storage/LogStore';
import { enqueueItem } from '../storage/SyncQueue';
import {
  AuthResult,
  AuthStage,
  AuthLog,
  DetectedFace,
  LivenessState,
  AppSettings,
} from '../types';
import Geolocation from '@react-native-community/geolocation';

// ─── Auth Pipeline Controller ────────────────────────────────
export class AuthService {
  private currentStage: AuthStage = 'idle';
  private livenessDetector: LivenessDetector;
  private onStageChange?: (stage: AuthStage) => void;
  private onLivenessUpdate?: (state: LivenessState) => void;
  private settings: Partial<AppSettings>;
  private isRunning = false;
  private pendingEmbedding: Float32Array | null = null;
  private lastFace: DetectedFace | null = null;

  constructor(settings: Partial<AppSettings> = {}) {
    this.settings = settings;
    this.livenessDetector = new LivenessDetector({
      requiredDirection: 'any',
      stepTimeoutMs: 10000,
    });

    this.livenessDetector.setOnStateChange(state => {
      this.onLivenessUpdate?.(state);

      if (state.currentStep === 'passed') {
        this.proceedToRecognition();
      } else if (state.currentStep === 'failed') {
        this.handleLivenessFailure();
      }
    });
  }

  setCallbacks(
    onStageChange: (stage: AuthStage) => void,
    onLivenessUpdate: (state: LivenessState) => void,
  ): void {
    this.onStageChange = onStageChange;
    this.onLivenessUpdate = onLivenessUpdate;
  }

  getStage(): AuthStage {
    return this.currentStage;
  }

  getLivenessState(): LivenessState {
    return this.livenessDetector.getState();
  }

  // ─── Start Authentication ────────────────────────────────
  async startAuth(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.pendingEmbedding = null;
    this.lastFace = null;
    this.setStage('detecting');
  }

  // ─── Process Frame (called per camera frame) ─────────────
  async processFrame(
    rgbData: Uint8Array,
    frameWidth: number,
    frameHeight: number,
  ): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Stage 1: Detect
      const faces = await faceDetector.detectFaces(rgbData, frameWidth, frameHeight);

      if (faces.length === 0) {
        if (this.currentStage === 'detecting') {
          this.lastFace = null;
        }
        this.livenessDetector.processFrame(null);
        return;
      }

      const primaryFace = faces[0]; // Use highest-confidence face
      this.lastFace = primaryFace;

      // Stage 2: Start liveness if we just detected a face
      if (this.currentStage === 'detecting') {
        this.setStage('liveness_blink');
        this.livenessDetector.start();
      }

      // Stage 3: Process liveness frames
      if (
        this.currentStage === 'liveness_blink' ||
        this.currentStage === 'liveness_turn'
      ) {
        const state = this.livenessDetector.processFrame(primaryFace);

        // Update sub-stage based on liveness step
        if (state.currentStep === 'blink') {
          this.setStage('liveness_blink');
        } else if (
          state.currentStep === 'turn_left' ||
          state.currentStep === 'turn_right'
        ) {
          this.setStage('liveness_turn');
        }

        // Extract embedding during liveness for faster response after pass
        if (!this.pendingEmbedding && primaryFace.confidence > 0.8) {
          try {
            this.pendingEmbedding = await faceRecognizer.extractEmbeddingFromFrame(
              rgbData,
              frameWidth,
              frameHeight,
              primaryFace.boundingBox.x,
              primaryFace.boundingBox.y,
              primaryFace.boundingBox.width,
              primaryFace.boundingBox.height,
            );
          } catch {
            // Non-fatal: will retry next frame
          }
        }
      }
    } catch (error) {
      console.error('[AuthService] Frame processing error:', error);
    }
  }

  // ─── Proceed to Recognition ──────────────────────────────
  private async proceedToRecognition(): Promise<void> {
    this.setStage('recognizing');

    try {
      const users = await getAllUsers();

      if (users.length === 0) {
        await this.completeAuth({
          success: false,
          stage: 'failure',
          error: 'No registered users found',
        });
        return;
      }

      // Use pre-extracted embedding or try to get one from last frame
      let embedding = this.pendingEmbedding;
      if (!embedding) {
        this.setStage('failure');
        await this.completeAuth({
          success: false,
          stage: 'failure',
          error: 'Could not extract face embedding',
        });
        return;
      }

      const threshold = this.settings.recognitionThreshold ?? 0.7;
      const match = faceRecognizer.findBestMatch(embedding, users, threshold);

      if (match) {
        const user = users.find(u => u.id === match.userId)!;
        await updateLastAuthAt(user.id, Date.now());

        await this.completeAuth({
          success: true,
          stage: 'success',
          user,
          confidence: match.similarity,
        });
      } else {
        await this.completeAuth({
          success: false,
          stage: 'failure',
          error: `No match found (threshold: ${threshold})`,
        });
      }
    } catch (error) {
      console.error('[AuthService] Recognition error:', error);
      await this.completeAuth({
        success: false,
        stage: 'failure',
        error: (error as Error).message,
      });
    }
  }

  private async handleLivenessFailure(): Promise<void> {
    await this.completeAuth({
      success: false,
      stage: 'failure',
      error: 'Liveness check failed',
    });
  }

  // ─── Complete Auth & Log ──────────────────────────────────
  private async completeAuth(
    partial: Omit<AuthResult, 'log'>,
  ): Promise<void> {
    this.isRunning = false;
    this.setStage(partial.stage);

    // Get GPS if enabled
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (this.settings.gpsLogsEnabled) {
      try {
        await new Promise<void>((resolve) => {
          Geolocation.getCurrentPosition(
            pos => {
              latitude = pos.coords.latitude;
              longitude = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 2000, maximumAge: 30000 },
          );
        });
      } catch {
        // GPS optional
      }
    }

    const logEntry = await insertAuthLog({
      userId: partial.user?.id ?? null,
      userName: partial.user?.name ?? null,
      timestamp: Date.now(),
      latitude,
      longitude,
      result: partial.success ? 'success' : 'failure',
      confidence: partial.confidence,
    });

    // Enqueue for sync
    await enqueueItem('log', logEntry);
  }

  // ─── Reset ────────────────────────────────────────────────
  reset(): void {
    this.isRunning = false;
    this.pendingEmbedding = null;
    this.lastFace = null;
    this.livenessDetector.reset();
    this.setStage('idle');
  }

  private setStage(stage: AuthStage): void {
    if (this.currentStage !== stage) {
      this.currentStage = stage;
      this.onStageChange?.(stage);
    }
  }
}
