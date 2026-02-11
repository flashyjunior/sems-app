type Ticket = { id: string; alertId: string; note?: string; createdAt: string };
const tickets: Ticket[] = [];

export default {
  create(alertId: string, note?: string) {
    const t = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, alertId, note, createdAt: new Date().toISOString() };
    tickets.push(t);
    return t;
  },
  listForAlert(alertId: string) {
    return tickets.filter(t => t.alertId === alertId);
  }
};
