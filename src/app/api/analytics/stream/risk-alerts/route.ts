import { NextRequest } from 'next/server';
import bus from '@/lib/alert-bus';

export async function GET(req: NextRequest) {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const stream = new ReadableStream({
    start(controller) {
      // send a comment to open the stream
      controller.enqueue(new TextEncoder().encode(':ok\n\n'));

      const sendEvent = (payload: any) => {
        try {
          const data = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        } catch (e) {
          // ignore
        }
      };

      const unsub = bus.subscribe(sendEvent);

      // keep alive ping
      const keepAlive = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(':ping\n\n'));
      }, 25000);

      // on cancel
      controller.close = (() => {
        return () => {
          clearInterval(keepAlive);
          unsub();
        };
      })();
    }
  });

  return new Response(stream, { headers });
}
