<div align="center">
  <h1>FaceForge AI</h1>
  <p><strong>Zero-Network Liveness Detection & Offline Facial Authentication</strong></p>
  <p><i>Built for Hackathon 7.0</i></p>

  <img src="https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Offline%20First-10B981?style=for-the-badge&logo=offline&logoColor=white" />
</div>

<br/>

## The Problem
Modern biometric authentication APIs are slow, expensive, and fail when the user loses internet connection. In remote areas, disaster zones, or high-security air-gapped environments, reliance on cloud infrastructure introduces an unacceptable point of failure.

## Our Solution
**FaceForge AI** is a highly optimized, fully self-contained facial authentication mobile app that runs entirely on-device. It requires **zero network connectivity**.

## Key Features
- **100% Offline-First:** Stores identities securely on-device using isolated storage mechanisms (AsyncStorage).
- **Enterprise UX/UI Aesthetic:** A completely overhauled, high-end, glassmorphic UI built to strict professional design standards with a custom camera scanner cutout.
- **Liveness Detection:** Integrated native Vision Camera for high-performance real-time face scanning.
- **Cross-Platform Compatibility:** Built on **React Native**, ensuring smooth 60fps performance on Android (and iOS).

## Multi-Step Liveness Flow
To prevent static photos or 2D video spoofing, FaceForge requires the user to interact through a predefined sequence:
1. `Center Face` (Ensures bounding box alignment and initial capture)
2. `Blink` (Ensures micro-muscle movement)
3. `Turn Left` (Proves 3D depth and captures side profile metrics)
4. `Turn Right` (Verifies opposite hemisphere and concludes verification)

## Tech Stack
- **Mobile Framework:** React Native 0.73
- **Camera & Graphics:** `react-native-vision-camera`, `react-native-svg`
- **Local Database:** `@react-native-async-storage/async-storage`

## How to Run
The codebase contains the fully functional native mobile app.
```bash
cd FaceForgeAI
npm install

# Start the Metro Bundler
npm start

# Run on Android
npx react-native run-android
```

## Hackathon Architecture Notes
We prioritized absolute offline reliability. We successfully integrated high-performance native camera feeds directly into the React Native UI thread without sacrificing UI performance, ensuring a buttery smooth enrollment and authentication process without any internet connection.

---
*Developed for Hackathon 7.0*
