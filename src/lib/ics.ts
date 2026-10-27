import type { EventItem } from './types';

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

export function downloadIcs(e: EventItem) {
  const where = e.format === 'online' ? 'Online' : `${e.venue?.name}, ${e.venue?.address}`;
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ravers//Events//EN',
    'BEGIN:VEVENT',
    `UID:${e.id}@ravers`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc(e.summary)}`,
    `LOCATION:${esc(where)}`,
    `URL:${location.origin}/e/${e.id}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  a.download = `${e.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function googleCalendarUrl(e: EventItem) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${stamp(e.start)}/${stamp(e.end)}`,
    details: e.summary,
    location: e.format === 'online' ? 'Online' : `${e.venue?.name}, ${e.venue?.address}`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
