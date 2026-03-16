import React, { useRef, useState } from 'react';
import { Camera, Download, Trash2, ChevronLeft, ChevronRight, Maximize2, X, Database, Image as ImageIcon } from 'lucide-react';

export default function BottomStrip({ snapshots, onCaptureSnapshot, onDeleteSnapshot, onClearSnapshots, onExportAll }) {
  const scrollRef = useRef(null);
  const [viewIdx, setViewIdx] = useState(null);
  const viewing = viewIdx !== null ? snapshots[viewIdx] : null;

  const scroll = (dir) => { if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' }); };

  return (
    <div className="w-full shrink-0 flex flex-col relative glass-panel border-t border-[#00f2ff11] bg-black/40">
      <div className="bit-background" />
      
      {/* Controls Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <Database size={16} className="text-[#00f2ff]" />
          <h4 className="stat-ticker text-xs">Media Database</h4>
          <span className="hud-badge text-[8px] bg-[#00f2ff0a]">{snapshots.length} SNAPS</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={onCaptureSnapshot} className="hud-btn px-4 py-2 rounded-xl text-[10px] flex items-center gap-2">
            <Camera size={14} /> CAPTURE SIGNAL
          </button>
          {snapshots.length > 0 && (
            <>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button onClick={onExportAll} className="p-2 rounded-xl text-[#00f2ff] hover:bg-[#00f2ff0a] transition-all" data-tooltip="Export Database">
                <Download size={18} />
              </button>
              <button onClick={onClearSnapshots} className="p-2 rounded-xl text-[#ff3c3c] hover:bg-red-500/10 transition-all" data-tooltip="Wipe Gallery">
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Gallery Strip */}
      <div className="relative group/gallery h-[120px]">
        {snapshots.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-30">
            <div className="flex items-center gap-3">
              <ImageIcon size={20} className="text-[#4a5068]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5068]">Awaiting Manual Capture... [Key_S]</span>
            </div>
          </div>
        ) : (
          <div className="h-full relative px-10 py-4">
            <button onClick={() => scroll(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 border border-white/5 text-[#00f2ff] opacity-0 group-hover/gallery:opacity-100 transition-opacity">
              <ChevronLeft size={20} />
            </button>
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto h-full no-scrollbar scroll-smooth px-2">
              {snapshots.map((snap, i) => (
                <div key={snap.id}
                  className="h-full shrink-0 rounded-2xl cursor-pointer relative overflow-hidden border border-white/5 hover:border-[#00f2ff44] transition-all group/item shadow-2xl"
                  style={{ width: 140 }}
                  onClick={() => setViewIdx(i)}>
                  
                  <img src={snap.dataURL} alt="" className="w-full h-full object-cover grayscale group-hover/item:grayscale-0 transition-all duration-500 scale-110 group-hover/item:scale-100" />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover/item:opacity-100 transition-opacity" />
                  
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                    <span className="font-mono text-[8px] font-bold text-[#e0e6ed] truncate uppercase">
                      {snap.matchedName || 'Subject_Unk'}
                    </span>
                    {snap.matchedName && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00ffaa] shadow-[0_0_8px_#00ffaa]" />
                    )}
                  </div>
                  
                  <div className="absolute inset-0 border border-[#00f2ff00] group-hover/item:border-[#00f2ff22] transition-colors rounded-2xl pointer-events-none" />
                </div>
              ))}
            </div>
            <button onClick={() => scroll(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 border border-white/5 text-[#00f2ff] opacity-0 group-hover/gallery:opacity-100 transition-opacity">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox 2.0 */}
      {viewing && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-[#02020588] backdrop-blur-2xl animate-fade-in" onClick={() => setViewIdx(null)} />
          
          <div className="relative max-w-5xl w-full glass-panel rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-glitch" onClick={e => e.stopPropagation()}>
            <div className="hud-corner hud-corner-tl" />
            <div className="hud-corner hud-corner-tr" />
            <div className="hud-corner hud-corner-bl" />
            <div className="hud-corner hud-corner-br" />
            
            <div className="flex flex-col">
               {/* Controls Header */}
               <div className="flex items-center justify-between p-6 border-b border-white/5">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <ImageIcon size={24} className="text-[#00f2ff]" />
                     </div>
                     <div className="flex flex-col">
                        <span className="stat-ticker text-sm text-[#00f2ff]">Data Inspection</span>
                        <span className="font-mono text-[9px] text-[#4a5068] uppercase tracking-[0.2em]">Capture_ID: {viewing.id}</span>
                     </div>
                  </div>
                  <button onClick={() => setViewIdx(null)} className="p-3 rounded-full hover:bg-white/5 text-[#ff3c3c] transition-all">
                     <X size={24} />
                  </button>
               </div>

               <div className="p-8 flex gap-8">
                  <div className="flex-1 relative group">
                     <img src={viewing.dataURL} alt="" className="w-full rounded-2xl border border-white/10 shadow-2xl" />
                     <div className="absolute top-4 left-4 hud-badge bg-black/60 rounded-lg">LIVE_PREVIEW_REPLICA</div>
                  </div>

                  <div className="w-80 flex flex-col gap-6">
                     <div className="glass-card p-6 rounded-2xl border-white/10">
                        <span className="font-mono text-[10px] text-[#4a5068] uppercase block mb-4 tracking-widest">Neural Identity</span>
                        <h2 className="text-3xl font-bold text-[#e0e6ed] mb-1" style={{ fontFamily: 'Rajdhani' }}>
                           {viewing.matchedName || 'SUBJECT_UNKNOWN'}
                        </h2>
                        <p className="font-mono text-[10px] text-[#00f2ff] opacity-60">Confidence: {viewing.confidence || 0}%</p>
                        
                        <div className="mt-4 flex items-center gap-2">
                           <div className={`px-3 py-1 rounded-sm text-[8px] font-bold tracking-widest ${viewing.matchedName ? 'bg-[#00ffaa11] text-[#00ffaa]' : 'bg-white/5 text-[#4a5068]'}`}>
                              {viewing.matchedName ? 'VERIFIED' : 'TEMP_FILE'}
                           </div>
                           <span className="font-mono text-[8px] text-[#4a5068]">{new Date(viewing.timestamp).toLocaleString()}</span>
                        </div>
                     </div>

                     <div className="flex-1 flex flex-col gap-2">
                        <button onClick={() => {}} className="hud-btn w-full py-4 rounded-2xl text-[10px] flex items-center justify-center gap-3">
                           <Download size={16} /> DOWNLOAD_SOURCE
                        </button>
                        <button onClick={() => { onDeleteSnapshot?.(viewIdx); setViewIdx(null); }} 
                           className="w-full py-4 rounded-2xl text-[10px] flex items-center justify-center gap-3 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all">
                           <Trash2 size={16} /> PERMANENT_PURGE
                        </button>
                     </div>

                     <div className="flex items-center justify-between gap-4">
                        <button onClick={() => setViewIdx(viewIdx > 0 ? viewIdx - 1 : viewIdx)} disabled={viewIdx === 0}
                           className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-[#00f2ff] disabled:opacity-20 transition-all flex-1 flex justify-center">
                           <ChevronLeft size={24} />
                        </button>
                        <button onClick={() => setViewIdx(viewIdx < snapshots.length - 1 ? viewIdx + 1 : viewIdx)} disabled={viewIdx === snapshots.length - 1}
                           className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-[#00f2ff] disabled:opacity-20 transition-all flex-1 flex justify-center">
                           <ChevronRight size={24} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
