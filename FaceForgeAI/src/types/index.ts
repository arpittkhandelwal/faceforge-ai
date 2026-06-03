// ============================================================
// FACE AUTH SYSTEM — TypeScript Types & Interfaces
// ============================================================

// ─── Face Detection ─────────────────────────────────────────
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface DetectedFace {
  boundingBox: BoundingBox;
  landmarks: FaceLandmark[];
  confidence: number;
  // Eye landmarks (indices into landmarks array)
  leftEye: FaceLandmark[];
  rightEye: FaceLandmark[];
  // Pose estimation
  yaw: number;   // degrees: negative=left, positive=right
  pitch: number; // degrees: negative=down, positive=up
  roll: number;  // degrees
}

// ─── Face Recognition ───────────────────────────────────────
export type Embedding = Float32Array;

export interface EmbeddingMatch {
  userId: string;
  userName: string;
  similarity: number; // 0–1, cosine similarity
  threshold: number;
}

// ─── Liveness Detection ─────────────────────────────────────
export type LivenessStep = 'idle' | 'blink' | 'turn_left' | 'turn_right' | 'passed' | 'failed';

export interface LivenessState {
  currentStep: LivenessStep;
  blinkDetected: boolean;
  headTurnDetected: boolean;
  stepProgress: number;  // 0–1
  timeoutMs: number;
  startedAt: number;
}

export interface LivenessConfig {
  blinkEARThreshold: number;    // default 0.25
  blinkFrameCount: number;      // default 2 consecutive frames
  headTurnYawDeg: number;       // default 20°
  stepTimeoutMs: number;        // default 10000ms
  requiredDirection: 'left' | 'right' | 'any';
}

// ─── Users & Storage ────────────────────────────────────────
export interface RegisteredUser {
  id: string;
  name: string;
  embeddingBase64: string;
  photoUri?: string;
  createdAt: number;
  lastAuthAt?: number;
}

export interface AuthLog {
  id: string;
  userId: string | null;
  userName: string | null;
  timestamp: number;
  latitude?: number;
  longitude?: number;
  result: 'success' | 'failure' | 'liveness_failed' | 'no_face';
  confidence?: number;
  synced: boolean;
  deviceId: string;
}

// ─── Auth Pipeline ──────────────────────────────────────────
export type AuthStage =
  | 'idle'
  | 'detecting'
  | 'liveness_blink'
  | 'liveness_turn'
  | 'recognizing'
  | 'success'
  | 'failure';

export interface AuthResult {
  success: boolean;
  stage: AuthStage;
  user?: RegisteredUser;
  confidence?: number;
  log: AuthLog;
  error?: string;
}

// ─── Sync Queue ─────────────────────────────────────────────
export interface SyncItem {
  id: string;
  type: 'log' | 'embedding';
  payload: string; // JSON serialized
  createdAt: number;
  attempts: number;
  lastAttemptAt?: number;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncAt?: number;
  isSyncing: boolean;
  error?: string;
}

// ─── Settings ───────────────────────────────────────────────
export interface AppSettings {
  theme: 'dark' | 'light';
  performanceMode: boolean;      // skip more frames
  hapticFeedback: boolean;
  awsEndpoint: string;
  awsRegion: string;
  recognitionThreshold: number;  // default 0.7
  livenessEnabled: boolean;
  gpsLogsEnabled: boolean;
}

// ─── Camera ─────────────────────────────────────────────────
export interface FrameProcessorResult {
  faces: DetectedFace[];
  processingTimeMs: number;
  frameWidth: number;
  frameHeight: number;
}

// ─── Navigation ─────────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Camera: { mode: 'auth' | 'register'; userName?: string };
  Result: { result: AuthResult };
  Logs: undefined;
  Settings: undefined;
  Register: undefined;
};
