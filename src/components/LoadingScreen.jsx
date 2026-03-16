import React from 'react';
import { Loader, CheckCircle, XCircle, Shield } from 'lucide-react';

const MODEL_NAMES = ['Tiny Face Detector', 'Face Landmarks 68', 'Face Recognition', 'SSD MobileNet v1'];

export default function LoadingScreen({ modelStatus, loadingTime, onRetry, fadeOut }) {
  const loaded = modelStatus.filter(s => s === 'loaded').length;
  const hasError = modelStatus.some(s => s === 'error');
  const allDone = loaded === 4;
  const pct = Math.round((loaded / 4) * 100);

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center grid-bg ${fadeOut ? 'animate-fade-out' : ''}`}
      style={{ background: '#05050a' }}>
      <div className="loading-panel flex flex-col items-center gap-6 p-10 rounded-2xl" style={{ minWidth: 440 }}>
        
        {/* Radar spinner */}
        <div className="relative w-28 h-28">
          <div className="absolute inset-0 rounded-full" style={{ border: '1px solid rgba(0,229,255,0.15)' }} />
          <div className="absolute inset-3 rounded-full" style={{ border: '1px solid rgba(0,229,255,0.1)' }} />
          <div className="absolute inset-6 rounded-full" style={{ border: '1px solid rgba(0,229,255,0.08)' }} />
          <div className="absolute inset-9 rounded-full" style={{ border: '1px solid rgba(0,229,255,0.05)' }} />
          {!allDone && (
            <>
              <div className="absolute inset-0 animate-radar-spin"
                style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,229,255,0.35) 45deg, transparent 90deg)', borderRadius: '50%' }} />
              <div className="absolute inset-0 animate-radar-ping rounded-full"
                style={{ border: '1px solid rgba(0,229,255,0.2)' }} />
            </>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            {allDone ? (
              <Shield size={36} color="#00ff88" style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.5))' }} />
            ) : (
              <div className="w-3 h-3 rounded-full" style={{ background: '#00e5ff', boxShadow: '0 0 12px rgba(0,229,255,0.6)' }} />
            )}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-[0.2em]"
            style={{ fontFamily: "'Rajdhani',sans-serif", color: allDone ? '#00ff88' : '#00e5ff',
              textShadow: allDone ? '0 0 20px rgba(0,255,136,0.4)' : '0 0 20px rgba(0,229,255,0.3)' }}>
            {allDone ? 'SYSTEM ONLINE' : 'INITIALIZING SENTINEL'}
          </h2>
          <p className="text-xs mt-1" style={{ color: '#4a5068', fontFamily: "'JetBrains Mono',monospace" }}>
            {allDone ? 'All systems operational' : 'Loading neural network models...'}
          </p>
        </div>

        {/* Model rows */}
        <div className="w-full flex flex-col gap-2">
          {MODEL_NAMES.map((name, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2 rounded-lg animate-float-up"
              style={{ background: 'rgba(18,18,28,0.6)', border: '1px solid rgba(0,229,255,0.06)',
                animationDelay: `${i * 100}ms` }}>
              <span className="text-sm" style={{ fontFamily: "'JetBrains Mono',monospace", color: modelStatus[i] === 'loaded' ? '#8890a8' : '#e8eaf0' }}>
                {name}
              </span>
              <span>
                {modelStatus[i] === 'loading' && <Loader size={16} className="animate-spin" style={{ color: '#00e5ff', filter: 'drop-shadow(0 0 4px rgba(0,229,255,0.5))' }} />}
                {modelStatus[i] === 'loaded' && <CheckCircle size={16} style={{ color: '#00ff88', filter: 'drop-shadow(0 0 4px rgba(0,255,136,0.5))' }} />}
                {modelStatus[i] === 'error' && <XCircle size={16} style={{ color: '#ff2b2b', filter: 'drop-shadow(0 0 4px rgba(255,43,43,0.5))' }} />}
                {modelStatus[i] === 'pending' && <div className="w-4 h-4 rounded-full shimmer" style={{ background: '#1a1a28' }} />}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full progress-bar">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex items-center justify-between w-full text-xs" style={{ fontFamily: "'JetBrains Mono',monospace", color: '#4a5068' }}>
          <span>{pct}% loaded</span>
          <span>{loadingTime.toFixed(1)}s elapsed</span>
        </div>

        {hasError && (
          <button onClick={onRetry} className="btn-danger px-6 py-2.5 rounded-lg font-bold text-sm tracking-wider">
            RETRY LOAD
          </button>
        )}
      </div>
    </div>
  );
}
