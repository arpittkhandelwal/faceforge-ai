/**
 * FaceRecognizer — MobileFaceNet Inference + Cosine Similarity
 *
 * Converts a face crop (112×112) into a 128-dimensional embedding.
 * Matches against stored embeddings using cosine similarity.
 * Threshold: 0.7 for positive identification.
 */

import { TensorflowModel } from 'react-native-fast-tflite';
import { loadModel } from './ModelLoader';
import { Embedding, EmbeddingMatch, RegisteredUser } from '../types';

// ─── Constants ──────────────────────────────────────────────
const INPUT_SIZE = 112;
const EMBEDDING_DIM = 128;
const DEFAULT_THRESHOLD = 0.7;

// ─── Face Recognizer Class ───────────────────────────────────
export class FaceRecognizer {
  private model: TensorflowModel | null = null;
  private isReady = false;

  async initialize(): Promise<void> {
    this.model = await loadModel('face_recognition');
    this.isReady = true;
    console.log('[FaceRecognizer] Ready');
  }

  get ready(): boolean {
    return this.isReady;
  }

  /**
   * Extract a 128-dim embedding from a face crop.
   * @param rgbData — Raw RGB pixel data (112×112×3 = 37,632 values)
   * @returns Normalized 128-dim Float32Array embedding
   */
  async extractEmbedding(rgbData: Uint8Array | Float32Array): Promise<Embedding> {
    if (!this.model) throw new Error('[FaceRecognizer] Model not initialized');

    const input = preprocessFaceCrop(rgbData);
    const outputs = await this.model.run([input]);
    const rawEmbedding = outputs[0] as Float32Array;
    return l2Normalize(rawEmbedding);
  }

  /**
   * Extract embedding from a bounding-box crop of a full frame.
   */
  async extractEmbeddingFromFrame(
    rgbData: Uint8Array,
    frameWidth: number,
    frameHeight: number,
    cropX: number,
    cropY: number,
    cropWidth: number,
    cropHeight: number,
  ): Promise<Embedding> {
    const cropped = cropAndResize(
      rgbData,
      frameWidth,
      frameHeight,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
    );
    return this.extractEmbedding(cropped);
  }

  /**
   * Match a query embedding against a list of registered users.
   * Returns matches sorted by similarity (descending).
   */
  findMatches(
    queryEmbedding: Embedding,
    users: RegisteredUser[],
    threshold = DEFAULT_THRESHOLD,
  ): EmbeddingMatch[] {
    const matches: EmbeddingMatch[] = [];

    for (const user of users) {
      const storedEmbedding = base64ToEmbedding(user.embeddingBase64);
      const similarity = cosineSimilarity(queryEmbedding, storedEmbedding);

      if (similarity >= threshold) {
        matches.push({
          userId: user.id,
          userName: user.name,
          similarity,
          threshold,
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Find best single match.
   */
  findBestMatch(
    queryEmbedding: Embedding,
    users: RegisteredUser[],
    threshold = DEFAULT_THRESHOLD,
  ): EmbeddingMatch | null {
    const matches = this.findMatches(queryEmbedding, users, threshold);
    return matches.length > 0 ? matches[0] : null;
  }

  destroy(): void {
    this.model = null;
    this.isReady = false;
  }
}

// ─── Preprocessing ───────────────────────────────────────────
function preprocessFaceCrop(rgbData: Uint8Array | Float32Array): Float32Array {
  const output = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
  const len = Math.min(rgbData.length, output.length);

  for (let i = 0; i < len; i++) {
    // MobileFaceNet expects normalization to [-1, 1]
    output[i] = (rgbData[i] / 127.5) - 1.0;
  }

  return output;
}

/**
 * Bilinear-interpolation crop + resize from a full frame.
 */
function cropAndResize(
  rgbData: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
): Uint8Array {
  const output = new Uint8Array(INPUT_SIZE * INPUT_SIZE * 3);

  // Add padding margin (20%) to include chin and forehead
  const margin = 0.2;
  const x1 = Math.max(0, cropX - cropWidth * margin);
  const y1 = Math.max(0, cropY - cropHeight * margin);
  const x2 = Math.min(srcWidth, cropX + cropWidth * (1 + margin));
  const y2 = Math.min(srcHeight, cropY + cropHeight * (1 + margin));
  const w = x2 - x1;
  const h = y2 - y1;

  for (let y = 0; y < INPUT_SIZE; y++) {
    for (let x = 0; x < INPUT_SIZE; x++) {
      const srcX = Math.floor(x1 + (x / INPUT_SIZE) * w);
      const srcY = Math.floor(y1 + (y / INPUT_SIZE) * h);
      const clampedX = Math.min(Math.max(0, srcX), srcWidth - 1);
      const clampedY = Math.min(Math.max(0, srcY), srcHeight - 1);
      const srcIdx = (clampedY * srcWidth + clampedX) * 3;
      const dstIdx = (y * INPUT_SIZE + x) * 3;
      output[dstIdx] = rgbData[srcIdx];
      output[dstIdx + 1] = rgbData[srcIdx + 1];
      output[dstIdx + 2] = rgbData[srcIdx + 2];
    }
  }

  return output;
}

// ─── Math Utilities ──────────────────────────────────────────
function l2Normalize(embedding: Float32Array): Float32Array {
  let norm = 0;
  for (let i = 0; i < embedding.length; i++) {
    norm += embedding[i] * embedding[i];
  }
  norm = Math.sqrt(norm);
  if (norm < 1e-8) return embedding;

  const normalized = new Float32Array(embedding.length);
  for (let i = 0; i < embedding.length; i++) {
    normalized[i] = embedding[i] / norm;
  }
  return normalized;
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

// ─── Serialization Helpers ───────────────────────────────────
export function embeddingToBase64(embedding: Float32Array): string {
  const bytes = new Uint8Array(embedding.buffer);
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export function base64ToEmbedding(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Float32Array(bytes.buffer);
}

// ─── Singleton export ────────────────────────────────────────
export const faceRecognizer = new FaceRecognizer();
