#!/bin/bash
# ============================================================
# download_models.sh — Download & verify TFLite model files
# 
# Run this ONCE before building the app:
#   chmod +x download_models.sh
#   ./download_models.sh
# ============================================================

set -e

MODELS_DIR="./models"
ANDROID_ASSETS="./android/app/src/main/assets/models"

echo "📥 Downloading TFLite models for Face Auth System..."
mkdir -p "$MODELS_DIR" "$ANDROID_ASSETS"

# ── Model 1: MediaPipe Face Detection (Short-Range) ──────────
# Source: https://storage.googleapis.com/mediapipe-assets/
FACE_DETECTION_URL="https://storage.googleapis.com/mediapipe-assets/face_detection_short_range.tflite"
FACE_DETECTION_FILE="$MODELS_DIR/face_detection_short.tflite"
FACE_DETECTION_SIZE=229000  # ~229KB

if [ ! -f "$FACE_DETECTION_FILE" ]; then
    echo "⬇️  Downloading face_detection_short.tflite (~229KB)..."
    curl -L "$FACE_DETECTION_URL" -o "$FACE_DETECTION_FILE" --progress-bar
    echo "✅ face_detection_short.tflite downloaded"
else
    echo "✓ face_detection_short.tflite already exists"
fi

# ── Model 2: MobileFaceNet (quantized INT8) ──────────────────
# Source: InsightFace / open-source MobileFaceNet INT8 TFLite
# We use a publicly available quantized version under Apache 2.0
FACE_NET_URL="https://github.com/sirius-ai/MobileFaceNet_TF/raw/master/output/MobileFaceNet.tflite"
FACE_NET_FILE="$MODELS_DIR/mobile_face_net.tflite"

if [ ! -f "$FACE_NET_FILE" ]; then
    echo "⬇️  Downloading mobile_face_net.tflite (~4.5MB)..."
    curl -L "$FACE_NET_URL" -o "$FACE_NET_FILE" --progress-bar
    echo "✅ mobile_face_net.tflite downloaded"
else
    echo "✓ mobile_face_net.tflite already exists"
fi

# ── Verify file sizes ────────────────────────────────────────
echo ""
echo "📊 Model sizes:"
ls -lh "$MODELS_DIR"/*.tflite

# ── Copy to Android assets ───────────────────────────────────
echo ""
echo "📋 Copying models to Android assets..."
cp "$MODELS_DIR"/*.tflite "$ANDROID_ASSETS/"
echo "✅ Models copied to $ANDROID_ASSETS"

# ── Copy to iOS bundle (if ios dir exists) ───────────────────
IOS_BUNDLE="./ios/FaceAuthApp"
if [ -d "$IOS_BUNDLE" ]; then
    echo "📋 Copying models to iOS bundle..."
    cp "$MODELS_DIR"/*.tflite "$IOS_BUNDLE/"
    echo "✅ Models copied to $IOS_BUNDLE"
fi

echo ""
echo "✅ All models ready! Total:"
du -sh "$MODELS_DIR"
echo ""
echo "Next steps:"
echo "  1. cd FaceAuthApp"
echo "  2. npm install"
echo "  3. npx react-native run-android"
