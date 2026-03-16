export const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
export const DEMO_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export const COLORS = {
  bgPrimary: '#05050a', bgPanel: '#0d0d14', bgCard: '#12121c', bgElevated: '#181824',
  cyan: '#00e5ff', cyanDim: '#00b8cc', red: '#ff2b2b', redDim: '#cc2020',
  green: '#00ff88', greenDim: '#00cc66', amber: '#ffaa00',
  borderDefault: 'rgba(0,229,255,0.12)', borderBright: 'rgba(0,229,255,0.35)',
  textPrimary: '#e8eaf0', textSecondary: '#8890a8', textMuted: '#4a5068',
};

export const DEFAULT_SETTINGS = {
  matchThreshold: 0.45, likelyThreshold: 0.50, minFaceSize: 50, maxFaces: 20,
  detector: 'tiny', inputSize: 416, scoreThreshold: 0.5,
  showBoxes: true, showLandmarks: false, showConfidence: true, showDistance: false,
  showFaceIds: true, showScanlines: true, boxStyle: 'corners', boxThickness: 2, landmarkSize: 2,
  audioAlerts: true, visualAlerts: true, alertCooldown: 3000, alertVolume: 70,
  autoPauseOnMatch: false, autoSnapshotOnMatch: true,
  detectionInterval: 250, snapshotFormat: 'png', jpegQuality: 85,
  includeTimestamp: true, includeMatchData: true,
  nightMode: false, multiCamera: false, showQuality: false, showTrails: false,
  performanceMode: 'balanced',
  crowdMode: false, crowdTilingCols: 3, crowdTilingRows: 2,
};

export const ZONE_TYPES = {
  SAFE: { color: '#00ff88', fill: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.5)' },
  RESTRICTED: { color: '#ff2b2b', fill: 'rgba(255,43,43,0.15)', border: 'rgba(255,43,43,0.5)' },
  ALERT: { color: '#ffaa00', fill: 'rgba(255,170,0,0.15)', border: 'rgba(255,170,0,0.5)' },
  MONITOR: { color: '#00e5ff', fill: 'rgba(0,229,255,0.1)', border: 'rgba(0,229,255,0.5)' },
};

export const KEYBOARD_SHORTCUTS = [
  ['Space', 'Play / Pause (recording)'], ['D', 'Toggle detection'], ['S', 'Take snapshot'],
  ['M', 'Toggle mute'], ['Z', 'Toggle zone mode'], ['N', 'Toggle night mode'], ['C', 'Toggle crowd mode'],
  ['L', 'Toggle landmarks'], ['T', 'Toggle tracking trails'], ['Escape', 'Close modal'],
  ['← →', 'Seek ±5s (recording)'], ['[ ]', 'Playback speed'], ['F', 'Toggle fullscreen'],
  ['?', 'Show shortcuts'],
];

export function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  const mil = String(ms % 1000).padStart(3, '0');
  return `${h}:${m}:${sec}.${mil}`;
}

export function formatTimeShort(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function getMatchClass(distance, threshold, likelyThreshold) {
  if (distance < threshold) return { label: 'MATCH', color: '#00ff88', bg: 'rgba(0,255,136,0.15)' };
  if (distance < likelyThreshold) return { label: 'LIKELY', color: '#aaff44', bg: 'rgba(170,255,68,0.1)' };
  if (distance < 0.60) return { label: 'POSSIBLE', color: '#ffaa00', bg: 'rgba(255,170,0,0.1)' };
  return { label: 'UNKNOWN', color: '#4a5068', bg: 'rgba(74,80,104,0.1)' };
}

export function euclidean(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}
