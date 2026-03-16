import React, { useState } from 'react';
import { X, Settings, Shield, Zap, Bell, Video, Cpu, Sliders } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '../utils/constants.js';

const TABS = [
  { key: 'detection', label: 'Detection', icon: Cpu },
  { key: 'overlay', label: 'Overlay', icon: Zap },
  { key: 'alerts', label: 'Alerts', icon: Bell },
  { key: 'recording', label: 'Signals', icon: Video },
  { key: 'advanced', label: 'Advanced', icon: Shield },
];

export default function SettingsModal({ settings, onSettingsChange, onClose }) {
  const [tab, setTab] = useState('detection');
  const set = (key, val) => onSettingsChange({ ...settings, [key]: val });

  const Slider = ({ label, k, min, max, step = 1, format }) => (
    <div className="glass-card p-4 rounded-xl border-white/5 group hover:border-[#00f2ff22] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <label className="font-mono text-[10px] text-[#4a5068] uppercase tracking-widest">{label}</label>
        <span className="font-mono text-[10px] text-[#00f2ff] bg-[#00f2ff0a] px-2 py-0.5 rounded border border-[#00f2ff22]">
          {format ? format(settings[k]) : settings[k]}
        </span>
      </div>
      <input id={`input-${k}`} name={`input-${k}`} type="range" min={min} max={max} step={step} value={settings[k]}
        onChange={e => set(k, parseFloat(e.target.value))} className="w-full accent-[#00f2ff] cursor-pointer" />
    </div>
  );

  const Toggle = ({ label, k, desc }) => (
    <div className="glass-card flex items-center justify-between p-4 rounded-xl border-white/5 hover:border-[#00f2ff22] transition-colors group">
      <div className="flex flex-col gap-0.5">
        <label className="font-bold text-xs text-[#e0e6ed] uppercase tracking-wider" style={{ fontFamily: 'Rajdhani' }}>{label}</label>
        {desc && <p className="font-mono text-[8px] text-[#4a5068]">{desc}</p>}
      </div>
      <button onClick={() => set(k, !settings[k])}
        className={`w-12 h-6 rounded-full relative transition-all duration-300 border ${settings[k] ? 'bg-[#00f2ff22] border-[#00f2ff44]' : 'bg-white/5 border-white/10'}`}>
        <div className={`absolute top-1 w-3.5 h-3.5 rounded-full transition-all duration-300 ${settings[k] ? 'left-7 bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]' : 'left-1 bg-[#4a5068]'}`} />
      </button>
    </div>
  );

  const BtnGroup = ({ label, k, options }) => (
    <div className="glass-card p-4 rounded-xl border-white/5">
      <label className="font-mono text-[10px] text-[#4a5068] uppercase tracking-widest block mb-3">{label}</label>
      <div className="flex gap-2">
        {options.map(opt => (
          <button key={opt.value} onClick={() => set(k, opt.value)}
            className={`flex-1 py-2 text-[8px] font-bold tracking-[0.2em] rounded-lg transition-all border
              ${settings[k] === opt.value ? 'bg-[#00f2ff11] text-[#00f2ff] border-[#00f2ff33] shadow-[0_0_10px_#00f2ff11]' : 'bg-white/5 text-[#4a5068] border-transparent hover:text-white'}`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-[#02020588] backdrop-blur-2xl animate-fade-in" onClick={onClose} />
      
      <div className="relative max-w-2xl w-full glass-panel rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-glitch" onClick={e => e.stopPropagation()}>
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-br" />
        
        <div className="flex h-[550px]">
          {/* Sidebar Nav */}
          <div className="w-48 border-r border-white/5 bg-black/40 p-6 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-8 px-2">
               <Settings size={20} className="text-[#00f2ff]" />
               <span className="stat-ticker text-xs">System Config</span>
            </div>

            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border font-mono text-[9px] uppercase tracking-widest
                  ${tab === t.key ? 'bg-[#00f2ff11] border-[#00f2ff33] text-[#00f2ff] shadow-[0_0_10px_#00f2ff11]' : 'border-transparent text-[#4a5068] hover:text-[#e0e6ed] hover:bg-white/5'}`}>
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
            
            <div className="mt-auto px-2 opacity-20">
               <div className="font-mono text-[8px] text-[#4a5068]">BUILD_v2.0.4-HUD</div>
               <div className="font-mono text-[8px] text-[#4a5068]">STATUS: OPTIMAL</div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
               <div className="flex flex-col">
                  <h2 className="text-2xl font-bold text-[#e0e6ed] uppercase tracking-wider" style={{ fontFamily: 'Rajdhani' }}>
                     {TABS.find(t => t.key === tab)?.label} Control
                  </h2>
                  <span className="font-mono text-[8px] text-[#4a5068] tracking-[0.3em] uppercase">Module Parameter Interface</span>
               </div>
               <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-[#ff3c3c] transition-all">
                  <X size={24} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
              {tab === 'detection' && (
                <>
                  <BtnGroup label="AI CORE MODEL" k="detector" options={[{ label: 'TINY_EYE', value: 'tiny' }, { label: 'SSD_ULTRA', value: 'ssd' }]} />
                  <Slider label="PROCESSOR INPUT SIZE" k="inputSize" min={128} max={608} step={32} />
                  <Slider label="NEURAL SCORE THRESHOLD" k="scoreThreshold" min={0.1} max={0.9} step={0.05} format={v => `${(v*100).toFixed(0)}%`} />
                  <Slider label="RECURSION INTERVAL" k="detectionInterval" min={0} max={2000} step={50} format={v => v === 0 ? 'RT_ASYNCHRONOUS' : `${v}ms`} />
                  <div className="grid grid-cols-2 gap-4">
                     <Slider label="IDENTITY MATCH" k="matchThreshold" min={0.2} max={0.8} step={0.01} format={v => v.toFixed(2)} />
                     <Slider label="PROBABLE MATCH" k="likelyThreshold" min={0.3} max={0.9} step={0.01} format={v => v.toFixed(2)} />
                  </div>
                  <Slider label="PIXEL MIN FACE SCALE" k="minFaceSize" min={10} max={120} step={5} format={v => `${v}px`} />
                  
                  <div className="pt-4 border-t border-white/5 mt-4">
                     <span className="font-mono text-[9px] text-[#00f2ff] uppercase tracking-widest block mb-4">Crowd Protocols [TILING]</span>
                     <Toggle label="Grid-Tiled Detection" k="crowdMode" desc="Multi-scale tiled analysis for 100+ faces" />
                     {settings.crowdMode && (
                        <div className="grid grid-cols-2 gap-4 mt-4 animate-fade-in">
                           <Slider label="GRID COLUMNS" k="crowdTilingCols" min={2} max={5} step={1} />
                           <Slider label="GRID ROWS" k="crowdTilingRows" min={1} max={4} step={1} />
                        </div>
                     )}
                  </div>
                </>
              )}
              {tab === 'overlay' && (
                <div className="grid grid-cols-1 gap-4">
                  <Toggle label="Primary Bounding Rects" k="showBoxes" />
                  <BtnGroup label="RECTANGLE RENDER STYLE" k="boxStyle" options={[{ label: 'BRACKETS', value: 'corners' }, { label: 'SOLID_HUD', value: 'full' }, { label: 'VECTOR_DASH', value: 'dashed' }]} />
                  <Slider label="STROKE INTENSITY" k="boxThickness" min={1} max={5} step={0.5} format={v => `${v}px`} />
                  <div className="grid grid-cols-2 gap-4">
                     <Toggle label="Subject ID" k="showFaceIds" />
                     <Toggle label="Confidence %" k="showConfidence" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <Toggle label="Distance Metric" k="showDistance" />
                     <Toggle label="Neural Landmarks" k="showLandmarks" desc="68-point topology" />
                  </div>
                  <Slider label="LANDMARK NODE SCALE" k="landmarkSize" min={0.5} max={4} step={0.5} format={v => `${v}px`} />
                  <Toggle label="Motion Vector Trails" k="showTrails" />
                  <Toggle label="CRT Scanline Artifacts" k="showScanlines" desc="Tactical overlay filter" />
                </div>
              )}
              {tab === 'alerts' && (
                <>
                  <Toggle label="Auditory Resonance" k="audioAlerts" desc="Audio trigger on match" />
                  <Toggle label="HUD Alert Banner" k="visualAlerts" desc="Visual interrupt on match" />
                  <Slider label="ALERT OUTPUT ATTENUATION" k="alertVolume" min={0} max={100} step={5} format={v => `${v}%`} />
                  <Slider label="SIGNAL COOLDOWN" k="alertCooldown" min={0} max={30000} step={1000} format={v => v === 0 ? 'INSTANT_RELOAD' : `${v/1000}s`} />
                  <Toggle label="Automated Signal Capture" k="autoSnapshotOnMatch" desc="Auto-snapshot on verified match" />
                </>
              )}
              {tab === 'recording' && (
                <>
                  <Toggle label="Auto-Pause Playback" k="autoPauseOnMatch" desc="Pause on identity verification" />
                  <BtnGroup label="COMPRESSION FORMAT" k="snapshotFormat" options={[{ label: 'RAW_PNG', value: 'png' }, { label: 'LEAN_JPEG', value: 'jpeg' }]} />
                  <Slider label="JPEG MATRIX QUALITY" k="jpegQuality" min={10} max={100} step={5} format={v => `${v}%`} />
                </>
              )}
              {tab === 'advanced' && (
                <>
                  <Toggle label="Spectral Night Vision" k="nightMode" desc="Low-light neural gain" />
                  <BtnGroup label="AI COMPUTE DENSITY" k="performanceMode" options={[{ label: 'HIGH_FIDELITY', value: 'quality' }, { label: 'BALANCED', value: 'balanced' }, { label: 'LITE_STREAM', value: 'performance' }]} />
                  <div className="glass-card p-6 rounded-2xl border-white/5 bg-red-500/5">
                     <span className="font-bold text-[#ff3c3c] text-xs uppercase tracking-widest block mb-1">DANGER_ZONE</span>
                     <p className="font-mono text-[8px] text-[#4a5068] mb-4">PURGING DATABASE WILL ERASE ALL NEURAL SIGNATURES</p>
                     <button className="hud-btn hud-btn-danger w-full py-2 text-[8px]">INITIALIZE WORLD_WIPE</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
