type Client = {
  id: string;
  send: (data: string) => void;
};

const clients: Client[] = [];

export function registerClient(id: string, send: (data: string) => void) {
  clients.push({ id, send });
}

export function unregisterClient(id: string) {
  const idx = clients.findIndex(c => c.id === id);
  if (idx >= 0) clients.splice(idx, 1);
}

export function broadcast(payload: any) {
  const s = JSON.stringify(payload);
  clients.forEach(c => {
    try { c.send(s); } catch (e) { /* ignore */ }
  });
}

export function clientCount() {
  return clients.length;
}

export default { registerClient, unregisterClient, broadcast, clientCount };
