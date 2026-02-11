type Webhook = { id: string; url: string; secret?: string };

const webhooks: Webhook[] = [];

export default {
  list() {
    return webhooks.slice();
  },
  register(w: Webhook) {
    webhooks.push(w);
    return w;
  },
  unregister(id: string) {
    const idx = webhooks.findIndex(x => x.id === id);
    if (idx >= 0) webhooks.splice(idx, 1);
  },
  async dispatch(payload: any) {
    // best-effort dispatch; don't block callers
    const tasks = webhooks.map(async (w) => {
      try {
        await fetch(w.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.warn('failed webhook', w.url, e);
      }
    });
    await Promise.allSettled(tasks);
  }
};
