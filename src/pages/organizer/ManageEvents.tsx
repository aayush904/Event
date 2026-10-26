import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { capacity, isPast, useStore } from '../../lib/store';
import { fmtDate, fmtTime, money, uid } from '../../lib/format';
import { useToast } from '../../components/Toast';
import Poster from '../../components/Poster';
import type { EventItem } from '../../lib/types';

type Filter = 'upcoming' | 'drafts' | 'past' | 'all';

export default function ManageEvents() {
  const { db, myOrganizer, saveEvent, deleteEvent } = useStore();
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [q, setQ] = useState('');
  const toast = useToast();
  const nav = useNavigate();

  const mine = db.events.filter((e) => e.organizerId === myOrganizer?.id);
  const orders = db.orders.filter((o) => o.status === 'confirmed' && mine.some((e) => e.id === o.eventId));
  const gross = orders.reduce((s, o) => s + o.subtotal - o.discount, 0);
  const sold = mine.reduce((s, e) => s + e.tickets.reduce((x, t) => x + t.sold, 0), 0);

  const list = mine
    .filter((e) => {
      if (filter === 'drafts') return e.status === 'draft';
      if (filter === 'past') return isPast(e) && e.status !== 'draft';
      if (filter === 'upcoming') return !isPast(e) && e.status !== 'draft';
      return true;
    })
    .filter((e) => !q || e.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.start.localeCompare(b.start));

  const duplicate = (e: EventItem) => {
    const copy: EventItem = {
      ...e,
      id: uid('ev-'),
      title: `${e.title} (copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      views: 0,
      tickets: e.tickets.map((t) => ({ ...t, id: uid('t-'), sold: 0 })),
      promoCodes: e.promoCodes.map((p) => ({ ...p, uses: 0 })),
    };
    saveEvent(copy);
    toast('Duplicated as draft', { to: `/organizer/events/${copy.id}/edit`, label: 'Edit' });
  };

  const remove = (e: EventItem) => {
    const hasOrders = db.orders.some((o) => o.eventId === e.id && o.status === 'confirmed');
    if (hasOrders) {
      if (confirm('This event has ticket holders. Cancel the event instead? Attendees will see it as cancelled.')) {
        saveEvent({ ...e, status: 'cancelled' });
        toast('Event cancelled');
      }
      return;
    }
    if (confirm(`Delete “${e.title}”? This can’t be undone.`)) {
      deleteEvent(e.id);
      toast('Event deleted');
    }
  };

  return (
    <div className="wrap">
      <div className="manage-head">
        <div>
          <div className="eyebrow">Organizer · {myOrganizer?.name}</div>
          <h1 className="page-title" style={{ marginTop: 8 }}>
            Your events
          </h1>
        </div>
        <Link to="/organizer/events/new" className="btn accent">
          + Create event
        </Link>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="label">Events</span>
          <b>{mine.length}</b>
        </div>
        <div className="stat">
          <span className="label">Tickets sold</span>
          <b>{sold}</b>
        </div>
        <div className="stat">
          <span className="label">Gross sales</span>
          <b>{money(gross)}</b>
        </div>
        <div className="stat">
          <span className="label">Followers</span>
          <b>{myOrganizer ? Object.values(db.follows).filter((l) => l.includes(myOrganizer.id)).length + myOrganizer.baseFollowers : 0}</b>
        </div>
      </div>

      <div className="manage-toolbar">
        <div className="scroller">
          {(['upcoming', 'drafts', 'past', 'all'] as Filter[]).map((f) => (
            <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input className="input" style={{ maxWidth: 280, minHeight: 38 }} placeholder="Search your events" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <h3>{mine.length === 0 ? 'You haven’t created any events yet.' : 'No events in this view.'}</h3>
          <p className="muted">It takes about five minutes. You can save a draft and publish later.</p>
          <Link to="/organizer/events/new" className="btn">
            Create an event
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table manage-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Sold</th>
                <th>Gross</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const s = e.tickets.reduce((x, t) => x + t.sold, 0);
                const cap = capacity(e);
                const g = db.orders
                  .filter((o) => o.eventId === e.id && o.status === 'confirmed')
                  .reduce((x, o) => x + o.subtotal - o.discount, 0);
                const status = e.status === 'published' && isPast(e) ? 'ended' : e.status;
                return (
                  <tr key={e.id}>
                    <td>
                      <div className="manage-event" onClick={() => nav(`/organizer/events/${e.id}`)}>
                        <Poster cover={e.cover} title={e.title} category={e.category} dateLabel="" />
                        <div>
                          <b>{e.title}</b>
                          <div className="mono muted">
                            {fmtDate(e.start, 'day')} · {fmtTime(e.start)} · {e.format === 'online' ? 'Online' : e.venue?.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ minWidth: 120 }}>
                      <span className="mono">
                        {s}/{cap}
                      </span>
                      <div className="bar" style={{ marginTop: 6 }}>
                        <i style={{ width: `${cap ? (s / cap) * 100 : 0}%` }} />
                      </div>
                    </td>
                    <td className="mono">{money(g)}</td>
                    <td>
                      <span className={`pill ${status === 'published' ? 'ok' : status === 'cancelled' ? 'accent' : 'soft'}`}>{status === 'published' ? 'On sale' : status}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link className="btn ghost sm" to={`/organizer/events/${e.id}`}>
                          Manage
                        </Link>
                        <Link className="btn ghost sm" to={`/organizer/events/${e.id}/edit`}>
                          Edit
                        </Link>
                        <Link className="btn ghost sm" to={`/e/${e.id}`}>
                          View
                        </Link>
                        <button className="btn ghost sm" onClick={() => duplicate(e)}>
                          Copy
                        </button>
                        <button className="btn danger sm" onClick={() => remove(e)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
