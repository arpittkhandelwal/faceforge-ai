<div align="center">
  <h1>FaceForge AI</h1>
  <p><strong>Zero-Network Liveness Detection & Offline Facial Authentication</strong></p>
  <p><i>Built for Hackathon 7.0</i></p>

  <img src="https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite%20Web-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Google%20MediaPipe-EA4335?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Offline%20First-10B981?style=for-the-badge&logo=offline&logoColor=white" />
</div>

<br/>

## The Problem
Modern biometric authentication APIs are slow, expensive, and fail when the user loses internet connection. In remote areas, disaster zones, or high-security air-gapped environments, reliance on cloud infrastructure introduces an unacceptable point of failure.

## Our Solution
**FaceForge AI** is a highly optimized, fully self-contained facial authentication system that runs entirely on-device. It requires **zero network connectivity**.

Using **Google MediaPipe's Face Landmarker**, it actively prevents spoofing by demanding multi-step liveness verification (Blinks & Head Turns) while tracking 478 3D facial points in real-time.

## Key Features
- **100% Offline-First:** Stores identities securely on-device using isolated storage mechanisms (AsyncStorage / LocalStorage).
- **True ML Liveness Detection:** Calculates real-time Eye Aspect Ratio (EAR) for blinks and exact Yaw/Pitch ratios for head turns to prevent presentation attacks.
- **Enterprise UX/UI Aesthetic:** A completely overhauled, high-end, glassmorphic UI built to strict professional design standards.
- **Cross-Platform Compatibility:** Includes both a highly optimized **React Native Mobile App** and a performant **React + Vite Web App**.

## Multi-Step Liveness Flow
To prevent static photos or 2D video spoofing, FaceForge requires the user to interact through a predefined sequence:
1. `Center Face` (Ensures bounding box alignment and initial capture)
2. `Blink` (Ensures micro-muscle movement via EAR thresholding)
3. `Turn Left` (Proves 3D depth and captures side profile metrics)
4. `Turn Right` (Verifies opposite hemisphere and concludes verification)

## Tech Stack
- **Web Prototype:** React 18, Vite, `@mediapipe/tasks-vision`, Vanilla CSS
- **Mobile Native:** React Native 0.73, `react-native-svg`, AsyncStorage

## How to Run (Web App)
The web application contains the fully functional MediaPipe WASM integration.
```bash
cd FaceForgeWeb
npm install
npm run dev
```

## How to Run (React Native Mobile)
The mobile codebase contains the identical UI ported to native views with offline state management.
```bash
cd FaceForgeAI
npm install
npx react-native run-android
# or
npx react-native run-ios
```

## Hackathon Architecture Notes
We set out to build an architecture that could eventually synchronize to centralized cloud databases (e.g., AWS, Supabase) but prioritized absolute offline reliability. We successfully integrated WASM-based ML tasks directly into the JS thread without sacrificing UI performance or framerates.

---
*Developed for Hackathon 7.0*
