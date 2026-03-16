import React, { useRef, useState } from 'react';
import { Upload, Pencil, X, Check, Database, Target, Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX, Activity } from 'lucide-react';

export default function LeftPanel({ enrolledFaces, onEnroll, onDeleteFace, onRenameFace, onClearAll,
  sourceMode, videoRef, isPlaying, onPlay, onPause, onStop, onSeek, playbackSpeed, onSpeedChange,
  volume, onVolumeChange, muted, onMuteToggle, videoDuration, currentTime }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [flashError, setFlashError] = useState(false);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onEnroll(e.target.result, (err) => {
        if (err) {
          setEnrollError(err);
          setFlashError(true);
          setTimeout(() => { setFlashError(false); setEnrollError(''); }, 3000);
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };
  const startEdit = (face) => { setEditingId(face.id); setEditName(face.name); };
  const saveEdit = (id) => { onRenameFace(id, editName); setEditingId(null); };

  const fmtTime = (s) => {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };
  const speeds = [0.5, 1, 2, 4];

  return (
    <div className="w-80 shrink-0 h-full flex flex-col relative overflow-hidden glass-panel border-r border-[#00f2ff11]">
      <div className="bit-background" />
      
      {/* HEADER SECTION */}
      <div className="p-5 border-b border-[#00f2ff11] relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-[#00f2ff]" />
            <h3 className="stat-ticker text-xs">Target Acquisition</h3>
          </div>
          <div className="hud-badge text-[8px]">{enrolledFaces.length}/20 DB_SLOTS</div>
        </div>

        {/* Neural Drop Zone */}
        <div className={`relative group p-6 rounded-2xl border border-dashed transition-all duration-300 flex flex-col items-center gap-3 cursor-pointer
          ${dragOver ? 'border-[#00f2ff] bg-[#00f2ff0a]' : 'border-white/10 hover:border-white/20 bg-black/20'}
          ${flashError ? 'animate-glitch border-red-500 bg-red-500/10' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}>
          
          <div className="hud-corner-tl w-2 h-2 border-t border-l border-[#00f2ff44] absolute top-2 left-2" />
          <div className="hud-corner-br w-2 h-2 border-b border-r border-[#00f2ff44] absolute bottom-2 right-2" />
          
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Target size={18} className="text-[#e0e6ed] opacity-40 group-hover:opacity-100" />
          </div>
          
          <div className="text-center">
            <span className="font-mono text-[9px] text-[#00f2ff] block tracking-tighter">INITIATE FACIAL UPLOAD</span>
            <span className="font-mono text-[7px] text-[#4a5068] block mt-1 uppercase">Drop Signal or Click</span>
          </div>
          
          <input id="left-face-input" name="left-face-input" ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />
        </div>
        {enrollError && <p className="font-mono text-[8px] mt-2 text-[#ff3c3c] animate-glitch">! SYST_ERR: {enrollError.toUpperCase()}</p>}
      </div>

      {/* ENROLLED FACES LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
        {enrolledFaces.map((face, i) => (
          <div key={face.id} className="glass-card rounded-2xl p-3 flex items-start gap-4 animate-float-up border border-white/5 group hover:border-[#00f2ff33]"
            style={{ animationDelay: `${i * 100}ms` }}>
            
            <div className="relative shrink-0">
              <img src={face.thumbnail} alt={face.name} className="w-14 h-14 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all duration-500 border border-white/10" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#020205] border border-white/10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: face.lastSeen ? '#00ffaa' : '#4a5068' }} />
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                {editingId === face.id ? (
                  <div className="flex items-center gap-1 w-full">
                    <input id={`edit-face-${face.id}`} name={`edit-face-${face.id}`} value={editName} onChange={e => setEditName(e.target.value)}
                      className="flex-1 bg-black/40 border border-[#00f2ff33] text-[10px] px-2 py-0.5 rounded font-mono outline-none"
                      onKeyDown={e => e.key === 'Enter' && saveEdit(face.id)} autoFocus />
                    <button onClick={() => saveEdit(face.id)} className="text-[#00ffaa] hover:scale-110 transition-transform"><Check size={12} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-bold text-xs text-[#e0e6ed] truncate uppercase tracking-widest" style={{ fontFamily: 'Rajdhani' }}>{face.name}</span>
                    <button onClick={() => startEdit(face)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#00f2ff]"><Pencil size={10} /></button>
                  </div>
                )}
                <button onClick={() => onDeleteFace(face.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#ff3c3c] hover:scale-110"><X size={12} /></button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#00f2ff33] to-[#00f2ff] shadow-[0_0_8px_#00f2ff66] transition-all duration-700" 
                    style={{ width: `${Math.round(face.confidence * 100)}%` }} />
                </div>
                <span className="font-mono text-[8px] text-[#00f2ff]">{Math.round(face.confidence * 100)}%</span>
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-[7px] text-[#4a5068] uppercase tracking-tighter">SIG_MATCHES: {face.matchCount}</span>
                <span className="font-mono text-[7px] text-[#4a5068]">{face.lastSeen ? new Date(face.lastSeen).toLocaleTimeString([], { hour12: false }) : '---'}</span>
              </div>
            </div>
          </div>
        ))}
        
        {enrolledFaces.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center text-center opacity-20">
            <div className="w-12 h-12 border border-dashed border-[#00f2ff] rounded-full animate-orbit mb-4 flex items-center justify-center">
              <Database size={16} className="text-[#00f2ff]" />
            </div>
            <p className="font-mono text-[8px] uppercase tracking-widest text-[#00f2ff]">Neural Database Empty</p>
          </div>
        )}
      </div>

      {enrolledFaces.length > 0 && (
        <div className="p-4 border-t border-white/5 bg-black/40">
          <button onClick={onClearAll} className="w-full py-2.5 hud-btn hud-btn-danger rounded-xl text-[9px] flex items-center justify-center gap-2">
            <X size={12} /> PURGE DATABASE
          </button>
        </div>
      )}

      {/* TACTICAL VIDEO CONTROLS */}
      {sourceMode === 'recording' && videoRef?.current && (
        <div className="p-5 border-t border-[#00f2ff11] bg-black/60 relative">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-[#ffcc00]" />
            <h4 className="stat-ticker text-[10px]">Signal Playback</h4>
          </div>
          
          <div className="flex items-center justify-between gap-1 mb-4">
            <button onClick={() => onSeek(-5)} className="hud-btn p-2 rounded-lg flex-1 flex justify-center"><SkipBack size={14} /></button>
            <button onClick={isPlaying ? onPause : onPlay} className="hud-btn hud-btn-active p-2 rounded-lg flex-[1.5] flex justify-center">
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button onClick={onStop} className="hud-btn p-2 rounded-lg flex-1 flex justify-center text-[#ff3c3c]"><Square size={14} /></button>
            <button onClick={() => onSeek(5)} className="hud-btn p-2 rounded-lg flex-1 flex justify-center"><SkipForward size={14} /></button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-mono text-[8px] opacity-40">
                <span>{fmtTime(currentTime)}</span>
                <span>{fmtTime(videoDuration)}</span>
              </div>
              <input id="left-seek" name="left-seek" type="range" min="0" max={videoDuration || 0} step="0.1" value={currentTime}
                onChange={(e) => { if(videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value); }}
                className="w-full accent-[#00f2ff]" />
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={onMuteToggle} className="text-[#00f2ff] hover:scale-110 transition-transform">
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input id="left-volume" name="left-volume" type="range" min="0" max="1" step="0.05" value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))} className="flex-1 accent-[#00f2ff]" />
            </div>

            <div className="flex gap-1.5">
              {speeds.map(s => (
                <button key={s} onClick={() => onSpeedChange(s)}
                  className={`flex-1 py-1 rounded-md font-mono text-[8px] transition-all border ${playbackSpeed === s ? 'bg-[#00f2ff33] border-[#00f2ff] text-[#00f2ff]' : 'bg-white/5 border-transparent text-[#4a5068]'}`}>
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
