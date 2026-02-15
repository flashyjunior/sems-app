export function parseDateRange(startStr: string, endStr: string): { start: Date; end: Date } {
  // Parse start and end. If endStr is a date-only string (YYYY-MM-DD), treat end as end-of-day exclusive
  const start = new Date(startStr);
  let end = new Date(endStr);

  // Detect date-only format: exactly YYYY-MM-DD
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(endStr);
  if (dateOnly) {
    // Make end exclusive: move to next day at 00:00
    end = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
  }

  return { start, end };
}
