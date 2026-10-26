export const uid = (prefix = '') =>
  prefix + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export function money(cents: number, opts: { free?: boolean } = {}) {
  if (cents === 0 && opts.free) return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

const DAY = 86400000;

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function fmtDate(iso: string, style: 'short' | 'long' | 'day' = 'short') {
  const d = new Date(iso);
  if (style === 'day') return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  if (style === 'long')
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** "Sat, Nov 2 · 7:00 PM", or "Today · 7:00 PM" */
export function fmtWhen(iso: string) {
  const d = new Date(iso);
  const today = startOfDay(new Date()).getTime();
  const day = startOfDay(d).getTime();
  let prefix = fmtDate(iso, 'day');
  if (day === today) prefix = 'Today';
  else if (day === today + DAY) prefix = 'Tomorrow';
  return `${prefix} · ${fmtTime(iso)}`;
}

export function fmtRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (startOfDay(s).getTime() === startOfDay(e).getTime()) {
    return `${fmtDate(start, 'long')} · ${fmtTime(start)} – ${fmtTime(end)}`;
  }
  return `${fmtDate(start, 'long')}, ${fmtTime(start)} – ${fmtDate(end, 'long')}, ${fmtTime(end)}`;
}

export function inDateRange(iso: string, filter: string, custom?: string) {
  const d = new Date(iso).getTime();
  const now = new Date();
  const today = startOfDay(now).getTime();
  const dow = now.getDay(); // 0 sun
  switch (filter) {
    case 'today':
      return d >= today && d < today + DAY;
    case 'tomorrow':
      return d >= today + DAY && d < today + 2 * DAY;
    case 'weekend': {
      // Friday 00:00 through end of Sunday for the current (or upcoming) weekend
      const offset = dow === 6 ? -1 : dow === 0 ? -2 : 5 - dow;
      const start = today + offset * DAY;
      return d >= Math.max(start, today) && d < start + 3 * DAY;
    }
    case 'week': {
      const end = today + (7 - dow) * DAY + DAY;
      return d >= today && d < end;
    }
    case 'next-week': {
      const start = today + (7 - dow + 1) * DAY;
      return d >= start && d < start + 7 * DAY;
    }
    case 'month': {
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
      return d >= today && d < end;
    }
    case 'custom': {
      if (!custom) return true;
      const c = new Date(custom + 'T00:00:00').getTime();
      return d >= c && d < c + DAY;
    }
    default:
      return true;
  }
}

/** Not a real hash — just keeps plaintext out of localStorage in this demo. */
export function hashPassword(pw: string) {
  let h = 2166136261;
  for (let i = 0; i < pw.length; i++) {
    h ^= pw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'h' + (h >>> 0).toString(16);
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
