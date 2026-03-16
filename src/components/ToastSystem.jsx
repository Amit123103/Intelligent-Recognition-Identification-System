import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((type, title, message) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, type, title, message, removing: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, 4000);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
  }, []);
  return { toasts, addToast, removeToast };
}

const ICONS = {
  success: { Icon: CheckCircle, color: '#00ff88', bgColor: 'rgba(0,255,136,0.08)', borderColor: 'rgba(0,255,136,0.2)' },
  error: { Icon: AlertCircle, color: '#ff2b2b', bgColor: 'rgba(255,43,43,0.08)', borderColor: 'rgba(255,43,43,0.2)' },
  warning: { Icon: AlertTriangle, color: '#ffaa00', bgColor: 'rgba(255,170,0,0.08)', borderColor: 'rgba(255,170,0,0.2)' },
  info: { Icon: Info, color: '#00e5ff', bgColor: 'rgba(0,229,255,0.08)', borderColor: 'rgba(0,229,255,0.2)' },
};

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-16 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 360 }}>
      {toasts.map(toast => {
        const { Icon, color, bgColor, borderColor } = ICONS[toast.type] || ICONS.info;
        return (
          <div key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl ${toast.removing ? 'animate-slide-out' : 'animate-slide-in'}`}
            style={{
              background: `linear-gradient(135deg, ${bgColor}, rgba(13,13,20,0.95))`,
              border: `1px solid ${borderColor}`,
              backdropFilter: 'blur(16px)',
              boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 12px ${color}10`,
            }}>
            <div className="shrink-0 mt-0.5" style={{ filter: `drop-shadow(0 0 4px ${color}50)` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold tracking-wider" style={{ fontFamily: "'Rajdhani',sans-serif", color,
                textShadow: `0 0 8px ${color}30` }}>
                {toast.title}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#8890a8', fontFamily: "'JetBrains Mono',monospace" }}>
                {toast.message}
              </p>
            </div>
            <button onClick={() => removeToast(toast.id)}
              className="cursor-pointer shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity">
              <X size={14} style={{ color: '#4a5068' }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
