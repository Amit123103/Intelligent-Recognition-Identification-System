import React, { useRef, useEffect } from 'react';
import { X, Download, BarChart3, Keyboard, Activity, ShieldAlert, Users, Clock, Hash } from 'lucide-react';
import { KEYBOARD_SHORTCUTS, formatTime } from '../utils/constants.js';

/* ═══════════ SESSION MODAL ═══════════ */
export function SessionModal({ sessionData, enrolledFaces, onExportJSON, onClose }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !sessionData.timeline?.length) return;
    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width = (canvas.parentElement.clientWidth - 48) * dpr;
    const h = canvas.height = 140 * dpr;
    ctx.scale(dpr, dpr);
    
    const displayW = canvas.width / dpr;
    const displayH = canvas.height / dpr;

    ctx.clearRect(0, 0, displayW, displayH);

    const data = sessionData.timeline;
    const maxVal = Math.max(...data.map(d => d.matches + d.unknowns), 1);
    const barW = Math.max(3, Math.floor(displayW / data.length) - 2);

    data.forEach((d, i) => {
      const x = (i / data.length) * displayW;
      const mH = (d.matches / maxVal) * (displayH - 40);
      const uH = (d.unknowns / maxVal) * (displayH - 40);

      // Match Bar (Neon Green)
      const mGrad = ctx.createLinearGradient(0, displayH - 10 - mH, 0, displayH - 10);
      mGrad.addColorStop(0, '#00ffaa');
      mGrad.addColorStop(1, '#00ffaa11');
      ctx.fillStyle = mGrad;
      ctx.fillRect(x, displayH - 10 - mH, barW, mH);

      // Unknown Bar (Cyber Blue/Gray)
      const uGrad = ctx.createLinearGradient(0, displayH - 10 - uH, 0, displayH - 10);
      uGrad.addColorStop(0, '#00f2ff44');
      uGrad.addColorStop(1, '#00f2ff05');
      ctx.fillStyle = uGrad;
      ctx.fillRect(x + barW + 1, displayH - 10 - uH, barW, uH);
    });

    // Legend
    ctx.font = 'bold 8px Rajdhani';
    ctx.fillStyle = '#00ffaa';
    ctx.fillText('VERIFIED_MATCH', 10, 15);
    ctx.fillStyle = '#00f2ff';
    ctx.fillText('SIGNAL_UNK', 90, 15);
  }, [sessionData.timeline]);

  const fmtTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-[#02020588] backdrop-blur-2xl animate-fade-in" onClick={onClose} />
      
      <div className="relative max-w-3xl w-full glass-panel rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-glitch" onClick={e => e.stopPropagation()}>
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-br" />
        
        <div className="flex flex-col h-[650px]">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-4">
              <BarChart3 size={24} className="text-[#00f2ff]" />
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-[#e0e6ed] uppercase tracking-wider" style={{ fontFamily: 'Rajdhani' }}>Session Signal Report</h2>
                <span className="font-mono text-[8px] text-[#4a5068] tracking-[0.3em] uppercase">Post-Operation Telemetry Analysis</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onExportJSON} className="p-3 rounded-xl hover:bg-white/5 text-[#00f2ff] transition-all" data-tooltip="Export Telemetry">
                <Download size={20} />
              </button>
              <button onClick={onClose} className="p-3 rounded-xl hover:bg-white/5 text-[#ff3c3c] transition-all">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
            {/* High Level Stats */}
            <div className="grid grid-cols-4 gap-4">
               {[
                 { label: 'OP_TIME', val: fmtTime(sessionData.elapsed), icon: Clock, color: '#00f2ff' },
                 { label: 'PACKETS', val: sessionData.framesProcessed, icon: Hash, color: '#4a5068' },
                 { label: 'MATCHES', val: sessionData.uniqueMatches, icon: Users, color: '#00ffaa' },
                 { label: 'ALERTS', val: sessionData.totalAlerts, icon: ShieldAlert, color: '#ff3c3c' },
               ].map(s => (
                 <div key={s.label} className="glass-card p-5 rounded-2xl border-white/5 bg-black/20 flex flex-col items-center gap-2">
                    <s.icon size={16} className="opacity-40" style={{ color: s.color }} />
                    <span className="font-mono text-[8px] text-[#4a5068] uppercase tracking-widest">{s.label}</span>
                    <span className="text-xl font-bold text-white" style={{ fontFamily: 'Rajdhani' }}>{s.val}</span>
                 </div>
               ))}
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Activity size={14} className="text-[#ffcc00]" />
                <h3 className="stat-ticker text-[10px]">Signal Density Timeline</h3>
              </div>
              <div className="glass-card p-6 rounded-2xl border-white/5 bg-black/40 relative">
                <canvas ref={chartRef} className="w-full h-32" />
                <div className="absolute top-2 right-2 font-mono text-[7px] text-[#4a5068]">REALTIME_RECONSTRUCTION_v2</div>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h3 className="font-mono text-[8px] text-[#4a5068] uppercase tracking-widest">Neural Database Engagement</h3>
                  <div className="space-y-2">
                     {enrolledFaces.map(f => (
                       <div key={f.id} className="glass-card p-3 rounded-xl border-white/5 flex items-center gap-3 hover:border-[#00f2ff22] transition-all">
                          <img src={f.thumbnail} className="w-10 h-10 rounded-lg object-cover grayscale border border-white/5" />
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between">
                                <span className="font-bold text-[10px] text-white uppercase" style={{ fontFamily: 'Rajdhani' }}>{f.name}</span>
                                <span className="font-mono text-[8px] text-[#00ffaa]">{f.matchCount}X</span>
                             </div>
                             <div className="w-full h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full bg-[#00ffaa66]" style={{ width: `${Math.min(100, f.matchCount * 10)}%` }} />
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="font-mono text-[8px] text-[#4a5068] uppercase tracking-widest">System Health</h3>
                  <div className="glass-card p-6 rounded-2xl border-white/5 bg-black/20 space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-[#e0e6ed]">AI_CORE_LOAD</span>
                        <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-[#00f2ff]" style={{ width: '42%' }} />
                        </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-[#e0e6ed]">MEMORY_DENSITY</span>
                        <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-[#ffcc00]" style={{ width: '68%' }} />
                        </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-[#e0e6ed]">LATENCY_MS</span>
                        <span className="font-mono text-[9px] text-[#00ffaa]">14.2ms</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ SHORTCUTS MODAL ═══════════ */
export function ShortcutsModal({ onClose }) {
  const categories = [
    { label: 'Control', shortcuts: [
      { key: 'Space', desc: 'Playback Toggle' },
      { key: 'D', desc: 'Neural Engine' },
      { key: 'Z', desc: 'Zone Geometry' },
      { key: 'Esc', desc: 'Abort Mode' },
    ]},
    { label: 'Analysis', shortcuts: [
      { key: 'S', desc: 'Signal Capture' },
      { key: 'N', desc: 'Night Vision' },
      { key: 'L', desc: 'Topology Map' },
      { key: 'T', desc: 'Vector Trails' },
    ]},
    { label: 'Navigation', shortcuts: [
      { key: 'F', desc: 'Fullscreen' },
      { key: '← →', desc: 'Drift ±5s' },
      { key: '[ ]', desc: 'Temporal Speed' },
      { key: '?', desc: 'Knowledge Base' },
    ]}
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-[#02020588] backdrop-blur-2xl animate-fade-in" onClick={onClose} />
      
      <div className="relative max-w-2xl w-full glass-panel rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-glitch" onClick={e => e.stopPropagation()}>
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-4">
            <Keyboard size={24} className="text-[#00f2ff]" />
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-[#e0e6ed] uppercase tracking-wider" style={{ fontFamily: 'Rajdhani' }}>Interface Protocols</h2>
              <span className="font-mono text-[8px] text-[#4a5068] tracking-[0.3em] uppercase">Human-Machine Interface Bindings</span>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-xl hover:bg-white/5 text-[#ff3c3c] transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-3 gap-6">
          {categories.map(cat => (
            <div key={cat.label} className="space-y-4">
              <h3 className="font-mono text-[8px] text-[#4a5068] uppercase tracking-[0.2em] border-b border-white/5 pb-2">{cat.label}</h3>
              <div className="space-y-3">
                {cat.shortcuts.map(s => (
                  <div key={s.key} className="flex flex-col gap-1">
                    <span className="font-mono text-[7px] text-[#4a5068] uppercase">{s.desc}</span>
                    <div className="flex">
                       <kbd className="px-2 py-0.5 rounded border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff] font-mono text-[9px] shadow-[0_0_8px_#00f2ff11]">
                          {s.key}
                       </kbd>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 bg-black/20 border-t border-white/5 text-center">
           <p className="font-mono text-[8px] text-[#4a5068] uppercase tracking-[0.3em]">Neural System Interaction Layer v2.0</p>
        </div>
      </div>
    </div>
  );
}
