import { useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { CATEGORIES, CITIES, PALETTES, PATTERN_COUNT, REFUND_POLICIES } from '../../lib/constants';
import { fmtDate, toLocalInput, uid } from '../../lib/format';
import type { CategoryId, EventItem, RefundPolicy, TicketType } from '../../lib/types';
import EventCard from '../../components/EventCard';
import { useToast } from '../../components/Toast';
import { NotFound } from '../Static';

function blankEvent(organizerId: string, city: string): EventItem {
  const start = new Date();
  start.setDate(start.getDate() + 14);
  start.setHours(19, 0, 0, 0);
  const end = new Date(start.getTime() + 3 * 3600000);
  return {
    id: uid('ev-'),
    title: '',
    summary: '',
    description: '',
    category: 'music',
    tags: [],
    organizerId,
    start: start.toISOString(),
    end: end.toISOString(),
    format: 'venue',
    venue: { name: '', address: '', city },
    city,
    cover: { kind: 'poster', palette: Math.floor(Math.random() * PALETTES.length), pattern: Math.floor(Math.random() * PATTERN_COUNT) },
    tickets: [{ id: uid('t-'), name: 'General admission', price: 0, quantity: 100, sold: 0, maxPerOrder: 10 }],
    promoCodes: [],
    refundPolicy: '7days',
    agenda: [],
    status: 'draft',
    createdAt: new Date().toISOString(),
    views: 0,
  };
}

const SECTIONS = [
  ['basics', 'Basics'],
  ['location', 'Location'],
  ['when', 'Date & time'],
  ['details', 'Details'],
  ['tickets', 'Tickets'],
] as const;

export default function EventEditor() {
  const { id } = useParams();
  const { db, myOrganizer, saveEvent } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const existing = id ? db.events.find((e) => e.id === id) : undefined;
  const [ev, setEv] = useState<EventItem>(() => existing ?? blankEvent(myOrganizer!.id, db.city));
  const [tagText, setTagText] = useState(ev.tags.join(', '));
  const [errors, setErrors] = useState<string[]>([]);
  const [promo, setPromo] = useState({ code: '', percentOff: 10, limit: '' });

  if (id && (!existing || existing.organizerId !== myOrganizer?.id)) return <NotFound />;

  const patch = (p: Partial<EventItem>) => setEv((e) => ({ ...e, ...p }));
  const patchTicket = (tid: string, p: Partial<TicketType>) =>
    setEv((e) => ({ ...e, tickets: e.tickets.map((t) => (t.id === tid ? { ...t, ...p } : t)) }));

  const onImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast('Image is too large — keep it under 1.5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => patch({ cover: { kind: 'image', src: String(reader.result) } });
    reader.readAsDataURL(file);
  };

  const validate = (publishing: boolean) => {
    const errs: string[] = [];
    if (!ev.title.trim()) errs.push('Give your event a title.');
    if (new Date(ev.end) <= new Date(ev.start)) errs.push('The event has to end after it starts.');
    if (publishing) {
      if (!ev.summary.trim()) errs.push('Add a one-line summary.');
      if (ev.format === 'venue' && (!ev.venue?.name.trim() || !ev.venue?.address.trim())) errs.push('Add a venue name and address.');
      if (ev.format === 'online' && !/^https?:\/\//.test(ev.onlineUrl ?? '')) errs.push('Add a link for the online event (starting with https://).');
      if (new Date(ev.start) < new Date()) errs.push('The start date is in the past.');
      if (ev.tickets.length === 0) errs.push('Add at least one ticket type.');
    }
    ev.tickets.forEach((t) => {
      if (!t.name.trim()) errs.push('Every ticket type needs a name.');
      if (t.quantity < t.sold) errs.push(`${t.name}: quantity can’t be lower than the ${t.sold} already sold.`);
    });
    return errs;
  };

  const save = (status: EventItem['status']) => {
    const errs = validate(status === 'published');
    setErrors(errs);
    if (errs.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const final: EventItem = {
      ...ev,
      status,
      title: ev.title.trim(),
      tags: tagText
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
      city: ev.format === 'online' ? 'Online' : ev.venue?.city ?? db.city,
      venue: ev.format === 'online' ? undefined : ev.venue,
      onlineUrl: ev.format === 'online' ? ev.onlineUrl : undefined,
      agenda: ev.agenda.filter((a) => a.title.trim()),
    };
    saveEvent(final);
    toast(status === 'published' ? 'Your event is live' : 'Draft saved', { to: `/e/${final.id}`, label: 'View' });
    nav(`/organizer/events/${final.id}`);
  };

  const addPromo = () => {
    const code = promo.code.trim().toUpperCase().replace(/\s+/g, '');
    if (!code || ev.promoCodes.some((p) => p.code === code)) return;
    patch({
      promoCodes: [...ev.promoCodes, { code, percentOff: Math.min(100, Math.max(1, promo.percentOff)), uses: 0, limit: promo.limit ? +promo.limit : undefined }],
    });
    setPromo({ code: '', percentOff: 10, limit: '' });
  };

  const preview: EventItem = { ...ev, title: ev.title || 'Your event title', city: ev.format === 'online' ? 'Online' : ev.venue?.city ?? '' };

  return (
    <div className="wrap">
      <div className="manage-head">
        <div>
          <nav className="crumbs mono">
            <Link to="/organizer/events">Your events</Link> / {existing ? 'Edit' : 'New'}
          </nav>
          <h1 className="page-title" style={{ marginTop: 8 }}>
            {existing ? 'Edit event' : 'Create an event'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn ghost" onClick={() => save(ev.status === 'published' ? 'published' : 'draft')}>
            {ev.status === 'published' ? 'Save changes' : 'Save draft'}
          </button>
          {ev.status !== 'published' && (
            <button className="btn accent" onClick={() => save('published')}>
              Publish
            </button>
          )}
          {ev.status === 'published' && (
            <button className="btn ghost" onClick={() => save('draft')}>
              Unpublish
            </button>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="banner" role="alert">
          <b>Fix these before saving:</b>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="editor">
        <nav className="editor-nav mono">
          {SECTIONS.map(([sid, label], i) => (
            <a key={sid} href={`#${sid}`}>
              {String(i + 1).padStart(2, '0')} {label}
            </a>
          ))}
        </nav>

        <div className="editor-main">
          <section id="basics" className="editor-section">
            <h2>Basics</h2>
            <label className="field">
              <span>Event title</span>
              <input className="input" value={ev.title} maxLength={90} onChange={(e) => patch({ title: e.target.value })} placeholder="Be specific — “Natural Wine 101” beats “Wine Night”" />
            </label>
            <label className="field">
              <span>Summary</span>
              <input className="input" value={ev.summary} maxLength={140} onChange={(e) => patch({ summary: e.target.value })} placeholder="One line that tells people why they should come" />
              <small>{140 - ev.summary.length} characters left</small>
            </label>
            <div className="two">
              <label className="field">
                <span>Category</span>
                <select className="select" value={ev.category} onChange={(e) => patch({ category: e.target.value as CategoryId })}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Tags</span>
                <input className="input" value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="jazz, late night, brooklyn" />
                <small>Comma separated</small>
              </label>
            </div>
            <div className="field">
              <span>Cover</span>
              <div className="cover-picker">
                <div className="swatches">
                  {PALETTES.map(([bg, ink], i) => (
                    <button
                      type="button"
                      key={i}
                      className={`swatch ${ev.cover.kind === 'poster' && ev.cover.palette === i ? 'on' : ''}`}
                      style={{ background: bg, color: ink }}
                      aria-label={`Palette ${i + 1}`}
                      onClick={() => patch({ cover: { kind: 'poster', palette: i, pattern: ev.cover.kind === 'poster' ? ev.cover.pattern : 0 } })}
                    >
                      Aa
                    </button>
                  ))}
                </div>
                <div className="swatches">
                  {Array.from({ length: PATTERN_COUNT }, (_, i) => (
                    <button
                      type="button"
                      key={i}
                      className={`chip ${ev.cover.kind === 'poster' && ev.cover.pattern === i ? 'on' : ''}`}
                      onClick={() => patch({ cover: { kind: 'poster', palette: ev.cover.kind === 'poster' ? ev.cover.palette : 0, pattern: i } })}
                    >
                      Pattern {i + 1}
                    </button>
                  ))}
                </div>
                <label className="btn ghost sm" style={{ width: 'fit-content' }}>
                  Upload an image instead
                  <input type="file" accept="image/*" onChange={onImage} hidden />
                </label>
              </div>
            </div>
          </section>

          <section id="location" className="editor-section">
            <h2>Location</h2>
            <div className="seg">
              <button type="button" className={ev.format === 'venue' ? 'on' : ''} onClick={() => patch({ format: 'venue', venue: ev.venue ?? { name: '', address: '', city: db.city } })}>
                Venue
              </button>
              <button type="button" className={ev.format === 'online' ? 'on' : ''} onClick={() => patch({ format: 'online' })}>
                Online event
              </button>
            </div>
            {ev.format === 'venue' ? (
              <>
                <label className="field">
                  <span>Venue name</span>
                  <input className="input" value={ev.venue?.name ?? ''} onChange={(e) => patch({ venue: { ...ev.venue!, name: e.target.value } })} />
                </label>
                <div className="two">
                  <label className="field">
                    <span>Street address</span>
                    <input className="input" value={ev.venue?.address ?? ''} onChange={(e) => patch({ venue: { ...ev.venue!, address: e.target.value } })} />
                  </label>
                  <label className="field">
                    <span>City</span>
                    <select className="select" value={ev.venue?.city ?? db.city} onChange={(e) => patch({ venue: { ...ev.venue!, city: e.target.value } })}>
                      {CITIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            ) : (
              <label className="field">
                <span>Event link</span>
                <input className="input" type="url" placeholder="https://" value={ev.onlineUrl ?? ''} onChange={(e) => patch({ onlineUrl: e.target.value })} />
                <small>Only ticket holders see this.</small>
              </label>
            )}
          </section>

          <section id="when" className="editor-section">
            <h2>Date & time</h2>
            <div className="two">
              <label className="field">
                <span>Starts</span>
                <input
                  className="input"
                  type="datetime-local"
                  value={toLocalInput(ev.start)}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const start = new Date(e.target.value);
                    const dur = new Date(ev.end).getTime() - new Date(ev.start).getTime();
                    patch({ start: start.toISOString(), end: new Date(start.getTime() + Math.max(dur, 3600000)).toISOString() });
                  }}
                />
              </label>
              <label className="field">
                <span>Ends</span>
                <input className="input" type="datetime-local" value={toLocalInput(ev.end)} onChange={(e) => e.target.value && patch({ end: new Date(e.target.value).toISOString() })} />
              </label>
            </div>
          </section>

          <section id="details" className="editor-section">
            <h2>Details</h2>
            <label className="field">
              <span>Description</span>
              <textarea className="textarea" rows={8} value={ev.description} onChange={(e) => patch({ description: e.target.value })} placeholder="What will happen, who it’s for, what to bring. Blank lines start new paragraphs." />
            </label>
            <div className="field">
              <span>Agenda</span>
              {ev.agenda.map((a, i) => (
                <div className="agenda-row" key={i}>
                  <input className="input" placeholder="7:00 PM" value={a.time} onChange={(e) => patch({ agenda: ev.agenda.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)) })} />
                  <input className="input" placeholder="Doors open" value={a.title} onChange={(e) => patch({ agenda: ev.agenda.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                  <button type="button" className="x" aria-label="Remove item" onClick={() => patch({ agenda: ev.agenda.filter((_, j) => j !== i) })}>
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="btn ghost sm" style={{ width: 'fit-content' }} onClick={() => patch({ agenda: [...ev.agenda, { time: '', title: '' }] })}>
                + Add agenda item
              </button>
            </div>
            <div className="two">
              <label className="field">
                <span>Age restriction</span>
                <select className="select" value={ev.ageLimit ?? ''} onChange={(e) => patch({ ageLimit: e.target.value || undefined })}>
                  <option value="">All ages</option>
                  <option value="18+">18+</option>
                  <option value="21+">21+</option>
                </select>
              </label>
              <label className="field">
                <span>Refund policy</span>
                <select className="select" value={ev.refundPolicy} onChange={(e) => patch({ refundPolicy: e.target.value as RefundPolicy })}>
                  {Object.entries(REFUND_POLICIES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section id="tickets" className="editor-section">
            <h2>Tickets</h2>
            {ev.tickets.map((t) => (
              <div className="tier-edit" key={t.id}>
                <div className="tier-edit-grid">
                  <label className="field">
                    <span>Name</span>
                    <input className="input" value={t.name} onChange={(e) => patchTicket(t.id, { name: e.target.value })} />
                  </label>
                  <label className="field">
                    <span>Price (USD)</span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      step="0.01"
                      value={t.price / 100}
                      disabled={t.sold > 0}
                      onChange={(e) => patchTicket(t.id, { price: Math.max(0, Math.round(+e.target.value * 100)) })}
                    />
                  </label>
                  <label className="field">
                    <span>Quantity</span>
                    <input className="input" type="number" min={Math.max(1, t.sold)} value={t.quantity} onChange={(e) => patchTicket(t.id, { quantity: Math.max(0, Math.floor(+e.target.value)) })} />
                  </label>
                  <label className="field">
                    <span>Max per order</span>
                    <input className="input" type="number" min={1} max={50} value={t.maxPerOrder} onChange={(e) => patchTicket(t.id, { maxPerOrder: Math.max(1, Math.floor(+e.target.value)) })} />
                  </label>
                </div>
                <div className="two">
                  <label className="field">
                    <span>Description (optional)</span>
                    <input className="input" value={t.description ?? ''} onChange={(e) => patchTicket(t.id, { description: e.target.value })} />
                  </label>
                  <label className="field">
                    <span>Sales end (optional)</span>
                    <input
                      className="input"
                      type="datetime-local"
                      value={t.salesEnd ? toLocalInput(t.salesEnd) : ''}
                      onChange={(e) => patchTicket(t.id, { salesEnd: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    />
                  </label>
                </div>
                <div className="tier-edit-foot mono">
                  <span>{t.sold > 0 ? `${t.sold} sold — price locked` : t.price === 0 ? 'Free ticket' : 'Paid ticket'}</span>
                  {t.sold === 0 && (
                    <button type="button" className="linkbtn" onClick={() => patch({ tickets: ev.tickets.filter((x) => x.id !== t.id) })}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
              <button type="button" className="btn ghost sm" onClick={() => patch({ tickets: [...ev.tickets, { id: uid('t-'), name: 'Free ticket', price: 0, quantity: 50, sold: 0, maxPerOrder: 10 }] })}>
                + Free ticket
              </button>
              <button type="button" className="btn ghost sm" onClick={() => patch({ tickets: [...ev.tickets, { id: uid('t-'), name: 'Paid ticket', price: 2000, quantity: 50, sold: 0, maxPerOrder: 10 }] })}>
                + Paid ticket
              </button>
            </div>

            <h3 style={{ marginBottom: 12 }}>Promo codes</h3>
            {ev.promoCodes.length > 0 && (
              <table className="table" style={{ marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Used</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {ev.promoCodes.map((p) => (
                    <tr key={p.code}>
                      <td className="mono">{p.code}</td>
                      <td>{p.percentOff}% off</td>
                      <td className="mono">
                        {p.uses}
                        {p.limit ? ` / ${p.limit}` : ''}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button type="button" className="linkbtn" onClick={() => patch({ promoCodes: ev.promoCodes.filter((x) => x.code !== p.code) })}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="promo-add">
              <input className="input" placeholder="CODE" value={promo.code} onChange={(e) => setPromo({ ...promo, code: e.target.value })} />
              <input className="input" type="number" min={1} max={100} value={promo.percentOff} onChange={(e) => setPromo({ ...promo, percentOff: +e.target.value })} aria-label="Percent off" />
              <input className="input" type="number" min={1} placeholder="Limit" value={promo.limit} onChange={(e) => setPromo({ ...promo, limit: e.target.value })} />
              <button type="button" className="btn ghost" onClick={addPromo}>
                Add code
              </button>
            </div>
            <small className="muted">Percent off, and an optional maximum number of orders.</small>
          </section>
        </div>

        <aside className="editor-preview">
          <div className="label" style={{ marginBottom: 10 }}>
            Live preview
          </div>
          <div style={{ pointerEvents: 'none' }}>
            <EventCard event={preview} />
          </div>
          <p className="mono muted" style={{ marginTop: 16 }}>
            {ev.status === 'published' ? 'Live' : 'Draft'} · created {fmtDate(ev.createdAt)}
          </p>
        </aside>
      </div>
    </div>
  );
}
