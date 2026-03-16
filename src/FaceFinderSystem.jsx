import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Camera, Video, Film, Radio, Moon, Crosshair, Map as MapIcon, Database, Play } from 'lucide-react';
import { MODEL_URL, DEMO_VIDEO, DEFAULT_SETTINGS, ZONE_TYPES, formatTime, getMatchClass, euclidean } from './utils/constants.js';
import { preprocessForDetection, multiPassDetect, enhancedMatch, upscaleFaceRegion, tiledMultiPassDetect } from './utils/imageProcessing.js';
import LoadingScreen from './components/LoadingScreen.jsx';
import ToastContainer, { useToast } from './components/ToastSystem.jsx';
import TopBar from './components/TopBar.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import RightPanel from './components/RightPanel.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import BottomStrip from './components/BottomStrip.jsx';
import { SessionModal, ShortcutsModal } from './components/Modals.jsx';

export default function FaceFinderSystem() {
  // Surveillance System v2.0 - Core Intelligence Layer
  /* ── REFS ── */
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const offscreenRef = useRef(null);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const alertCooldownRef = useRef(new Map());
  const lastDetectTimeRef = useRef(0);
  const fpsTimesRef = useRef([]);
  const latestDetectionsRef = useRef([]);
  const activeTracksRef = useRef(new Map());
  const trackIdCounter = useRef(1);
  const modelsLoadedRef = useRef(false);
  const detectingRef = useRef(false);
  const sessionStartRef = useRef(Date.now());
  const framesRef = useRef(0);
  const emptyFrameCountRef = useRef(0);
  const lastStatePushRef = useRef(0);
  const timelineRef = useRef([]);
  const timelineMinuteRef = useRef(0);
  const streamRef = useRef(null);
  const matchBannerTimeoutRef = useRef(null);
  const videoFileRef = useRef(null);

  /* ── STATE ── */
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelStatus, setModelStatus] = useState(['loading','loading','loading','loading']);
  const [loadingTime, setLoadingTime] = useState(0);
  const [loadingFadeOut, setLoadingFadeOut] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [enrolledFaces, setEnrolledFaces] = useState([]);
  const [detectionLog, setDetectionLog] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [sourceMode, setSourceMode] = useState('cctv');
  const [isPlaying, setIsPlaying] = useState(false);
  const [detectionEnabled, setDetectionEnabled] = useState(true);
  const [audioMuted, setAudioMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSession, setShowSession] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [viewingSnapshot, setViewingSnapshot] = useState(null);
  const [logFilter, setLogFilter] = useState('ALL');
  const [logSort, setLogSort] = useState('NEWEST');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [resolution, setResolution] = useState('720');
  const [droneUrl, setDroneUrl] = useState('');
  const [droneStatus, setDroneStatus] = useState('DISCONNECTED');
  const [zoneMode, setZoneMode] = useState(false);
  const [zones, setZones] = useState([]);
  const [zoneDrawing, setZoneDrawing] = useState(null);
  const [zoneConfig, setZoneConfig] = useState(null);
  const [mirrorMode, setMirrorMode] = useState(false);
  const [matchBanner, setMatchBanner] = useState(null);
  const [canvasGlow, setCanvasGlow] = useState(false);
  const [videoFileName, setVideoFileName] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoVolume, setVideoVolume] = useState(1);
  const [videoMuted, setVideoMuted] = useState(false);
  const [detectionInterval, setDetectionInterval] = useState(250);
  const [stats, setStats] = useState({ fps: 0, faces: 0, matches: 0, alerts: 0, enrolled: 0, msPerFrame: 0, matchPulse: false, alertPulse: false });
  const lowPerfWarnedRef = useRef(false);
  const [emptyFrameHinted, setEmptyFrameHinted] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  /* ── MODEL LOADING ── */
  const loadModels = useCallback(async () => {
    const faceapi = window.faceapi;
    if (!faceapi) { addToast('error', 'Load Error', 'face-api.js not found on page'); return; }
    setModelsLoading(true);
    setModelStatus(['loading','loading','loading','loading']);
    const startTime = Date.now();
    const timer = setInterval(() => setLoadingTime((Date.now() - startTime) / 1000), 100);
    const loaders = [
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    ];
    const results = await Promise.allSettled(loaders);
    clearInterval(timer);
    setLoadingTime((Date.now() - startTime) / 1000);
    const statuses = results.map(r => r.status === 'fulfilled' ? 'loaded' : 'error');
    setModelStatus(statuses);
    if (statuses.every(s => s === 'loaded')) {
      modelsLoadedRef.current = true;
      setTimeout(() => { setLoadingFadeOut(true); setTimeout(() => setModelsLoading(false), 800); }, 600);
    }
  }, [addToast]);

  useEffect(() => { loadModels(); }, [loadModels]);

  /* ── CAMERA ENUMERATION ── */
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0) setSelectedCamera(videoDevices[0].deviceId);
    }).catch(() => {});
  }, []);

  /* ── FACE ENROLLMENT ── */
  const handleEnroll = useCallback(async (dataURL, errorCb) => {
    if (enrolledFaces.length >= 20) { errorCb('Maximum 20 faces allowed'); return; }
    const faceapi = window.faceapi;
    if (!faceapi || !modelsLoadedRef.current) { errorCb('Models not loaded yet'); return; }
    const img = new Image();
    img.src = dataURL;
    await new Promise(res => { img.onload = res; });
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const enrollCtx = canvas.getContext('2d', { willReadFrequently: true });
    enrollCtx.drawImage(img, 0, 0);
    // Preprocess enrollment image for better descriptor extraction from old/low-quality photos
    preprocessForDetection(canvas, { lowQuality: true, nightMode: false });
    // Multi-pass detection on enrollment image to catch partial faces
    const detections = await multiPassDetect(canvas, faceapi, { detector: 'tiny', inputSize: 416, scoreThreshold: 0.3 });
    if (!detections || detections.length === 0) { errorCb('No face detected — try a clearer image'); return; }
    if (detections.length > 1) { addToast('warning', 'Multiple Faces', 'Using the largest face detected'); }
    const best = detections.reduce((a, b) => (a.detection.box.area > b.detection.box.area ? a : b));
    const box = best.detection.box;
    const pad = 0.2;
    const cx = Math.max(0, Math.floor(box.x - box.width * pad));
    const cy = Math.max(0, Math.floor(box.y - box.height * pad));
    const cw = Math.min(img.width - cx, Math.floor(box.width * (1 + 2 * pad)));
    const ch = Math.min(img.height - cy, Math.floor(box.height * (1 + 2 * pad)));
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cw; cropCanvas.height = ch;
    cropCanvas.getContext('2d').drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);
    const thumbnail = cropCanvas.toDataURL('image/jpeg', 0.8);
    const face = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: `Face ${enrolledFaces.length + 1}`,
      descriptor: Array.from(best.descriptor),
      thumbnail, enrolledAt: Date.now(), matchCount: 0, lastSeen: null,
      confidence: best.detection.score, avgConfidence: 0,
    };
    setEnrolledFaces(prev => [...prev, face]);
    addToast('success', 'Face Enrolled', `${face.name} added to target database`);
  }, [enrolledFaces.length, addToast]);

  /* ── CAMERA CONTROL ── */
  const startCamera = useCallback(async () => {
    const resMap = { '480': { width: 640, height: 480 }, '720': { width: 1280, height: 720 }, '1080': { width: 1920, height: 1080 } };
    const constraints = { video: { deviceId: selectedCamera ? { exact: selectedCamera } : undefined, ...resMap[resolution] }, audio: false };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      streamRef.current = stream; setIsPlaying(true);
      addToast('success', 'Camera Active', 'Live feed connected');
    } catch (err) {
      addToast('error', 'Camera Error', err.message || 'Permission denied');
    }
  }, [selectedCamera, resolution, addToast]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) { videoRef.current.srcObject = null; }
    setIsPlaying(false);
    latestDetectionsRef.current = [];
  }, []);

  /* ── DRONE CONNECT ── */
  const connectDrone = useCallback(() => {
    const url = droneUrl || DEMO_VIDEO;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.crossOrigin = 'anonymous';
      videoRef.current.play().then(() => { setDroneStatus('CONNECTED'); setIsPlaying(true); })
        .catch(() => setDroneStatus('ERROR'));
      setDroneStatus('CONNECTING');
    }
  }, [droneUrl]);

  const disconnectDrone = useCallback(() => {
    if (videoRef.current) { videoRef.current.src = ''; videoRef.current.srcObject = null; }
    setDroneStatus('DISCONNECTED'); setIsPlaying(false);
  }, []);

  /* ── RECORDED VIDEO ── */
  const handleVideoUpload = useCallback((e, isDemo = false) => {
    let file, url, name;
    if (isDemo) {
      url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
      name = "DEMO_ARCHIVE_SIGNAL.mp4";
    } else {
      file = e.target.files?.[0];
      if (!file) return;
      name = file.name;
      url = URL.createObjectURL(file);
    }

    setVideoFileName(name);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.load(); // Force re-initialization
      videoRef.current.onloadedmetadata = () => {
        setVideoDuration(videoRef.current.duration);
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }
  }, []);

  /* ── ALERT SOUND ── */
  const playAlertSound = useCallback((volume) => {
    if (audioMuted || !settings.audioAlerts) return;
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtxRef.current;
    const vol = (volume || settings.alertVolume) / 100;
    const tones = [[880, 0.08, 0.3, 0], [1100, 0.08, 0.4, 0.05], [1320, 0.12, 0.5, 0.1]];
    tones.forEach(([freq, dur, gain, delay]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + delay);
      g.gain.linearRampToValueAtTime(gain * vol, ctx.currentTime + delay + 0.01);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + dur);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur);
    });
  }, [audioMuted, settings.audioAlerts, settings.alertVolume]);

  /* ── SNAPSHOT ── */
  const captureSnapshot = useCallback((matchedName, confidence, source) => {
    if (!canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL(settings.snapshotFormat === 'jpeg' ? 'image/jpeg' : 'image/png', settings.jpegQuality / 100);
    const snap = { id: Date.now(), dataURL, timestamp: Date.now(), source: source || sourceMode, matchedName: matchedName || null, confidence: confidence || null };
    setSnapshots(prev => prev.length >= 100 ? [...prev.slice(-99), snap] : [...prev, snap]);
  }, [sourceMode, settings.snapshotFormat, settings.jpegQuality]);

  /* ── DETECTION LOOP ── */
  const detectionLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video) { rafRef.current = requestAnimationFrame(detectionLoop); return; }
    const ctx = canvas.getContext('2d');
    const faceapi = window.faceapi;
    const now = performance.now();

    // Draw video frame
    if (video.readyState >= 2) {
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      if (canvas.width !== vw) canvas.width = vw;
      if (canvas.height !== vh) canvas.height = vh;
      ctx.save();
      if (mirrorMode && sourceMode === 'cctv') { ctx.scale(-1, 1); ctx.translate(-canvas.width, 0); }
      if (settings.nightMode) ctx.filter = 'brightness(1.4) contrast(1.2) saturate(0.75)';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      if (sourceMode === 'recording') setCurrentTime(video.currentTime);
    }

    // FPS tracking
    fpsTimesRef.current.push(now);
    if (fpsTimesRef.current.length > 60) fpsTimesRef.current.shift();
    const fps = fpsTimesRef.current.length > 1 ? (fpsTimesRef.current.length - 1) * 1000 / (now - fpsTimesRef.current[0]) : 0;

    // Low performance warning
    if (fps > 0 && fps < 8 && !lowPerfWarnedRef.current) {
      lowPerfWarnedRef.current = true;
      addToast('warning', 'Low Performance', 'Try Performance mode in settings');
    }

    // Detection gate
    const interval = settings.detectionInterval || 250;
    const isRecordingPaused = sourceMode === 'recording' && video.paused;
    const shouldDetect = modelsLoadedRef.current && detectionEnabled && video.readyState >= 2 && 
                        !detectingRef.current && !isRecordingPaused && 
                        (now - lastDetectTimeRef.current > interval);

    if (shouldDetect && faceapi) {
      detectingRef.current = true;
      lastDetectTimeRef.current = now;

      // Use offscreen canvas for detection
      if (!offscreenRef.current) { offscreenRef.current = document.createElement('canvas'); }
      const oc = offscreenRef.current;
      oc.width = canvas.width; oc.height = canvas.height;
      const octx = oc.getContext('2d', { willReadFrequently: true });
      octx.drawImage(video, 0, 0, oc.width, oc.height);

      // Advanced preprocessing: auto-detects dark/noisy images and enhances
      preprocessForDetection(oc, {
        nightMode: settings.nightMode,
        lowQuality: oc.width < 640 || settings.performanceMode === 'performance',
      });

      // ── DETECTION ──
      const detectPromise = settings.crowdMode
        ? tiledMultiPassDetect(oc, faceapi, settings)
        : multiPassDetect(oc, faceapi, settings);

      detectPromise
        .then(async detections => {
          const detectMs = Math.round(performance.now() - now);
          framesRef.current++;
          const resized = faceapi.resizeResults(detections, { width: canvas.width, height: canvas.height });
          const results = [];

          // Process each detection (Recursive Recognition Phase)
          for (let idx = 0; idx < resized.length; idx++) {
            let det = resized[idx];
            const box = det.detection.box;
            if (box.width < settings.minFaceSize || box.height < settings.minFaceSize) continue;

            let bestMatch = null, bestDist = Infinity, bestName = null, bestCosine = 0;
            
            // Internal matching helper
            const runMatching = (desc) => {
              let m = null, d = Infinity, n = null, cos = 0;
              enrolledFaces.forEach(ef => {
                const { combinedDist, cosineSim } = enhancedMatch(desc, ef.descriptor);
                if (combinedDist < d) { d = combinedDist; m = ef; n = ef.name; cos = cosineSim; }
              });
              return { m, d, n, cos };
            };

            // First matching attempt
            let match = runMatching(det.descriptor);
            let confidence = Math.round(Math.max((1 - match.d) * 100, match.cos * 100));

            // Recursive Pass: If confidence is low or unknown, enhance and re-extract
            if (confidence < 75 && enrolledFaces.length > 0) {
              try {
                // Upscale and enhance specific face patch
                const patchCanvas = upscaleFaceRegion(oc, box, 224);
                preprocessForDetection(patchCanvas, { lowQuality: true, forceNoise: true });
                
                const refinedDet = await faceapi.detectSingleFace(patchCanvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.1 }))
                  .withFaceLandmarks()
                  .withFaceDescriptor();

                if (refinedDet) {
                  const refinedMatch = runMatching(refinedDet.descriptor);
                  const refinedConf = Math.round(Math.max((1 - refinedMatch.d) * 100, refinedMatch.cos * 100));
                  
                  // Use refined match if it's significantly better or confirms the identity
                  if (refinedConf > confidence || refinedMatch.m?.id === match.m?.id) {
                    match = refinedMatch;
                    confidence = refinedConf;
                    det = { ...det, descriptor: refinedDet.descriptor, landmarks: refinedDet.landmarks };
                  }
                }
              } catch (e) {
                // Recursive pass failed, fallback to original
              }
            }

            bestMatch = match.m; bestDist = match.d; bestName = match.n; bestCosine = match.cos;

            const faceArea = box.width * box.height;
            const isSmallFace = faceArea < 8000;
            const adaptiveThreshold = isSmallFace ? settings.matchThreshold + 0.08 : settings.matchThreshold;
            const adaptiveLikely = isSmallFace ? settings.likelyThreshold + 0.08 : settings.likelyThreshold;

            const cls = getMatchClass(bestDist, adaptiveThreshold, adaptiveLikely);
            const isMatch = bestDist < adaptiveThreshold && bestMatch;

            results.push({ box, landmarks: det.landmarks, classification: cls.label, color: cls.color,
              matchedName: isMatch ? bestName : null, confidence, distance: bestDist, faceIdx: idx,
              matchedId: isMatch ? bestMatch.id : null, score: det.detection.score });

            // Handle match alerts
            if (isMatch && bestMatch) {
              const cooldownKey = bestMatch.id;
              const lastAlert = alertCooldownRef.current.get(cooldownKey) || 0;
              if (settings.alertCooldown === 0 || now - lastAlert > settings.alertCooldown) {
                alertCooldownRef.current.set(cooldownKey, now);
                playAlertSound();
                if (settings.visualAlerts) {
                  setMatchBanner({ name: bestName, confidence, source: sourceMode });
                  clearTimeout(matchBannerTimeoutRef.current);
                  matchBannerTimeoutRef.current = setTimeout(() => setMatchBanner(null), 4000);
                  setCanvasGlow(true);
                  setTimeout(() => setCanvasGlow(false), 2000);
                }
                if (settings.autoSnapshotOnMatch) captureSnapshot(bestName, confidence, sourceMode);
                if (settings.autoPauseOnMatch && sourceMode === 'recording' && videoRef.current) videoRef.current.pause();

                setEnrolledFaces(prev => prev.map(f => f.id === bestMatch.id ? {
                  ...f, matchCount: f.matchCount + 1, lastSeen: Date.now(),
                  avgConfidence: f.matchCount > 0 ? ((f.avgConfidence * f.matchCount + confidence) / (f.matchCount + 1)) : confidence
                } : f));
              }
            }
          }

          latestDetectionsRef.current = results;
          emptyFrameCountRef.current = results.length === 0 ? emptyFrameCountRef.current + 1 : 0;
          if (emptyFrameCountRef.current > 10 && !emptyFrameHinted && detectionEnabled) {
            setEmptyFrameHinted(true);
            addToast('info', 'No Faces Detected', 'Try adjusting the confidence threshold in settings');
          }

          // Push to state periodically
          if (now - lastStatePushRef.current > 150) {
            lastStatePushRef.current = now;
            // Add log entries
            results.forEach(r => {
              let thumbnail = null;
              try {
                const tc = document.createElement('canvas');
                tc.width = 40; tc.height = 40;
                tc.getContext('2d').drawImage(canvas, r.box.x, r.box.y, r.box.width, r.box.height, 0, 0, 40, 40);
                thumbnail = tc.toDataURL('image/jpeg', 0.6);
              } catch(e) {}
              setDetectionLog(prev => {
                const entry = { id: Date.now() + Math.random(), timestamp: Date.now() - sessionStartRef.current,
                  classification: r.classification, source: sourceMode, matchedName: r.matchedName,
                  confidence: r.confidence, distance: r.distance, thumbnail, isAlert: r.classification === 'MATCH',
                  zone: null };
                const next = [entry, ...prev];
                return next.length > 500 ? next.slice(0, 500) : next;
              });
            });

            setStats({
              fps: Math.round(fps * 10) / 10, faces: results.length,
              matches: results.filter(r => r.classification === 'MATCH').length,
              alerts: results.filter(r => r.isAlert).length, enrolled: enrolledFaces.length,
              msPerFrame: detectMs, matchPulse: results.some(r => r.classification === 'MATCH'),
              alertPulse: results.some(r => r.isAlert),
            });
          }

          // Timeline tracking
          const elapsedMin = Math.floor((Date.now() - sessionStartRef.current) / 60000);
          if (elapsedMin > timelineMinuteRef.current) {
            timelineRef.current.push({ matches: results.filter(r => r.classification === 'MATCH').length, unknowns: results.filter(r => r.classification === 'UNKNOWN').length });
            timelineMinuteRef.current = elapsedMin;
          }

          detectingRef.current = false;
        })
        .catch(() => { detectingRef.current = false; });
    }

    // Draw overlays from latest results
    const dets = latestDetectionsRef.current;
    if (dets.length > 0 && canvas.width > 0) {
      const ctx2 = canvas.getContext('2d');

      // Draw zones
      zones.forEach(z => {
        const zt = ZONE_TYPES[z.type];
        ctx2.save();
        ctx2.setLineDash([8, 4]);
        ctx2.strokeStyle = zt.border;
        ctx2.lineWidth = 1.5;
        ctx2.fillStyle = zt.fill;
        ctx2.fillRect(z.x, z.y, z.w, z.h);
        ctx2.strokeRect(z.x, z.y, z.w, z.h);
        ctx2.setLineDash([]);
        ctx2.fillStyle = zt.color;
        ctx2.font = '11px Rajdhani';
        ctx2.fillText(z.name, z.x + 4, z.y + 14);
        ctx2.restore();
      });

      dets.forEach((det, i) => {
        const { box, color, classification, matchedName, confidence, distance, landmarks, faceIdx } = det;
        const x = box.x, y = box.y, w = box.width, h = box.height;
        const lw = settings.boxThickness;

        if (settings.showBoxes) {
          ctx2.strokeStyle = color;
          ctx2.lineWidth = lw;
          if (settings.boxStyle === 'corners') {
            const L = 12;
            ctx2.beginPath();
            ctx2.moveTo(x, y + L); ctx2.lineTo(x, y); ctx2.lineTo(x + L, y);
            ctx2.moveTo(x + w - L, y); ctx2.lineTo(x + w, y); ctx2.lineTo(x + w, y + L);
            ctx2.moveTo(x + w, y + h - L); ctx2.lineTo(x + w, y + h); ctx2.lineTo(x + w - L, y + h);
            ctx2.moveTo(x + L, y + h); ctx2.lineTo(x, y + h); ctx2.lineTo(x, y + h - L);
            ctx2.stroke();
          } else if (settings.boxStyle === 'dashed') {
            ctx2.setLineDash([6, 4]);
            ctx2.strokeRect(x, y, w, h);
            ctx2.setLineDash([]);
          } else {
            ctx2.strokeRect(x, y, w, h);
          }
        }

        if (settings.showFaceIds) {
          ctx2.fillStyle = color; ctx2.font = '10px JetBrains Mono';
          ctx2.fillText(`#${faceIdx + 1}`, x + 2, y - 4);
        }
        if (matchedName) {
          ctx2.fillStyle = '#00ff88'; ctx2.font = 'bold 13px Rajdhani';
          ctx2.fillText(matchedName, x, y + h + 16);
        }
        if (settings.showConfidence) {
          ctx2.fillStyle = color; ctx2.font = '10px JetBrains Mono';
          ctx2.fillText(`${confidence}%`, x + w - 32, y + h + 14);
        }
        if (settings.showDistance) {
          ctx2.fillStyle = '#4a5068'; ctx2.font = '9px JetBrains Mono';
          ctx2.fillText(`d:${distance.toFixed(3)}`, x, y + h + 28);
        }
        if (settings.showLandmarks && landmarks) {
          const pts = landmarks.positions;
          ctx2.fillStyle = '#00e5ff';
          pts.forEach(pt => { ctx2.beginPath(); ctx2.arc(pt.x, pt.y, settings.landmarkSize, 0, Math.PI * 2); ctx2.fill(); });
        }

        // Face tracking trails
        if (settings.showTrails) {
          const cx = x + w / 2, cy2 = y + h / 2;
          let assigned = false;
          activeTracksRef.current.forEach((track, tid) => {
            if (!assigned) {
              const dx = track.centroids[track.centroids.length-1].x - cx;
              const dy = track.centroids[track.centroids.length-1].y - cy2;
              if (Math.sqrt(dx*dx+dy*dy) < 80) {
                track.centroids.push({ x: cx, y: cy2 });
                if (track.centroids.length > 10) track.centroids.shift();
                track.lastSeen = Date.now();
                assigned = true;
              }
            }
          });
          if (!assigned) {
            activeTracksRef.current.set(trackIdCounter.current++, { centroids: [{ x: cx, y: cy2 }], lastSeen: Date.now() });
          }
        }
      });

      // Draw trails
      if (settings.showTrails) {
        const now2 = Date.now();
        activeTracksRef.current.forEach((track, tid) => {
          if (now2 - track.lastSeen > 1500) { activeTracksRef.current.delete(tid); return; }
          const pts = track.centroids;
          if (pts.length < 2) return;
          ctx2.save();
          for (let j = 0; j < pts.length; j++) {
            const opacity = (j + 1) / pts.length;
            const radius = 1 + (j / pts.length) * 2;
            ctx2.fillStyle = `rgba(0,229,255,${opacity})`;
            ctx2.beginPath();
            ctx2.arc(pts[j].x, pts[j].y, radius, 0, Math.PI * 2);
            ctx2.fill();
          }
          ctx2.strokeStyle = 'rgba(0,229,255,0.3)';
          ctx2.lineWidth = 1;
          ctx2.beginPath();
          pts.forEach((p, j) => { j === 0 ? ctx2.moveTo(p.x, p.y) : ctx2.lineTo(p.x, p.y); });
          ctx2.stroke();
          ctx2.restore();
        });
      }

      // Scanlines on canvas
      if (settings.showScanlines) {
        ctx2.fillStyle = 'rgba(0,0,0,0.08)';
        for (let sy = 0; sy < canvas.height; sy += 3) {
          ctx2.fillRect(0, sy, canvas.width, 1);
        }
      }
    }

    rafRef.current = requestAnimationFrame(detectionLoop);
  }, [settings, enrolledFaces, detectionEnabled, sourceMode, mirrorMode, zones, captureSnapshot, playAlertSound, addToast, emptyFrameHinted]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(detectionLoop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [detectionLoop]);

  /* ── ZONE DRAWING ── */
  const handleCanvasMouseDown = useCallback((e) => {
    if (!zoneMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    setZoneDrawing({ startX: (e.clientX - rect.left) * scaleX, startY: (e.clientY - rect.top) * scaleY, endX: (e.clientX - rect.left) * scaleX, endY: (e.clientY - rect.top) * scaleY });
  }, [zoneMode]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (!zoneDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    setZoneDrawing(prev => ({ ...prev, endX: (e.clientX - rect.left) * scaleX, endY: (e.clientY - rect.top) * scaleY }));
  }, [zoneDrawing]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!zoneDrawing) return;
    const x = Math.min(zoneDrawing.startX, zoneDrawing.endX);
    const y = Math.min(zoneDrawing.startY, zoneDrawing.endY);
    const w = Math.abs(zoneDrawing.endX - zoneDrawing.startX);
    const h = Math.abs(zoneDrawing.endY - zoneDrawing.startY);
    if (w > 20 && h > 20) {
      setZoneConfig({ x, y, w, h });
    }
    setZoneDrawing(null);
  }, [zoneDrawing]);

  const saveZone = useCallback((name, type) => {
    if (!zoneConfig) return;
    setZones(prev => [...prev, { id: Date.now(), name, type, ...zoneConfig }]);
    setZoneConfig(null);
    addToast('success', 'Zone Created', `${name} (${type}) added`);
  }, [zoneConfig, addToast]);

  /* ── KEYBOARD SHORTCUTS ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case ' ': 
          e.preventDefault(); 
          if (sourceMode === 'recording' && videoRef.current) {
            const video = videoRef.current;
            if (video.paused) { video.play(); setIsPlaying(true); } 
            else { video.pause(); setIsPlaying(false); }
          } else {
            setDetectionEnabled(p => !p);
            addToast('info', 'Neural Engine', `Detection ${!detectionEnabled ? 'ACTIVATED' : 'DEACTIVATED'}`);
          }
          break;
        case 'd': case 'D': setDetectionEnabled(p => !p); break;
        case 'c': case 'C': setSettings(p => ({ ...p, crowdMode: !p.crowdMode })); addToast('info', 'Detection Protocol', `Crowd Mode ${!settings.crowdMode ? 'ENABLED' : 'DISABLED'}`); break;
        case 's': case 'S': captureSnapshot(null, null, sourceMode); break;
        case 'm': case 'M': setAudioMuted(p => !p); break;
        case 'z': case 'Z': setZoneMode(p => !p); break;
        case 'n': case 'N': setSettings(p => ({ ...p, nightMode: !p.nightMode })); break;
        case 'l': case 'L': setSettings(p => ({ ...p, showLandmarks: !p.showLandmarks })); break;
        case 't': case 'T': setSettings(p => ({ ...p, showTrails: !p.showTrails })); break;
        case 'Escape': setShowSettings(false); setShowSession(false); setShowShortcuts(false); setViewingSnapshot(null); break;
        case 'ArrowLeft': if (sourceMode === 'recording' && videoRef.current) videoRef.current.currentTime -= 5; break;
        case 'ArrowRight': if (sourceMode === 'recording' && videoRef.current) videoRef.current.currentTime += 5; break;
        case '[': if (videoRef.current) { const s = [0.25,0.5,1,1.5,2,4]; const i = s.indexOf(playbackSpeed); if (i > 0) { setPlaybackSpeed(s[i-1]); videoRef.current.playbackRate = s[i-1]; } } break;
        case ']': if (videoRef.current) { const s = [0.25,0.5,1,1.5,2,4]; const i = s.indexOf(playbackSpeed); if (i < s.length-1) { setPlaybackSpeed(s[i+1]); videoRef.current.playbackRate = s[i+1]; } } break;
        case 'f': case 'F': canvasRef.current?.requestFullscreen?.(); break;
        case '?': setShowShortcuts(p => !p); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sourceMode, playbackSpeed, captureSnapshot]);

  /* ── EXPORT FUNCTIONS ── */
  const exportCSV = useCallback(() => {
    const header = 'Timestamp,Classification,Source,Name,Confidence,Distance\n';
    const rows = detectionLog.map(e => `${formatTime(e.timestamp)},${e.classification},${e.source},${e.matchedName||''},${e.confidence},${e.distance?.toFixed(4)||''}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `detection_log_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }, [detectionLog]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(detectionLog, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `detection_log_${Date.now()}.json`; a.click(); URL.revokeObjectURL(a.href);
  }, [detectionLog]);

  const exportSnapshots = useCallback(async () => {
    const JSZip = window.JSZip;
    if (!JSZip) { addToast('error', 'Export Error', 'JSZip not loaded'); return; }
    const zip = new JSZip();
    for (const snap of snapshots) {
      const res = await fetch(snap.dataURL);
      const blob = await res.blob();
      const name = `snapshot_${new Date(snap.timestamp).toISOString().replace(/[:.]/g,'-')}_${snap.matchedName||'unknown'}.png`;
      zip.file(name, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(content); a.download = `face_finder_snapshots_${new Date().toISOString().slice(0,10)}.zip`; a.click();
  }, [snapshots, addToast]);

  const exportSessionJSON = useCallback(() => {
    const data = { elapsed: (Date.now() - sessionStartRef.current) / 1000, framesProcessed: framesRef.current,
      totalFaces: detectionLog.length, uniqueMatches: new Set(detectionLog.filter(e => e.matchedName).map(e => e.matchedName)).size,
      totalAlerts: detectionLog.filter(e => e.isAlert).length, enrolledFaces, timeline: timelineRef.current };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `session_report_${Date.now()}.json`; a.click();
  }, [detectionLog, enrolledFaces]);

  /* ── CLEANUP ── */
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  /* ── SESSION DATA ── */
  const sessionData = useMemo(() => ({
    elapsed: (Date.now() - sessionStartRef.current) / 1000,
    framesProcessed: framesRef.current,
    totalFaces: detectionLog.length,
    uniqueMatches: new Set(detectionLog.filter(e => e.matchedName).map(e => e.matchedName)).size,
    totalAlerts: detectionLog.filter(e => e.isAlert).length,
    timeline: timelineRef.current,
  }), [detectionLog, showSession]);


  /* ── SOURCE CONTROLS ── */
  const SourceControls = () => (
    <div className="flex items-center gap-3 animate-fade-in">
      {sourceMode === 'cctv' && (
        <>
          <select id="camera-select" name="camera-select" value={selectedCamera} onChange={e => setSelectedCamera(e.target.value)}
            className="text-[10px] px-3 py-1.5 rounded-lg bg-black/40 border border-[#00f2ff22] text-[#e0e6ed] outline-none">
            {cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label || `CAM-0${cameras.indexOf(c)+1}`}</option>)}
          </select>
          <select id="resolution-select" name="resolution-select" value={resolution} onChange={e => setResolution(e.target.value)}
            className="text-[10px] px-3 py-1.5 rounded-lg bg-black/40 border border-[#00f2ff22] text-[#e0e6ed] outline-none">
            <option value="480">480p</option><option value="720">720p</option><option value="1080">1080p</option>
          </select>
          <button onClick={isPlaying ? stopCamera : startCamera} 
            className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all hud-btn ${isPlaying ? 'hud-btn-danger' : 'hud-btn-active'}`}>
            {isPlaying ? 'STOP CAMERA' : 'START CAMERA'}
          </button>
        </>
      )}
      {sourceMode === 'drone' && (
        <>
          <input id="drone-url-input" name="drone-url-input" value={droneUrl} onChange={e => setDroneUrl(e.target.value)} placeholder="Neural Stream URL..."
            className="flex-1 text-[10px] px-3 py-1.5 rounded-lg bg-black/40 border border-[#00f2ff22] text-[#e0e6ed] outline-none" />
          <button onClick={droneStatus === 'CONNECTED' ? disconnectDrone : connectDrone} 
            className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all hud-btn ${droneStatus === 'CONNECTED' ? 'hud-btn-danger' : 'hud-btn-active'}`}>
            {droneStatus === 'CONNECTED' ? 'DISCONNECT' : 'CONNECT'}
          </button>
          <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 font-mono text-[9px] text-[#00f2ff] uppercase tracking-tighter">
            {droneStatus}
          </div>
        </>
      )}
      {sourceMode === 'recording' && (
        <>
          <input id="video-file-input" name="video-file-input" ref={videoFileRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
          <button onClick={() => videoFileRef.current?.click()} className="px-4 py-1.5 text-[10px] font-bold rounded-lg hud-btn hud-btn-active group">
            UPLOAD ARCHIVE
          </button>
          <button onClick={() => handleVideoUpload(null, true)} className="px-4 py-1.5 text-[10px] font-bold rounded-lg hud-btn group">
            DEMO SIGNAL
          </button>
          {videoFileName && (
            <div className="flex-1 min-w-0 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
              <span className="font-mono text-[9px] text-[#00f2ff] truncate block">{videoFileName}</span>
            </div>
          )}
        </>
      )}
    </div>
  );

  /* ── RENDER ── */
  /* ── RENDER ── */
  return (
    <div className="w-full h-screen flex flex-col overflow-hidden relative bg-[#020205]">
      {/* Global HUD Decorations */}
      <div className="bit-background" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f2ff33] to-transparent z-50 shadow-[0_0_10px_#00f2ff22]" />
      
      {modelsLoading && <LoadingScreen modelStatus={modelStatus} loadingTime={loadingTime} onRetry={loadModels} fadeOut={loadingFadeOut} />}

      <TopBar stats={stats} settings={settings} sourceMode={sourceMode} audioMuted={audioMuted}
        detectionEnabled={detectionEnabled} onToggleAudio={() => setAudioMuted(p => !p)}
        onToggleDetection={() => setDetectionEnabled(p => !p)}
        onOpenSettings={() => setShowSettings(true)} onOpenSession={() => setShowSession(true)} />

      <div className="flex-1 flex overflow-hidden p-3 gap-3 relative">
        <LeftPanel enrolledFaces={enrolledFaces} onEnroll={handleEnroll} 
          onDeleteFace={(id) => setEnrolledFaces(prev => prev.filter(f => f.id !== id))}
          onRenameFace={(id, name) => setEnrolledFaces(prev => prev.map(f => f.id === id ? { ...f, name } : f))}
          onClearAll={() => setEnrolledFaces([])}
          sourceMode={sourceMode} videoRef={videoRef} isPlaying={isPlaying}
          onPlay={() => { videoRef.current?.play(); setIsPlaying(true); }}
          onPause={() => { videoRef.current?.pause(); setIsPlaying(false); }}
          onStop={() => { if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } setIsPlaying(false); }}
          onSeek={(delta) => { if (videoRef.current) videoRef.current.currentTime += delta; }}
          playbackSpeed={playbackSpeed}
          onSpeedChange={(s) => { setPlaybackSpeed(s); if (videoRef.current) videoRef.current.playbackRate = s; }}
          volume={videoVolume} onVolumeChange={(v) => { setVideoVolume(v); if (videoRef.current) videoRef.current.volume = v; }}
          muted={videoMuted} onMuteToggle={() => { setVideoMuted(p => !p); if (videoRef.current) videoRef.current.muted = !videoMuted; }}
          videoDuration={videoDuration} currentTime={currentTime} />

        {/* Center: Live Feed HUD */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 relative glass-panel rounded-2xl overflow-hidden shadow-2xl">
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-tr" />
          <div className="hud-corner hud-corner-bl" />
          <div className="hud-corner hud-corner-br" />
          
          <div className="flex-1 w-full relative group overflow-hidden bg-black/40">
            <video ref={videoRef} className="hidden" playsInline muted crossOrigin="anonymous" />
            <canvas ref={canvasRef} className="w-full h-full object-contain"
              style={{ cursor: zoneMode ? 'crosshair' : 'default' }}
              onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} />
            
            {/* HUD Overlays */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-[80%] h-[80%] border border-[#00f2ff22] rounded-full animate-orbit" />
                <div className="w-[110%] h-[110%] border border-[#00f2ff11] rounded-full animate-orbit" style={{ animationDirection: 'reverse' }} />
              </div>
              
              {/* Scanline */}
              {isPlaying && <div className="absolute top-0 left-0 w-full h-[3px] bg-[#00f2ff44] shadow-[0_0_20px_#00f2ff] animate-scanner-y z-10" />}
              
              {/* Target Banners */}
              {matchBanner && (
                <div className="absolute top-6 left-6 right-6 z-20 px-6 py-4 rounded-xl animate-glitch"
                  style={{ background: 'rgba(0,255,170,0.15)', border: '1px solid #00ffaa', backdropFilter: 'blur(15px)',
                    boxShadow: '0 0 40px rgba(0,255,170,0.25)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-[#00ffaa] rounded-full animate-ping" />
                      <span className="text-sm font-bold tracking-[0.3em] text-[#00ffaa]" style={{ fontFamily: 'Rajdhani' }}>
                        THREAT MATCH: {matchBanner.name.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-[10px] text-[#00ffaa] opacity-80">{matchBanner.confidence}% PROBABILITY</span>
                      <span className="font-mono text-[8px] text-[#00ffaa] opacity-40">SIGNAL: {matchBanner.source?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* LIVE indicator */}
              {isPlaying && (
                <div className="absolute bottom-6 left-6 flex items-center gap-4 px-4 py-2 glass-card rounded-lg border-[#ff3c3c33] shadow-lg">
                  <div className="w-2.5 h-2.5 bg-[#ff3c3c] rounded-full animate-pulse" />
                  <div className="flex flex-col">
                    <span className="stat-ticker text-[10px] text-[#ff3c3c]">FEED ACTIVE</span>
                    <span className="font-mono text-[8px] opacity-40 uppercase">{sourceMode} SOURCE</span>
                  </div>
                </div>
              )}

              {/* Play Overlay for Archive */}
              {sourceMode === 'recording' && videoFileName && !isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-fade-in group">
                  <button onClick={() => { videoRef.current?.play(); setIsPlaying(true); }}
                    className="w-20 h-20 rounded-full bg-[#00f2ff11] border border-[#00f2ff44] flex items-center justify-center text-[#00f2ff] hover:scale-110 hover:bg-[#00f2ff22] transition-all shadow-[0_0_30px_#00f2ff22]">
                    <Play size={40} className="ml-1" />
                  </button>
                  <div className="absolute bottom-1/3 text-center">
                    <p className="stat-ticker text-[10px] text-[#00f2ff] animate-pulse">READY FOR RECONSTRUCTION</p>
                    <p className="font-mono text-[8px] text-[#4a5068] mt-2 uppercase tracking-widest">Signal Locked: press play or space</p>
                  </div>
                </div>
              )}
            </div>

            {/* Empty State */}
            {!isPlaying && (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 animate-fade-in">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 border-2 border-[#00f2ff0a] rounded-full animate-orbit" />
                  <div className="absolute inset-6 border border-[#00f2ff11] rounded-full animate-orbit" style={{ animationDirection: 'reverse' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {sourceMode === 'recording' && !videoFileName ? (
                      <Database size={64} className="text-[#ffcc0044] animate-pulse" />
                    ) : (
                      <Camera size={64} className="text-[#00f2ff11] animate-pulse" />
                    )}
                  </div>
                </div>
                
                <div className="text-center group max-w-md px-12">
                  <h3 className="stat-ticker text-xl mb-4 opacity-70 group-hover:opacity-100 transition-opacity tracking-[0.2em]">
                    {sourceMode === 'recording' && !videoFileName ? 'NEURAL ARCHIVE OFFLINE' : 'Awaiting Feed Signal'}
                  </h3>
                  
                  {sourceMode === 'recording' && !videoFileName ? (
                    <div className="space-y-6">
                      <p className="font-mono text-[9px] text-[#4a5068] tracking-widest leading-relaxed uppercase">
                        Link recorded spatial telemetry to begin neural reconstruction.
                      </p>
                      <div className="flex gap-4 justify-center">
                        <button onClick={() => videoFileRef.current?.click()} className="px-6 py-2 rounded-xl bg-[#ffcc0011] border border-[#ffcc0033] text-[#ffcc00] font-bold text-[10px] hover:bg-[#ffcc0022] transition-all">
                          INITIALIZE ARCHIVE
                        </button>
                        <button onClick={() => handleVideoUpload(null, true)} className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 font-bold text-[10px] hover:bg-white/10 transition-all">
                          LOAD DEMO SIGNAL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-1 h-3 bg-[#00f2ff33] rounded animate-pulse" />
                      <p className="font-mono text-[9px] text-[#4a5068] tracking-widest uppercase">Initializing Secure Link...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* HUD Control Strips */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f2ff33] to-transparent" />
          
          <div className="w-full px-6 py-4 flex flex-col gap-4 bg-black/20">
            <SourceControls />
            
            {/* Source Selection Strip */}
            <div className="flex gap-2">
              {[
                { key: 'cctv', label: 'CAM-SEC-01', sub: 'LOCAL FEED', color: '#00ffaa' },
                { key: 'drone', label: 'UAV-SENTINEL', sub: 'AIRBORNE', color: '#00f2ff' },
                { key: 'recording', label: 'DB-ARCHIVE', sub: 'NEURAL REPLAY', color: '#ffcc00' },
              ].map(tab => (
                <button key={tab.key} 
                        onClick={() => { stopCamera(); disconnectDrone(); setSourceMode(tab.key); setIsPlaying(false); }}
                        className={`flex-1 group relative p-4 transition-all duration-300 rounded-xl border ${sourceMode === tab.key ? 'bg-[#00f2ff0d] border-[#00f2ff33] shadow-lg' : 'hover:bg-[#ffffff05] border-transparent'}`}>
                  <div className="flex flex-col items-start gap-1">
                    <span className={`text-[11px] font-bold tracking-[0.2em] transition-colors ${sourceMode === tab.key ? '' : 'text-[#4a5068]'}`}
                          style={{ color: sourceMode === tab.key ? tab.color : '' }}>{tab.label}</span>
                    <span className="font-mono text-[8px] opacity-40 uppercase">{tab.sub}</span>
                  </div>
                  {sourceMode === tab.key && <div className="absolute bottom-0 left-0 w-full h-[2px] rounded-full shadow-[0_0_10px]" style={{ background: tab.color }} />}
                </button>
              ))}
            </div>

            {/* Zone & Map Controls */}
            <div className="flex items-center gap-6 pt-1">
              <button onClick={() => setZoneMode(p => !p)}
                className={`flex items-center gap-3 px-5 py-2 rounded-xl text-[10px] font-bold tracking-widest transition-all hud-btn ${zoneMode ? 'hud-btn-active' : ''}`}>
                <MapIcon size={14} /> SPATIAL ZONES
              </button>
              <div className="flex gap-2 flex-1 overflow-x-auto no-scrollbar py-1">
                {zones.map(z => (
                  <div key={z.id} className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-black/40 border border-[#ffffff0a] shadow-inner">
                    <div className="w-2 h-2 rounded-full shadow-[0_0_8px]" style={{ background: ZONE_TYPES[z.type]?.color }} />
                    <span className="font-mono text-[9px] whitespace-nowrap opacity-60 uppercase tracking-tighter">{z.name}</span>
                    <button onClick={() => setZones(prev => prev.filter(zn => zn.id !== z.id))} className="text-[#ff3c3c] opacity-30 hover:opacity-100 transition-opacity ml-1">×</button>
                  </div>
                ))}
              </div>
              {zones.length > 0 && (
                <button onClick={() => setZones([])} className="text-[10px] font-bold text-[#ff3c3c] hover:underline tracking-tight cursor-pointer opacity-80">PURGE ALL</button>
              )}
            </div>
          </div>
        </div>

        <RightPanel log={detectionLog} filter={logFilter} sort={logSort}
          onFilterChange={setLogFilter} onSortChange={setLogSort}
          onClearLog={() => setDetectionLog([])} onExportCSV={exportCSV} onExportJSON={exportJSON} />
      </div>

      <BottomStrip snapshots={snapshots}
        onClearSnapshots={() => setSnapshots([])} onExportAll={exportSnapshots}
        onDeleteSnapshot={(i) => { setSnapshots(prev => prev.filter((_, idx) => idx !== i)); }}
        onCaptureSnapshot={() => captureSnapshot(null, null, sourceMode)} />

      {/* Overlays & Modals */}
      {zoneConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setZoneConfig(null)} />
          <div className="relative glass-panel rounded-3xl p-8 w-[400px] animate-glitch shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div className="hud-corner hud-corner-tl" />
            <div className="hud-corner hud-corner-tr" />
            <div className="hud-corner hud-corner-bl" />
            <div className="hud-corner hud-corner-br" />
            
            <h3 className="stat-ticker text-lg mb-6 flex items-center gap-3">
              <MapIcon size={20} className="text-[#00f2ff]" />
              Initialize Spatial Zone
            </h3>
            <div className="space-y-6">
              <div>
                <label className="font-mono text-[10px] text-[#4a5068] uppercase mb-2 block tracking-[0.2em]">IDENTIFIER</label>
                <input id="zone-name-input" name="zone-name-input" placeholder="DESIGNATION-0X..." 
                  className="w-full p-4 bg-black/60 border border-[#00f2ff11] rounded-xl font-mono text-sm text-[#e0e6ed] focus:border-[#00f2ff66] focus:shadow-[0_0_15px_#00f2ff11] outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(ZONE_TYPES).map(t => (
                  <button key={t} 
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-[#ffffff05] bg-black/40 hover:bg-[#ffffff0a] hover:border-[#ffffff22] transition-all group"
                    onClick={() => {
                      const name = document.getElementById('zone-name-input')?.value || 'ZONE';
                      saveZone(name, t);
                    }}>
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110" style={{ borderColor: ZONE_TYPES[t].color }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: ZONE_TYPES[t].color }} />
                    </div>
                    <span className="font-mono text-[9px] opacity-60 uppercase tracking-widest">{ZONE_TYPES[t].label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setZoneConfig(null)} className="w-full py-3 text-[10px] font-bold text-[#4a5068] hover:text-[#ff3c3c] transition-colors tracking-[0.3em] uppercase underline-offset-8 underline">
                Cancel Initialization
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && <SettingsModal settings={settings} onSettingsChange={setSettings} onClose={() => setShowSettings(false)} />}
      {showSession && <SessionModal sessionData={sessionData} enrolledFaces={enrolledFaces}
        onClose={() => setShowSession(false)} onExportJSON={exportSessionJSON} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
