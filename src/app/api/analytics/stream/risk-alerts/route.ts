import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import analyticsSSE from '@/lib/analytics-sse';

export async function GET(req: NextRequest) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const clientId = uuidv4();

  function sendEvent(data: string) {
    const payload = `data: ${data}\n\n`;
    writer.write(new TextEncoder().encode(payload));
  }

  analyticsSSE.registerClient(clientId, (data: string) => sendEvent(data));

  // Heartbeat
  const hb = setInterval(() => {
    try { sendEvent(JSON.stringify({ type: 'heartbeat', ts: Date.now() })); } catch (e) {}
  }, 15000);

  // When the stream is closed, unregister
  (req as any).signal.addEventListener('abort', () => {
    clearInterval(hb);
    analyticsSSE.unregisterClient(clientId);
    try { writer.close(); } catch (e) {}
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
