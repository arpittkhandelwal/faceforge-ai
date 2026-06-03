<div align="center">
  <h1>🛡️ FaceForge AI</h1>
  <p><strong>Zero-Network Liveness Detection & Offline Facial Authentication</strong></p>
  <p><i>Built for Hackathon 7.0</i></p>

  <img src="https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite%20Web-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Google%20MediaPipe-EA4335?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Offline%20First-10B981?style=for-the-badge&logo=offline&logoColor=white" />
</div>

<br/>

## 🚀 The Problem
Modern biometric authentication APIs are slow, expensive, and completely fail when the user loses internet connection. In remote areas, disaster zones, or high-security air-gapped environments, you cannot rely on the cloud.

## 💡 Our Solution
**FaceForge AI** is a highly optimized, fully self-contained facial authentication system that runs entirely on-device. It requires **zero network connectivity**.

Using **Google MediaPipe's Face Landmarker**, it actively prevents spoofing by demanding multi-step liveness verification (Blinks & Head Turns) while tracking 478 3D facial points in real-time.

## ✨ Key Features
- 📵 **100% Offline-First:** Stores identities securely on-device (AsyncStorage / LocalStorage).
- 🧠 **True AI Liveness Detection:** Calculates real-time Eye Aspect Ratio (EAR) for blinks and exact Yaw/Pitch ratios for head turns.
- 🎨 **Premium FaceID Aesthetic:** A completely overhauled, high-end, glassmorphic UI built to impress.
- ⚡ **Cross-Platform:** Includes both a highly optimized **React Native Mobile App** and a blazing-fast **React + Vite Web App**.

## 🎥 Multi-Step Liveness Flow
To prevent static photos or 2D video spoofing, FaceForge requires the user to interact:
1. `Center Face` (Ensures bounding box alignment)
2. `Blink` (Ensures micro-muscle movement)
3. `Turn Left` (Proves 3D depth)
4. `Turn Right` (Verifies opposite hemisphere)

## 🛠 Tech Stack
- **Web Prototype:** React 18, Vite, `@mediapipe/tasks-vision`, Vanilla CSS
- **Mobile Native:** React Native 0.73, `react-native-svg`, AsyncStorage

## 📦 How to Run (Web App)
The web application contains the fully functional MediaPipe WASM integration.
```bash
cd FaceForgeWeb
npm install
npm run dev
```

## 📱 How to Run (React Native Mobile)
The mobile codebase contains the identical UI ported to native views.
```bash
cd FaceForgeAI
npm install
npx react-native run-android
# or
npx react-native run-ios
```

## 🏆 Hackathon Notes
We set out to build an architecture that could eventually sync to AWS/Supabase but prioritized absolute offline reliability. We successfully integrated WASM-based ML tasks directly into the JS thread without sacrificing UI performance.

---
*Developed with ❤️ for Hackathon 7.0*
