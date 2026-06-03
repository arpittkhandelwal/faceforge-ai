/**
 * RegistrationService — Face Registration Pipeline
 */

import { faceDetector } from '../ai/FaceDetector';
import { faceRecognizer, embeddingToBase64 } from '../ai/FaceRecognizer';
import { registerUser, getAllUsers } from '../storage/EmbeddingStore';
import { cosineSimilarity, base64ToEmbedding } from '../ai/FaceRecognizer';
import { RegisteredUser } from '../types';
import RNFS from 'react-native-fs';

export interface RegistrationResult {
  success: boolean;
  user?: RegisteredUser;
  error?: string;
  isDuplicate?: boolean;
  duplicateUser?: RegisteredUser;
}

export async function registerFaceFromFrame(
  rgbData: Uint8Array,
  frameWidth: number,
  frameHeight: number,
  userName: string,
  photoUri?: string,
  duplicateThreshold = 0.85,
): Promise<RegistrationResult> {
  try {
    // Step 1: Detect face in frame
    const faces = await faceDetector.detectFaces(rgbData, frameWidth, frameHeight);

    if (faces.length === 0) {
      return { success: false, error: 'No face detected in frame' };
    }

    if (faces.length > 1) {
      return { success: false, error: 'Multiple faces detected. Please ensure only one person is visible.' };
    }

    const face = faces[0];

    if (face.confidence < 0.8) {
      return { success: false, error: 'Face quality too low. Please ensure good lighting.' };
    }

    // Step 2: Extract embedding
    const embedding = await faceRecognizer.extractEmbeddingFromFrame(
      rgbData,
      frameWidth,
      frameHeight,
      face.boundingBox.x,
      face.boundingBox.y,
      face.boundingBox.width,
      face.boundingBox.height,
    );

    // Step 3: Check for duplicates
    const existingUsers = await getAllUsers();
    for (const existingUser of existingUsers) {
      const existingEmbedding = base64ToEmbedding(existingUser.embeddingBase64);
      const similarity = cosineSimilarity(embedding, existingEmbedding);
      if (similarity > duplicateThreshold) {
        return {
          success: false,
          isDuplicate: true,
          duplicateUser: existingUser,
          error: `This face appears to be already registered as "${existingUser.name}"`,
        };
      }
    }

    // Step 4: Save photo if provided
    let savedPhotoUri = photoUri;
    if (photoUri) {
      const destPath = `${RNFS.DocumentDirectoryPath}/face_photos/${Date.now()}.jpg`;
      await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/face_photos`);
      await RNFS.copyFile(photoUri, destPath);
      savedPhotoUri = destPath;
    }

    // Step 5: Store embedding
    const embeddingBase64 = embeddingToBase64(embedding);
    const user = await registerUser(userName, embeddingBase64, savedPhotoUri);

    console.log(`[RegistrationService] ✅ Registered: ${userName}`);
    return { success: true, user };
  } catch (error) {
    console.error('[RegistrationService] ❌ Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// ─── Multi-frame Registration (better accuracy) ───────────────
export class MultiFrameRegistration {
  private embeddings: Float32Array[] = [];
  private captureCount = 0;
  private readonly targetCount: number;

  constructor(targetCount = 5) {
    this.targetCount = targetCount;
  }

  async addFrame(
    rgbData: Uint8Array,
    frameWidth: number,
    frameHeight: number,
  ): Promise<{ success: boolean; progress: number; error?: string }> {
    const faces = await faceDetector.detectFaces(rgbData, frameWidth, frameHeight);

    if (faces.length !== 1 || faces[0].confidence < 0.8) {
      return {
        success: false,
        progress: this.captureCount / this.targetCount,
        error: 'Please hold still with your face clearly visible',
      };
    }

    const face = faces[0];
    const embedding = await faceRecognizer.extractEmbeddingFromFrame(
      rgbData, frameWidth, frameHeight,
      face.boundingBox.x, face.boundingBox.y,
      face.boundingBox.width, face.boundingBox.height,
    );

    this.embeddings.push(embedding);
    this.captureCount++;

    return {
      success: true,
      progress: this.captureCount / this.targetCount,
    };
  }

  isComplete(): boolean {
    return this.captureCount >= this.targetCount;
  }

  /** Average multiple embeddings for robustness */
  getAverageEmbedding(): Float32Array {
    if (this.embeddings.length === 0) throw new Error('No embeddings captured');

    const dim = this.embeddings[0].length;
    const avg = new Float32Array(dim);

    for (const emb of this.embeddings) {
      for (let i = 0; i < dim; i++) {
        avg[i] += emb[i] / this.embeddings.length;
      }
    }

    return avg;
  }

  reset(): void {
    this.embeddings = [];
    this.captureCount = 0;
  }
}
