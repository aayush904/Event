import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { capacity, isPast, useStore } from '../../lib/store';
import { downloadCsv, fmtDate, fmtRange, fmtTime, money } from '../../lib/format';
import { useToast } from '../../components/Toast';
import { NotFound } from '../Static';

type Tab = 'overview' | 'orders' | 'attendees';

export default function EventDashboard() {
  const { id } = useParams();
  const { db, myOrganizer, refundOrder, toggleCheckIn, saveEvent } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [q, setQ] = useState('');
  const event = db.events.find((e) => e.id === id);
  if (!event || event.organizerId !== myOrganizer?.id) return <NotFound />;

  const orders = db.orders.filter((o) => o.eventId === event.id);
  const live = orders.filter((o) => o.status === 'confirmed');
  const gross = live.reduce((s, o) => s + o.subtotal - o.discount, 0);
  const sold = event.tickets.reduce((s, t) => s + t.sold, 0);
  const cap = capacity(event);
  const attendees = live.flatMap((o) => o.attendees.map((a) => ({ ...a, order: o })));
  const checkedIn = attendees.filter((a) => a.checkedIn).length;
  const needle = q.toLowerCase();
  const visibleAttendees = attendees.filter(
    (a) => !needle || a.name.toLowerCase().includes(needle) || a.order.id.toLowerCase().includes(needle) || a.order.buyerEmail.includes(needle),
  );

  const exportOrders = () =>
    downloadCsv(`${event.id}-orders.csv`, [
      ['Order', 'Date', 'Buyer', 'Email', 'Tickets', 'Subtotal', 'Discount', 'Fees', 'Total', 'Status'],
      ...orders.map((o) => [
        o.id,
        o.createdAt,
        o.buyerName,
        o.buyerEmail,
        o.attendees.length,
        (o.subtotal / 100).toFixed(2),
        (o.discount / 100).toFixed(2),
        (o.fees / 100).toFixed(2),
        (o.total / 100).toFixed(2),
        o.status,
      ]),
    ]);

  const exportAttendees = () =>
    downloadCsv(`${event.id}-attendees.csv`, [
      ['Name', 'Ticket', 'Order', 'Buyer email', 'Checked in'],
      ...attendees.map((a) => [a.name, a.ticketName, a.order.id, a.order.buyerEmail, a.checkedIn ? 'yes' : 'no']),
    ]);

  return (
    <div className="wrap">
      <div className="manage-head">
        <div>
          <nav className="crumbs mono">
            <Link to="/organizer/events">Your events</Link> / Dashboard
          </nav>
          <h1 className="page-title" style={{ marginTop: 8 }}>
            {event.title}
          </h1>
          <p className="mono" style={{ margin: 0 }}>
            {fmtRange(event.start, event.end)} ·{' '}
            {event.status === 'draft' ? 'Draft' : event.status === 'cancelled' ? 'Cancelled' : isPast(event) ? 'Ended' : 'On sale'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to={`/e/${event.id}`} className="btn ghost">
            View page
          </Link>
          <Link to={`/organizer/events/${event.id}/edit`} className="btn">
            Edit
          </Link>
          {event.status === 'published' && !isPast(event) && (
            <button
              className="btn danger"
              onClick={() => {
                if (confirm('Cancel this event? Ticket sales stop and attendees see it as cancelled.')) {
                  saveEvent({ ...event, status: 'cancelled' });
                  toast('Event cancelled');
                }
              }}
            >
              Cancel event
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        {(['overview', 'orders', 'attendees'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
            {t === 'orders' && ` (${orders.length})`}
            {t === 'attendees' && ` (${attendees.length})`}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="stats">
            <div className="stat">
              <span className="label">Tickets sold</span>
              <b>
                {sold}
                <span className="muted" style={{ fontSize: '1rem' }}>
                  {' '}
                  / {cap}
                </span>
              </b>
            </div>
            <div className="stat">
              <span className="label">Gross sales</span>
              <b>{money(gross)}</b>
            </div>
            <div className="stat">
              <span className="label">Page views</span>
              <b>{event.views.toLocaleString()}</b>
            </div>
            <div className="stat">
              <span className="label">Checked in</span>
              <b>
                {checkedIn}
                <span className="muted" style={{ fontSize: '1rem' }}>
                  {' '}
                  / {attendees.length}
                </span>
              </b>
            </div>
          </div>

          <section className="section" style={{ marginTop: 40 }}>
            <div className="section-head">
              <h2>Ticket types</h2>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Price</th>
                  <th>Sold</th>
                  <th style={{ width: '35%' }}>Capacity</th>
                </tr>
              </thead>
              <tbody>
                {event.tickets.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td className="mono">{money(t.price, { free: true })}</td>
                    <td className="mono">
                      {t.sold} / {t.quantity}
                    </td>
                    <td>
                      <div className="bar">
                        <i style={{ width: `${t.quantity ? Math.min(100, (t.sold / t.quantity) * 100) : 0}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {event.promoCodes.length > 0 && (
            <section className="section" style={{ marginTop: 40 }}>
              <div className="section-head">
                <h2>Promo codes</h2>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Redeemed</th>
                  </tr>
                </thead>
                <tbody>
                  {event.promoCodes.map((p) => (
                    <tr key={p.code}>
                      <td className="mono">{p.code}</td>
                      <td>{p.percentOff}%</td>
                      <td className="mono">
                        {p.uses}
                        {p.limit ? ` / ${p.limit}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="section" style={{ marginTop: 40 }}>
            <div className="section-head">
              <h2>Share</h2>
            </div>
            <div className="promo" style={{ maxWidth: 560 }}>
              <input className="input" readOnly value={`${location.origin}/e/${event.id}`} onFocus={(e) => e.target.select()} />
              <button
                className="btn"
                onClick={() => {
                  navigator.clipboard.writeText(`${location.origin}/e/${event.id}`).then(() => toast('Link copied'));
                }}
              >
                Copy link
              </button>
            </div>
          </section>
        </>
      )}

      {tab === 'orders' && (
        <>
          <div className="manage-toolbar">
            <span className="mono">{live.length} confirmed · {orders.length - live.length} refunded</span>
            <button className="btn ghost sm" onClick={exportOrders} disabled={!orders.length}>
              Export CSV
            </button>
          </div>
          {orders.length === 0 ? (
            <div className="empty">
              <h3>No orders yet.</h3>
              <p className="muted">Share your event link to get the first few in.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Buyer</th>
                    <th>Date</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="mono">#{o.id}</td>
                      <td>
                        {o.buyerName}
                        <div className="mono muted">{o.buyerEmail}</div>
                      </td>
                      <td className="mono">
                        {fmtDate(o.createdAt)} {fmtTime(o.createdAt)}
                      </td>
                      <td className="mono">{o.attendees.length}</td>
                      <td className="mono">{money(o.total, { free: true })}</td>
                      <td>
                        <span className={`pill ${o.status === 'confirmed' ? 'ok' : 'soft'}`}>{o.status}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {o.status === 'confirmed' && (
                          <button
                            className="btn danger sm"
                            onClick={() => {
                              if (confirm(`Refund order #${o.id}?`)) {
                                refundOrder(o.id);
                                toast('Order refunded');
                              }
                            }}
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'attendees' && (
        <>
          <div className="manage-toolbar">
            <input className="input" style={{ maxWidth: 320, minHeight: 38 }} placeholder="Search name, email or order #" value={q} onChange={(e) => setQ(e.target.value)} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="mono">
                {checkedIn}/{attendees.length} checked in
              </span>
              <button className="btn ghost sm" onClick={exportAttendees} disabled={!attendees.length}>
                Export CSV
              </button>
            </div>
          </div>
          <div className="bar" style={{ marginBottom: 20 }}>
            <i style={{ width: `${attendees.length ? (checkedIn / attendees.length) * 100 : 0}%`, background: 'var(--ok)' }} />
          </div>
          {visibleAttendees.length === 0 ? (
            <div className="empty">
              <h3>{attendees.length ? 'No one matches that search.' : 'No attendees yet.'}</h3>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Ticket</th>
                    <th>Order</th>
                    <th>Check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAttendees.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <b>{a.name}</b>
                        <div className="mono muted">{a.order.buyerEmail}</div>
                      </td>
                      <td>{a.ticketName}</td>
                      <td className="mono">#{a.order.id}</td>
                      <td>
                        <button className={`btn sm ${a.checkedIn ? '' : 'ghost'}`} onClick={() => toggleCheckIn(a.order.id, a.id)} aria-pressed={a.checkedIn}>
                          {a.checkedIn ? '✓ Checked in' : 'Check in'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
