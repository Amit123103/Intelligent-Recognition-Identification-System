import React, { useRef, useEffect } from 'react';
import { Download, Trash2, Terminal, Filter, Layers, ListFilter } from 'lucide-react';
import { formatTime } from '../utils/constants.js';

const FILTERS = ['ALL', 'MATCHES', 'UNKNOWN', 'ALERTS'];
const SORTS = ['NEWEST', 'OLDEST', 'CONFIDENCE'];
const CLASS_COLORS = { MATCH: '#00ffaa', LIKELY: '#aaff44', POSSIBLE: '#ffcc00', UNKNOWN: '#4a5068' };
const SOURCE_COLORS = { cctv: '#00ffaa', drone: '#00f2ff', recording: '#ffcc00' };

export default function RightPanel({ log, filter, sort, onFilterChange, onSortChange, onClearLog, onExportCSV, onExportJSON }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && sort === 'NEWEST') scrollRef.current.scrollTop = 0;
  }, [log.length, sort]);

  const filtered = log.filter(e => {
    if (filter === 'ALL') return true;
    if (filter === 'MATCHES') return e.classification === 'MATCH' || e.classification === 'LIKELY';
    if (filter === 'UNKNOWN') return e.classification === 'UNKNOWN';
    if (filter === 'ALERTS') return e.isAlert;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'NEWEST') return b.timestamp - a.timestamp;
    if (sort === 'OLDEST') return a.timestamp - b.timestamp;
    if (sort === 'CONFIDENCE') return b.confidence - a.confidence;
    return 0;
  });

  return (
    <div className="w-80 shrink-0 h-full flex flex-col relative overflow-hidden glass-panel border-l border-[#00f2ff11]">
      <div className="bit-background" />
      
      {/* HEADER SECTION */}
      <div className="p-5 border-b border-[#00f2ff11] relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-[#00f2ff]" />
            <h3 className="stat-ticker text-xs text-[#00f2ff]">Neural Net Log</h3>
          </div>
          <div className="flex gap-1">
            <button onClick={onExportJSON} className="p-1.5 rounded-lg hover:bg-white/5 transition-all text-[#00f2ff] opacity-60 hover:opacity-100" data-tooltip="JSON Export">
              <span className="font-mono text-[9px] font-bold">JSON</span>
            </button>
            <button onClick={onClearLog} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all text-[#ff3c3c] opacity-60 hover:opacity-100" data-tooltip="Purge Log">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Filter & Sort Stack */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
            {FILTERS.map(f => (
              <button key={f} onClick={() => onFilterChange(f)}
                className={`flex-1 py-1.5 text-[8px] font-bold tracking-[0.2em] rounded-lg transition-all
                  ${filter === f ? 'bg-[#00f2ff11] text-[#00f2ff] shadow-[0_0_10px_#00f2ff22] border border-[#00f2ff33]' : 'text-[#4a5068] hover:text-[#e0e6ed]'}`}>
                {f}
              </button>
            ))}
          </div>
          
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <ListFilter size={10} className="text-[#4a5068]" />
              <span className="font-mono text-[7px] text-[#4a5068] uppercase tracking-widest">Ordered By</span>
            </div>
            <select id="log-sort-select" name="log-sort-select" value={sort} onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent font-mono text-[8px] text-[#00f2ff] outline-none cursor-pointer uppercase tracking-tighter">
              {SORTS.map(s => <option key={s} value={s} className="bg-[#020205]">{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* LOG ENTRIES */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 py-4 space-y-1.5 no-scrollbar">
        {sorted.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center text-center opacity-20">
            <div className="w-12 h-12 border border-dashed border-[#00f2ff] rounded-full animate-orbit mb-4 flex items-center justify-center">
              <Layers size={16} className="text-[#00f2ff]" />
            </div>
            <p className="font-mono text-[8px] uppercase tracking-widest text-[#00f2ff]">No Signal Logged</p>
          </div>
        )}
        
        {sorted.map((entry, i) => (
          <div key={entry.id} className="relative group px-4 py-3 border-y border-transparent hover:border-white/5 hover:bg-white/5 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[8px] text-[#4a5068]">{formatTime(entry.timestamp)}</span>
              <div className="flex items-center gap-1.5">
                <div className="hud-badge text-[7px] rounded-sm" style={{ color: CLASS_COLORS[entry.classification], borderColor: `${CLASS_COLORS[entry.classification]}33` }}>
                  {entry.classification}
                </div>
                {entry.isAlert && <div className="w-1.5 h-1.5 bg-[#ff3c3c] rounded-full animate-pulse shadow-[0_0_8px_#ff3c3c]" />}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="hud-corner-tl w-1.5 h-1.5 border-t border-l border-[#00f2ff44] absolute -top-1 -left-1" />
                <div className="hud-corner-br w-1.5 h-1.5 border-b border-r border-[#00f2ff44] absolute -bottom-1 -right-1" />
                <img src={entry.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all border border-white/5" />
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-[11px] truncate uppercase tracking-widest ${entry.matchedName ? 'text-[#e0e6ed]' : 'text-[#4a5068]'}`} style={{ fontFamily: 'Rajdhani' }}>
                    {entry.matchedName || 'Subj_Unknown'}
                  </span>
                  <span className="font-mono text-[9px] text-[#00f2ff]">{entry.confidence}%</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-700" 
                      style={{ 
                        width: `${entry.confidence}%`,
                        background: entry.confidence >= 80 ? '#00ffaa' : entry.confidence >= 60 ? '#ffcc00' : '#ff3c3c',
                        boxShadow: `0 0 4px ${entry.confidence >= 80 ? '#00ffaa66' : entry.confidence >= 60 ? '#ffcc0066' : '#ff3c3c66'}`
                      }} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-0.5">
                   <div className="flex items-center gap-2 font-mono text-[7px] text-[#4a5068]">
                      <span className="uppercase">Dist: {entry.distance?.toFixed(3)}</span>
                      {entry.zone && <span className="text-[#ffcc00] border-l border-white/10 pl-2">ZONE: {entry.zone.toUpperCase()}</span>}
                   </div>
                   <span className="font-mono text-[7px] text-[#00f2ff] opacity-40 uppercase">{entry.source}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
