import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Volume2, VolumeX, Settings, Clock, Activity, Zap, ShieldAlert, Cpu } from 'lucide-react';

const SOURCE_COLORS = { cctv: '#00ffaa', drone: '#00f2ff', recording: '#ffcc00' };

export default function TopBar({ stats, settings, sourceMode, audioMuted, detectionEnabled,
  onToggleAudio, onToggleDetection, onOpenSettings, onOpenSession }) {
  
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-16 flex items-center justify-between px-6 shrink-0 relative z-50 overflow-hidden bg-black/40 border-b border-[#00f2ff11] backdrop-blur-xl">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f2ff33] to-transparent" />
      
      {/* LEFT: Branding & System Status */}
      <div className="flex items-center gap-6">
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-2 bg-[#00f2ff0a] rounded-full animate-pulse-slow opacity-0 group-hover:opacity-100 transition-opacity" />
          <svg width="40" height="40" viewBox="0 0 40 40" className="animate-neon">
            <circle cx="20" cy="20" r="18" stroke="#00f2ff22" strokeWidth="1" fill="none" />
            <circle cx="20" cy="20" r="14" stroke="#00f2ff44" strokeWidth="2" strokeDasharray="4 8" fill="none" className="animate-orbit" />
            <circle cx="20" cy="20" r="4" fill="#00f2ff" />
            <path d="M20 2 L20 8 M20 32 L20 38 M2 20 L8 20 M32 20 L38 20" stroke="#00f2ff" strokeWidth="1.5" />
          </svg>
        </div>
        
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-[0.4em] text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]"
            style={{ fontFamily: "'Rajdhani',sans-serif" }}>
            SENTINEL <span className="text-[#e0e6ed] opacity-80">v2.0</span>
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-sm bg-[#00ffaa] animate-pulse" />
            <span className="stat-ticker text-[8px] opacity-60">NEURAL ENGINE ONLINE</span>
            <a href="https://intelligent-recognition-identification.onrender.com" target="_blank" rel="noopener noreferrer" 
               className="font-mono text-[8px] text-[#00f2ff] opacity-40 hover:opacity-100 transition-opacity uppercase tracking-tighter">
              📡 LIVE_NET_SIGNAL: ONRENDER.COM
            </a>
          </div>
        </div>
      </div>

      {/* CENTER: Neural Diagnostics */}
      <div className="hidden lg:flex items-center gap-2">
        {[
          { icon: Activity, label: 'PROC_RATE', value: `${stats.fps.toFixed(1)}Hz`, color: '#00f2ff' },
          { icon: Zap, label: 'LOAD_TIME', value: `${stats.msPerFrame}ms`, color: stats.msPerFrame > 50 ? '#ff3c3c' : '#00ffaa' },
          { icon: ShieldAlert, label: 'ALERTS', value: stats.alerts, color: stats.alerts > 0 ? '#ff3c3c' : '#4a5068', pulse: stats.alertPulse },
          { icon: Cpu, label: 'TARGETS', value: stats.enrolled, color: '#00f2ff' },
        ].map(s => (
          <div key={s.label} className="glass-card px-4 py-2 rounded-xl flex items-center gap-3 border-[#ffffff05] group">
            <div className={`p-1.5 rounded-lg transition-colors ${s.pulse ? 'animate-pulse bg-red-500/10' : 'bg-white/5'}`}>
              <s.icon size={14} style={{ color: s.color }} />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[8px] opacity-40 uppercase tracking-tighter">{s.label}</span>
              <span className="font-bold text-sm tracking-widest text-[#e0e6ed]" style={{ fontFamily: 'Rajdhani' }}>{s.value}</span>
            </div>
            {s.pulse && <div className="w-[1px] h-4 bg-red-500/20 animate-pulse ml-2" />}
          </div>
        ))}
      </div>

      {/* RIGHT: Operational Controls */}
      <div className="flex items-center gap-3">
        {/* System Time */}
        <div className="hidden xl:flex flex-col items-end px-3 border-r border-white/10">
          <span className="font-mono text-[10px] text-[#00f2ff]">{time.toLocaleTimeString([], { hour12: false })}</span>
          <span className="font-mono text-[8px] opacity-40">{time.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl border border-white/5">
          <button onClick={onToggleAudio}
            className={`p-2 rounded-lg transition-all ${audioMuted ? 'text-[#4a5068]' : 'text-[#00f2ff] bg-[#00f2ff0a]'}`} data-tooltip={audioMuted ? 'Activate Audio' : 'Silence System'}>
            {audioMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button onClick={onToggleDetection}
            className={`p-2 rounded-lg transition-all ${detectionEnabled ? 'text-[#00ffaa] bg-[#00ffaa0a]' : 'text-[#4a5068]'}`} data-tooltip={detectionEnabled ? 'Disable Neural Net' : 'Enable Neural Net'}>
            {detectionEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button onClick={onOpenSettings}
            className="p-2 rounded-lg text-[#00f2ff] hover:bg-[#00f2ff0a] transition-all" data-tooltip="System Configuration">
            <Settings size={18} />
          </button>
          <button onClick={onOpenSession}
            className="p-2 rounded-lg text-[#00f2ff] hover:bg-[#00f2ff0a] transition-all" data-tooltip="Session Logs">
            <Clock size={18} />
          </button>
        </div>

        {/* Source Status */}
        <div className="flex flex-col items-end gap-1 ml-2">
          <div className="stat-ticker text-[8px] opacity-40">SIGNAL_SRC</div>
          <div className="hud-badge rounded-sm px-2 py-0.5 flex items-center gap-2" style={{ color: SOURCE_COLORS[sourceMode], borderColor: `${SOURCE_COLORS[sourceMode]}33` }}>
            <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px]" style={{ background: SOURCE_COLORS[sourceMode] }} />
            <span className="font-bold">{sourceMode.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
