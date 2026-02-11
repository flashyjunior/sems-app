import { useEffect, useRef } from 'react';

export const useRiskSSE = (onMessage: (payload: any) => void, enabled = true) => {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const url = `/api/analytics/stream/risk-alerts`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onMessage(data);
      } catch (e) {
        // ignore
      }
    };

    es.onerror = () => {
      // reconnect handled by browser EventSource; cleanup on unmount
    };

    return () => {
      try { es.close(); } catch (e) {}
      esRef.current = null;
    };
  }, [onMessage, enabled]);
};

export default useRiskSSE;
