type AlertPayload = any;

class AlertBus {
  listeners: Set<(payload: AlertPayload) => void> = new Set();

  subscribe(fn: (payload: AlertPayload) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(payload: AlertPayload) {
    for (const l of Array.from(this.listeners)) {
      try {
        l(payload);
      } catch (e) {
        console.warn('alert-bus listener error', e);
      }
    }
    // also attempt to dispatch to registered webhooks if available
    try {
      // dynamic import to avoid circular deps in serverless contexts
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const webhooks = require('./webhooks').default;
      if (webhooks && typeof webhooks.dispatch === 'function') {
        webhooks.dispatch(payload).catch((e: any) => console.warn('webhook dispatch failed', e));
      }
    } catch (e) {
      // ignore
    }
  }
}

const bus = new AlertBus();
export default bus;
