/**
 * FaceDetector — Real-time face detection via TFLite
 *
 * Uses the MediaPipe Face Detection Short-Range model.
 * Extracts: bounding boxes, 6 key landmarks, confidence.
 * Estimates yaw/pitch/roll from landmark positions.
 *
 * Frame processing is intentionally capped to every N frames
 * to balance accuracy vs. performance on mid-range devices.
 */

import { TensorflowModel } from 'react-native-fast-tflite';
import { loadModel } from './ModelLoader';
import { BoundingBox, DetectedFace, FaceLandmark } from '../types';

// ─── Constants ──────────────────────────────────────────────
const INPUT_SIZE = 128;
const SCORE_THRESHOLD = 0.65;
const NUM_ANCHORS = 896;
const NUM_COORDS = 16; // x, y, w, h, then 12 landmark coords

// MediaPipe SSD anchor generation params (simplified)
const ANCHORS = generateAnchors();

// ─── Main Detector Class ─────────────────────────────────────
export class FaceDetector {
  private model: TensorflowModel | null = null;
  private frameCount = 0;
  private frameSkip = 2; // Process every 3rd frame by default
  private lastResult: DetectedFace[] = [];
  private isReady = false;

  async initialize(frameSkip = 2): Promise<void> {
    this.model = await loadModel('face_detection');
    this.frameSkip = frameSkip;
    this.isReady = true;
    console.log('[FaceDetector] Ready');
  }

  setFrameSkip(skip: number): void {
    this.frameSkip = Math.max(0, skip);
  }

  get ready(): boolean {
    return this.isReady;
  }

  /**
   * Process a camera frame (expects RGB pixel data).
   * Returns cached results if frame is skipped.
   */
  async detectFaces(
    rgbData: Uint8Array | Float32Array,
    frameWidth: number,
    frameHeight: number,
  ): Promise<DetectedFace[]> {
    this.frameCount++;

    // Frame skipping for performance
    if (this.frameCount % (this.frameSkip + 1) !== 0) {
      return this.lastResult;
    }

    if (!this.model) {
      throw new Error('[FaceDetector] Model not initialized');
    }

    const startTime = Date.now();

    // ── Preprocess: resize + normalize to [-1, 1] ──
    const inputTensor = preprocessFrame(rgbData, frameWidth, frameHeight);

    // ── Run inference ──
    const outputs = await this.model.run([inputTensor]);
    const regressor = outputs[0] as Float32Array;  // shape [1, 896, 16]
    const scores = outputs[1] as Float32Array;      // shape [1, 896, 1]

    // ── Decode anchors + NMS ──
    const detections = decodeDetections(
      regressor,
      scores,
      frameWidth,
      frameHeight,
    );

    console.log(
      `[FaceDetector] ${detections.length} face(s) in ${Date.now() - startTime}ms`,
    );

    this.lastResult = detections;
    return detections;
  }

  destroy(): void {
    this.model = null;
    this.isReady = false;
  }
}

// ─── Preprocessing ───────────────────────────────────────────
function preprocessFrame(
  rgbData: Uint8Array | Float32Array,
  srcWidth: number,
  srcHeight: number,
): Float32Array {
  const output = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
  const scaleX = srcWidth / INPUT_SIZE;
  const scaleY = srcHeight / INPUT_SIZE;

  for (let y = 0; y < INPUT_SIZE; y++) {
    for (let x = 0; x < INPUT_SIZE; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);
      const srcIdx = (srcY * srcWidth + srcX) * 3;
      const dstIdx = (y * INPUT_SIZE + x) * 3;

      // Normalize from [0, 255] to [-1, 1]
      output[dstIdx] = (rgbData[srcIdx] / 127.5) - 1.0;
      output[dstIdx + 1] = (rgbData[srcIdx + 1] / 127.5) - 1.0;
      output[dstIdx + 2] = (rgbData[srcIdx + 2] / 127.5) - 1.0;
    }
  }

  return output;
}

// ─── Anchor Generation (MediaPipe simplified) ────────────────
function generateAnchors(): Float32Array {
  // Simplified anchor generation matching MediaPipe short-range model
  const anchors = new Float32Array(NUM_ANCHORS * 4);
  const strides = [8, 16, 16, 16];
  const anchorsPerStride = [2, 6, 6, 6];
  let anchorIdx = 0;

  for (let strideIdx = 0; strideIdx < strides.length; strideIdx++) {
    const stride = strides[strideIdx];
    const numAnchors = anchorsPerStride[strideIdx];
    const gridRows = Math.ceil(INPUT_SIZE / stride);
    const gridCols = Math.ceil(INPUT_SIZE / stride);

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        for (let a = 0; a < numAnchors; a++) {
          anchors[anchorIdx * 4 + 0] = (col + 0.5) / gridCols; // cx
          anchors[anchorIdx * 4 + 1] = (row + 0.5) / gridRows; // cy
          anchors[anchorIdx * 4 + 2] = 1.0; // w
          anchors[anchorIdx * 4 + 3] = 1.0; // h
          anchorIdx++;
          if (anchorIdx >= NUM_ANCHORS) break;
        }
        if (anchorIdx >= NUM_ANCHORS) break;
      }
      if (anchorIdx >= NUM_ANCHORS) break;
    }
    if (anchorIdx >= NUM_ANCHORS) break;
  }

  return anchors;
}

