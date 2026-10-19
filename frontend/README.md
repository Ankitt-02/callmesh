# CallMesh Frontend

Modern, high-performance WebRTC video calling and real-time collaboration interface built with React 19 and Vite.

## Overview
CallMesh is a peer-to-peer video conferencing web application designed with a dark neon violet/indigo visual identity, responsive navigation, and robust WebRTC mesh connections.

## Features
- **Mesh Video Calling**: Multi-peer mesh connections powered by WebRTC and Socket.IO signaling.
- **Controls & Media Fallbacks**: Microphone mute, camera toggle with custom initial avatar fallback, and screen sharing.
- **In-Call Collaboration**: Real-time side drawer chat with unread message badges and sound notifications.
- **Authentication**: JWT-based authentication supporting both email and username registration/sign-in.
- **Meeting History**: Instant logging and review of past meeting rooms with one-click re-join and code copy.

## Technology Stack
- **Framework**: React 19 + Vite 7
- **Routing**: React Router DOM 7
- **Design System & Components**: Material-UI (MUI v9) + Emotion + Custom CSS
- **Signaling Client**: Socket.IO Client v4
- **Real-Time Engine**: Native WebRTC (`RTCPeerConnection`, Google STUN)

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Development Server
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```
