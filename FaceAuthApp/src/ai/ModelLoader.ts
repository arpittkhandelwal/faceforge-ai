/**
 * ModelLoader — TFLite Model Management
 *
 * Loads and caches TFLite models from bundled assets.
 * Uses react-native-fast-tflite for zero-copy native inference.
 */

import { TensorflowModel, loadTensorflowModel } from 'react-native-fast-tflite';
import { Platform } from 'react-native';

// ─── Model Registry ─────────────────────────────────────────
export type ModelName = 'face_detection' | 'face_recognition';

interface ModelConfig {
  filename: string;
  description: string;
  inputShape: number[];
  outputShape: number[];
  delegate?: 'gpu' | 'nnapi' | 'default';
}

const MODEL_CONFIGS: Record<ModelName, ModelConfig> = {
  face_detection: {
    filename: 'face_detection_short.tflite',
    description: 'MediaPipe Face Detection (Short Range)',
    inputShape: [1, 128, 128, 3],
    outputShape: [1, 896, 16],
    delegate: Platform.OS === 'android' ? 'nnapi' : 'default',
  },
  face_recognition: {
    filename: 'mobile_face_net.tflite',
    description: 'MobileFaceNet — 128-dim embedding',
    inputShape: [1, 112, 112, 3],
    outputShape: [1, 128],
    delegate: Platform.OS === 'android' ? 'nnapi' : 'default',
  },
};

// ─── Model Cache ────────────────────────────────────────────
const modelCache = new Map<ModelName, TensorflowModel>();
let isInitialized = false;

// ─── Loader ─────────────────────────────────────────────────
export async function loadModel(name: ModelName): Promise<TensorflowModel> {
  if (modelCache.has(name)) {
    return modelCache.get(name)!;
  }

  const config = MODEL_CONFIGS[name];
  console.log(`[ModelLoader] Loading ${config.description}...`);

  const startTime = Date.now();

  try {
    const model = await loadTensorflowModel(
      require(`../../models/${config.filename}`),
    );

    // Warm-up inference to JIT-compile the model
    await warmupModel(model, config);

    modelCache.set(name, model);
    console.log(
      `[ModelLoader] ✅ ${name} loaded in ${Date.now() - startTime}ms`,
    );
    return model;
  } catch (error) {
    console.error(`[ModelLoader] ❌ Failed to load ${name}:`, error);
    throw new Error(`Failed to load model "${name}": ${error}`);
  }
}

// ─── Warm-up ─────────────────────────────────────────────────
async function warmupModel(
  model: TensorflowModel,
  config: ModelConfig,
): Promise<void> {
  const totalElements = config.inputShape.reduce((a, b) => a * b, 1);
  const dummyInput = new Float32Array(totalElements).fill(0);
  await model.run([dummyInput]);
  console.log(`[ModelLoader] Warm-up complete for shape ${config.inputShape}`);
}

// ─── Initialize All Models ──────────────────────────────────
export async function initializeModels(): Promise<void> {
  if (isInitialized) return;

  console.log('[ModelLoader] Initializing all AI models...');
  const startTime = Date.now();

  await Promise.all([
    loadModel('face_detection'),
    loadModel('face_recognition'),
  ]);

  isInitialized = true;
  console.log(
    `[ModelLoader] ✅ All models ready in ${Date.now() - startTime}ms`,
  );
}

// ─── Cleanup ─────────────────────────────────────────────────
export function releaseModel(name: ModelName): void {
  if (modelCache.has(name)) {
    // react-native-fast-tflite handles GC, just remove from cache
    modelCache.delete(name);
    console.log(`[ModelLoader] Released model: ${name}`);
  }
}

export function releaseAllModels(): void {
  modelCache.clear();
  isInitialized = false;
  console.log('[ModelLoader] All models released');
}

export function getModelConfig(name: ModelName): ModelConfig {
  return MODEL_CONFIGS[name];
}

export { MODEL_CONFIGS };