// ─── Detection Decoding ──────────────────────────────────────
function decodeDetections(
  regressor: Float32Array,
  scores: Float32Array,
  imgWidth: number,
  imgHeight: number,
): DetectedFace[] {
  const detections: DetectedFace[] = [];

  for (let i = 0; i < NUM_ANCHORS; i++) {
    const score = sigmoid(scores[i]);
    if (score < SCORE_THRESHOLD) continue;

    const anchorCx = ANCHORS[i * 4 + 0];
    const anchorCy = ANCHORS[i * 4 + 1];

    const cx = regressor[i * NUM_COORDS + 0] / INPUT_SIZE + anchorCx;
    const cy = regressor[i * NUM_COORDS + 1] / INPUT_SIZE + anchorCy;
    const w = regressor[i * NUM_COORDS + 2] / INPUT_SIZE;
    const h = regressor[i * NUM_COORDS + 3] / INPUT_SIZE;

    const bbox: BoundingBox = {
      x: (cx - w / 2) * imgWidth,
      y: (cy - h / 2) * imgHeight,
      width: w * imgWidth,
      height: h * imgHeight,
    };

    // Decode 6 landmarks (right eye, left eye, nose tip, mouth, right ear, left ear)
    const landmarks: FaceLandmark[] = [];
    for (let k = 0; k < 6; k++) {
      landmarks.push({
        x: (regressor[i * NUM_COORDS + 4 + k * 2] / INPUT_SIZE + anchorCx) * imgWidth,
        y: (regressor[i * NUM_COORDS + 5 + k * 2] / INPUT_SIZE + anchorCy) * imgHeight,
      });
    }

    // Extract specific landmarks
    const rightEye = [landmarks[0]];
    const leftEye = [landmarks[1]];
    const noseTip = landmarks[2];
    const mouthCenter = landmarks[3];

    // Estimate yaw from eye positions
    const eyeDeltaX = leftEye[0].x - rightEye[0].x;
    const eyeDeltaY = leftEye[0].y - rightEye[0].y;
    const yaw = estimateYaw(rightEye[0], leftEye[0], w * imgWidth);
    const pitch = estimatePitch(rightEye[0], leftEye[0], noseTip, mouthCenter);
    const roll = (Math.atan2(eyeDeltaY, eyeDeltaX) * 180) / Math.PI;

    detections.push({
      boundingBox: bbox,
      landmarks,
      confidence: score,
      leftEye,
      rightEye,
      yaw,
      pitch,
      roll,
    });
  }

  // Non-Maximum Suppression
  return nms(detections, 0.3);
}

// ─── Pose Estimation Helpers ─────────────────────────────────
function estimateYaw(
  rightEye: FaceLandmark,
  leftEye: FaceLandmark,
  faceWidth: number,
): number {
  if (faceWidth < 1) return 0;
  const eyeDistance = Math.abs(leftEye.x - rightEye.x);
  const ratio = eyeDistance / faceWidth;
  // Heuristic: full frontal ≈ 0.55 ratio
  const normalized = (ratio - 0.55) / 0.45;
  return normalized * 45; // degrees
}

function estimatePitch(
  rightEye: FaceLandmark,
  leftEye: FaceLandmark,
  nose: FaceLandmark,
  mouth: FaceLandmark,
): number {
  const eyeMidY = (rightEye.y + leftEye.y) / 2;
  const eyeMidX = (rightEye.x + leftEye.x) / 2;
  const faceHeight = Math.abs(mouth.y - eyeMidY);
  if (faceHeight < 1) return 0;
  const noseOffset = nose.y - eyeMidY;
  return ((noseOffset / faceHeight) - 0.45) * 60;
}

// ─── Non-Maximum Suppression ─────────────────────────────────
function nms(detections: DetectedFace[], iouThreshold: number): DetectedFace[] {
  detections.sort((a, b) => b.confidence - a.confidence);
  const kept: DetectedFace[] = [];

  for (const detection of detections) {
    let suppressed = false;
    for (const keptDetection of kept) {
      if (iou(detection.boundingBox, keptDetection.boundingBox) > iouThreshold) {
        suppressed = true;
        break;
      }
    }
    if (!suppressed) kept.push(detection);
  }

  return kept;
}

function iou(a: BoundingBox, b: BoundingBox): number {
  const intersectX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const intersectY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const intersect = intersectX * intersectY;
  const union = a.width * a.height + b.width * b.height - intersect;
  return union > 0 ? intersect / union : 0;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// ─── Singleton export ────────────────────────────────────────
export const faceDetector = new FaceDetector();
