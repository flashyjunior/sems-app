"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: string; message: string; kind: ToastKind; durationMs: number };

type ToastContextValue = {
  showToast: (message: string, kind?: ToastKind, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Record<string, { timeoutId: number; startTime: number; remainingMs: number }>>({});

  const removeToast = useCallback((id: string) => {
    // clear timer if exists
    const info = timersRef.current[id];
    if (info) {
      clearTimeout(info.timeoutId);
      delete timersRef.current[id];
    }
    setToasts((curr) => curr.filter(x => x.id !== id));
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind = 'info', durationMs = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const t: Toast = { id, message, kind, durationMs };
    setToasts((prev) => [t, ...prev]);

    const timeoutId = window.setTimeout(() => removeToast(id), durationMs);
    timersRef.current[id] = { timeoutId, startTime: Date.now(), remainingMs: durationMs };
  }, [removeToast]);

  // pause/resume helpers
  const pauseToast = useCallback((id: string) => {
    const info = timersRef.current[id];
    if (!info) return;
    // clear existing timeout
    clearTimeout(info.timeoutId);
    const elapsed = Date.now() - info.startTime;
    info.remainingMs = Math.max(0, info.remainingMs - elapsed);
    // mark toast as paused (so UI can set animation-play-state)
    setToasts((prev) => prev.map(t => t.id === id ? { ...t } : t));
    // we don't need to store paused flag on toast object; we'll derive animation pause from timersRef
  }, []);

  const resumeToast = useCallback((id: string) => {
    const info = timersRef.current[id];
    if (!info) return;
    info.startTime = Date.now();
    const timeoutId = window.setTimeout(() => removeToast(id), info.remainingMs);
    info.timeoutId = timeoutId;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => {
          const timerInfo = timersRef.current[t.id];
          const isPaused = !!timerInfo && timerInfo.remainingMs !== undefined && timerInfo.remainingMs !== t.durationMs && timerInfo.remainingMs > 0 && typeof timerInfo.timeoutId === 'number' && false; // not used for now
          return (
            <div key={t.id} onMouseEnter={() => pauseToast(t.id)} onMouseLeave={() => resumeToast(t.id)} role={t.kind === 'error' ? 'alert' : 'status'} aria-live={t.kind === 'error' ? 'assertive' : 'polite'} aria-atomic="true" style={{ minWidth: 240, maxWidth: 420, padding: '0.6rem 0.8rem', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', backgroundColor: t.kind === 'error' ? '#fdecea' : t.kind === 'success' ? '#e9f7ef' : '#eef6ff', color: t.kind === 'error' ? '#8b1e1e' : t.kind === 'success' ? '#08512b' : '#0b3a66', overflow: 'hidden', transform: 'translateY(0)', animation: 'toast-in 240ms ease' }}>
              <div style={{ fontSize: '0.95rem', paddingBottom: 8 }}>{t.message}</div>
              <div style={{ height: 4, width: '100%', background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: 4, background: t.kind === 'error' ? '#f1b0ad' : t.kind === 'success' ? '#8adea3' : '#9fc9ff', width: '100%', transformOrigin: 'left', animation: `toast-progress ${t.durationMs}ms linear forwards`, animationPlayState: timersRef.current[t.id] && timersRef.current[t.id].remainingMs !== undefined && timersRef.current[t.id].remainingMs !== t.durationMs ? 'paused' : 'running' }} />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.showToast;
};

export default ToastProvider;
