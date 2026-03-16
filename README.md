# 🎯 SENTINEL Face Finder — Surveillance Command Center

AI-powered real-time face detection and recognition system built with React, Vite, and [face-api.js](https://github.com/vladmandic/face-api). Runs entirely client-side — no backend required.

![Dark Tactical Surveillance Theme](https://img.shields.io/badge/Theme-Dark%20Tactical-0d0d14?style=flat-square&labelColor=05050a&color=00e5ff)
![React 18](https://img.shields.io/badge/React-18-61dafb?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?style=flat-square)
[![Live Demo](https://img.shields.io/badge/Live_Demo-on_Render-ffcc00?style=for-the-badge&logo=render)](https://intelligent-recognition-identification.onrender.com)

---

## ✨ Features

- **Face Enrollment** — Upload target face images; system extracts 128-float descriptors for matching
- **Live CCTV** — Webcam feed with camera selection, resolution presets, and mirror toggle
- **Drone Feed** — Connect to MJPEG/WebRTC streams or use built-in demo video
- **Recorded Video** — Upload MP4/AVI/MOV/WEBM with full playback controls and frame stepping
- **Real-time Detection** — requestAnimationFrame-based loop with configurable throttling
- **Match Classification** — Confirmed / Likely / Possible / Unknown with Euclidean distance
- **Tactical Canvas Overlays** — Corner-tick bounding boxes, 68-point landmarks, tracking trails
- **Alert Engine** — Web Audio API 3-tone beep, visual banners, per-face cooldown
- **Zone Detection** — Draw restricted/safe/alert/monitor zones on the canvas
- **Snapshot Gallery** — Manual + auto-capture with lightbox viewer and JSZip bulk export
- **Detection Log** — Filterable, sortable log with CSV/JSON export
- **Session Reports** — Stats dashboard with native canvas bar chart timeline
- **Night Mode** — Brightness/contrast enhancement for low-light footage
- **Face Quality Scoring** — Laplacian variance blur detection
- **Keyboard Shortcuts** — 15+ shortcuts for rapid operation
- **Toast Notifications** — Slide-in alerts for matches, errors, and system events

---

## 📋 Prerequisites

- **Node.js** — v18 or higher ([download](https://nodejs.org/))
- **npm** — comes bundled with Node.js
- **Modern browser** — Chrome, Edge, or Firefox (for camera/WebRTC support)

Verify your installation:

```bash
node --version    # should print v18.x.x or higher
npm --version     # should print 9.x.x or higher
```

---

## 🚀 How to Run

### 1. Clone or navigate to the project

```bash
cd "c:\Users\amita\My Project\Projects\face"
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag is needed because `@tailwindcss/vite` has a peer dependency on Vite 5–7, while this project uses Vite 8.

### 3. Start the development server

```bash
npm run dev
```

You'll see output like:

```
VITE v8.0.0  ready in 400 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. Open in browser

Open **http://localhost:5173** (or whatever port Vite shows) in Chrome or Edge.

### 5. Grant camera permission

When you start a live camera feed, the browser will ask for camera access — click **Allow**.

---

## 🏗️ Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder. Serve it with any static file server:

```bash
npm run preview
```

---

## 📁 Project Structure

```
face/
├── index.html                    # Entry HTML with CDN scripts
├── vite.config.js                # Vite + React + Tailwind config
├── package.json
└── src/
    ├── main.jsx                  # React root render
    ├── App.jsx                   # App wrapper
    ├── index.css                 # Tailwind + custom animations
    ├── FaceFinderSystem.jsx      # Main orchestrator (detection loop, state)
    ├── utils/
    │   └── constants.js          # Colors, settings, utilities
    └── components/
        ├── LoadingScreen.jsx     # Model loading with radar animation
        ├── TopBar.jsx            # Stats strip + controls
        ├── LeftPanel.jsx         # Face enrollment + video controls
        ├── RightPanel.jsx        # Detection log with filters
        ├── SettingsModal.jsx     # 5-tab settings panel
        ├── BottomStrip.jsx       # Snapshot gallery + lightbox
        ├── Modals.jsx            # Session report + shortcuts help
        └── ToastSystem.jsx       # Toast notifications
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause (recording mode) |
| `D` | Toggle detection on/off |
| `S` | Take manual snapshot |
| `M` | Toggle audio mute |
| `Z` | Toggle zone drawing mode |
| `N` | Toggle night mode |
| `L` | Toggle face landmarks |
| `T` | Toggle tracking trails |
| `F` | Toggle canvas fullscreen |
| `← →` | Seek ±5 seconds |
| `[ ]` | Adjust playback speed |
| `Escape` | Close any modal |
| `?` | Show shortcuts help |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite 8 | Build tool & dev server |
| Tailwind CSS 4 | Utility-first styling |
| face-api.js | Face detection & recognition (CDN) |
| JSZip | Snapshot bulk export (CDN) |
| lucide-react | Icons |
| Web Audio API | Alert beep sounds |
| Google Fonts | Rajdhani + JetBrains Mono |

---

## 📝 Notes

- **Everything runs client-side** — no backend, no data leaves your browser.
- **Face-api.js models** are loaded from CDN on first launch (~15 MB total). Requires internet on first load.
- **Camera access** requires HTTPS or localhost — the dev server provides localhost automatically.
- **Large video files** (>1 GB) may impact performance — use a lower detection interval in settings.

---

## 📄 License

MIT
