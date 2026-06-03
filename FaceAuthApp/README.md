# 🔐 FaceForge AI
## Hackathon 7.0 — NHAI Offline Biometric Security Platform

> A production-ready, fully offline facial recognition and liveness detection mobile application built with React Native. **Secure. Private. Authentic.** Works with zero internet connectivity on mid-range devices.

![Platform](https://img.shields.io/badge/Platform-Android%208%2B%20%7C%20iOS%2012%2B-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.73.6-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)
![Offline](https://img.shields.io/badge/Mode-100%25%20Offline-green)
![Model Size](https://img.shields.io/badge/AI%20Models-%3C5MB-orange)

---

## 🎯 Features

| Feature | Technology | Status |
|---|---|---|
| Real-time Face Detection | TFLite + MediaPipe | ✅ |
| Face Recognition | MobileFaceNet (128-dim) | ✅ |
| Blink Detection | EAR Algorithm | ✅ |
| Head Turn Detection | Yaw Angle Estimation | ✅ |
| Offline Storage | SQLite + AsyncStorage | ✅ |
| Multi-user Support | Cosine Similarity Matching | ✅ |
| GPS Auth Logs | @react-native-community/geolocation | ✅ |
| AWS Sync (optional) | NetInfo + Batch Upload | ✅ |
| Dark/Light Theme | React Context + AsyncStorage | ✅ |
| Haptic Feedback | react-native-haptic-feedback | ✅ |

---

## 📁 Project Structure

```
FaceAuthApp/
├── src/
│   ├── ai/                          # AI/ML Layer
│   │   ├── ModelLoader.ts           # TFLite model management + warm-up
│   │   ├── FaceDetector.ts          # MediaPipe face detection + NMS
│   │   ├── FaceRecognizer.ts        # MobileFaceNet + cosine similarity
│   │   └── LivenessDetector.ts      # EAR blink + head turn state machine
│   ├── storage/                     # Offline Data Layer
│   │   ├── DatabaseManager.ts       # SQLite init + schema
│   │   ├── EmbeddingStore.ts        # User embeddings CRUD
│   │   ├── LogStore.ts              # Auth log storage
│   │   └── SyncQueue.ts             # AWS sync with NetInfo
│   ├── services/                    # Business Logic
│   │   ├── AuthService.ts           # Full auth pipeline orchestrator
│   │   └── RegistrationService.ts  # Face registration + duplicate check
│   ├── screens/                     # All 6+ Screens
│   │   ├── SplashScreen.tsx         # Animated boot sequence
│   │   ├── HomeScreen.tsx           # Main hub + stats
│   │   ├── CameraScreen.tsx         # Live face scan + HUD
│   │   ├── ResultScreen.tsx         # Auth result + animations
│   │   ├── LogsScreen.tsx           # Auth history + sync
│   │   ├── SettingsScreen.tsx       # Config + theme + users
│   │   └── RegisterScreen.tsx       # Face registration flow
│   ├── components/
│   │   ├── animations/
│   │   │   ├── PulseRing.tsx        # Animated pulse rings
│   │   │   └── ScanLine.tsx         # Iron Man HUD scan sweep
│   │   ├── camera/
│   │   │   ├── HUDOverlay.tsx       # SVG grid + face box + corners
│   │   │   └── LivenessStepIndicator.tsx
│   │   └── common/
│   │       ├── GlassCard.tsx        # Glassmorphism card
│   │       ├── NeonButton.tsx       # Animated neon button
│   │       └── StatusBadge.tsx      # Sync/result badges
│   ├── navigation/
│   │   └── AppNavigator.tsx         # React Navigation v6
│   ├── theme/
│   │   ├── index.ts                 # Design tokens (colors, typography, spacing)
│   │   └── ThemeContext.tsx         # Dark/light theme provider
│   └── types/
│       └── index.ts                 # All TypeScript interfaces
├── models/                          # TFLite model files (download separately)
│   ├── face_detection_short.tflite  # MediaPipe ~229KB
│   └── mobile_face_net.tflite       # MobileFaceNet ~4.5MB
├── App.tsx                          # Root entry point
├── package.json
├── tsconfig.json
├── babel.config.js
├── download_models.sh               # Model download script
└── android/
    └── app/src/main/AndroidManifest.xml
```

---

## 🚀 Setup Guide

### Prerequisites

- Node.js 18+
- JDK 17 (for Android)
- Android Studio + SDK (API 26+)
- Xcode 14+ (for iOS, macOS only)
- React Native CLI: `npm install -g react-native-cli`

### Step 1: Clone & Install

```bash
cd FaceAuthApp
npm install
```

### Step 2: Download AI Models

```bash
chmod +x download_models.sh
./download_models.sh
```

This downloads:
- `face_detection_short.tflite` (~229KB) — MediaPipe Face Detection
- `mobile_face_net.tflite` (~4.5MB) — MobileFaceNet quantized INT8

### Step 3: Android Setup

```bash
# Link native modules
npx react-native link

# Run on Android emulator or device
npx react-native run-android
```

**Important Android settings:**
- Enable Developer Options on device
- Enable USB Debugging
- Minimum SDK: API 26 (Android 8.0)

### Step 4: iOS Setup (macOS only)

```bash
cd ios
bundle install
bundle exec pod install
cd ..
npx react-native run-ios
```

---

## 📱 AI Pipeline

### Face Detection
```
Camera Frame (30fps)
    → Frame skip (every 3rd = ~10fps effective)
    → Resize 128×128 + normalize [-1, 1]
    → TFLite inference (MediaPipe Short-Range)
    → Decode SSD anchors + Non-Maximum Suppression
    → Output: BoundingBox + 6 landmarks + confidence
    → Estimate yaw/pitch/roll from landmark geometry
```

### Liveness Detection
```
State Machine: IDLE → BLINK_CHECK → HEAD_TURN → PASSED/FAILED

Blink (EAR Algorithm):
  EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
  Threshold: EAR < 0.25 for ≥2 consecutive frames

Head Turn:
  Yaw angle from eye landmark geometry
  Threshold: |yaw| > 20°
  Direction: random (left or right) per session

Timeout: 10 seconds per step
```

### Face Recognition
```
Face crop (112×112×3)
    → Normalize [-1, 1]
    → MobileFaceNet inference
    → 128-dimensional embedding
    → L2 normalize
    → Cosine similarity vs. all stored embeddings
    → Match if similarity > 0.7 (configurable)
```

---

## ⚡ Performance Notes

| Metric | Target | Technique |
|---|---|---|
| Frame Rate | 10fps effective | Skip every 2 frames |
| Detection Latency | <100ms | NNAPI delegate (Android) |
| Recognition Time | <1 second total | Pre-extract during liveness |
| Model Load Time | <3s cold | Warm-up inference on boot |
| Model RAM | <150MB | Quantized INT8 models |
| App Cold Start | <3s | Async model init |

### Low Light Optimization
- Increase input normalization range for underexposed frames
- Lower confidence threshold in dark conditions (0.5 → 0.4)
- Recommend user to improve lighting via instruction text

### Harsh Sunlight
- Histogram equalization preprocessing (add to `preprocessFrame`)
- Reduce contrast sensitivity in EAR calculation

---

## 🔒 Security Architecture

```
User Embeddings:
  ├── Stored in SQLite (encrypted at rest)
  ├── 128-dim Float32 vectors → Base64 encoded
  └── Soft-delete on user removal

Auth Logs:
  ├── Timestamped + device ID tagged
  ├── GPS coordinates (optional, configurable)
  ├── Sync-pending flag for AWS upload
  └── Purged after confirmed cloud sync

Anti-Spoofing:
  ├── Multi-step liveness (cannot be spoofed with photo)
  ├── Random head turn direction per session
  └── 10-second timeout per step prevents replay attacks
```

---

## ☁️ AWS Sync Architecture

The app operates 100% offline by default. When internet is available:

1. **NetInfo** detects connectivity
2. Pending logs are batched (20 at a time)
3. `POST /api/auth-logs/batch` with device ID header
4. On success: mark synced → purge from local DB
5. On failure: retry with exponential backoff (max 5 min)

Configure AWS endpoint in **Settings → Cloud Sync**.

---

## 🎨 UI Design System

**Color Philosophy:** Deep Navy + Cyan Neon (dark) / Clean White + Ocean Blue (light)

| Token | Dark | Light |
|---|---|---|
| Background | `#050A18` | `#F0F4F8` |
| Accent | `#00F5FF` | `#0284C7` |
| Success | `#00FF88` | `#059669` |
| Error | `#FF3366` | `#DC2626` |

**Animations powered by:** `react-native-reanimated` v3
- Spring physics for button press
- `withRepeat` for pulse rings and scan line
- `FadeInDown` entering animations
- Worklet-safe state transitions

---

## 🧪 Testing

```bash
# TypeScript type check
npm run typecheck

# Lint
npm run lint

# Unit tests
npm test
```

---

## 📜 License

MIT License — Free for use, modification, and distribution.
Built for NHAI Hackathon 7.0.

---

## 🤝 Credits

- [MediaPipe](https://github.com/google/mediapipe) — Face Detection model
- [MobileFaceNet](https://github.com/sirius-ai/MobileFaceNet_TF) — Face Recognition model  
- [react-native-fast-tflite](https://github.com/mrousavy/react-native-fast-tflite) — Native TFLite inference
- [react-native-vision-camera](https://github.com/mrousavy/react-native-vision-camera) — Camera + Frame Processors
