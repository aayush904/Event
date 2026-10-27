import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { isPast, useStore } from '../lib/store';
import { fmtDate, fmtRange, fmtTime, money } from '../lib/format';
import { REFUND_POLICIES } from '../lib/constants';
import Poster from '../components/Poster';
import { useToast } from '../components/Toast';
import { downloadIcs } from '../lib/ics';
import type { EventItem, Order } from '../lib/types';
import { NotFound } from './Static';

const REFUND_DAYS: Record<string, number> = { none: -1, '1day': 1, '7days': 7, '30days': 30 };

export function canRefund(order: Order, event: EventItem) {
  if (order.status !== 'confirmed') return false;
  if (order.total === 0) return !isPast(event);
  const days = REFUND_DAYS[event.refundPolicy];
  if (days < 0) return false;
  return new Date(event.start).getTime() - Date.now() > days * 86400000;
}

export function Tickets() {
  const { db, user } = useStore();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const orders = db.orders
    .filter((o) => o.userId === user?.id)
    .map((o) => ({ o, e: db.events.find((e) => e.id === o.eventId) }))
    .filter((x): x is { o: Order; e: EventItem } => !!x.e);
  const upcoming = orders.filter((x) => !isPast(x.e)).sort((a, b) => a.e.start.localeCompare(b.e.start));
  const past = orders.filter((x) => isPast(x.e));
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="wrap">
      <h1 className="page-title">Tickets</h1>
      <div className="tabs">
        <button className={tab === 'upcoming' ? 'on' : ''} onClick={() => setTab('upcoming')}>
          Upcoming ({upcoming.length})
        </button>
        <button className={tab === 'past' ? 'on' : ''} onClick={() => setTab('past')}>
          Past ({past.length})
        </button>
      </div>
      {list.length === 0 ? (
        <div className="empty">
          <h3>{tab === 'upcoming' ? 'No upcoming tickets.' : 'Nothing here yet.'}</h3>
          <p className="muted">Tickets you buy or reserve show up here, ready to scan at the door.</p>
          <Link to="/search" className="btn">
            Find something to do
          </Link>
        </div>
      ) : (
        <div className="order-list">
          {list.map(({ o, e }) => (
            <Link to={`/tickets/${o.id}`} className="order-row" key={o.id}>
              <Poster cover={e.cover} title={e.title} category={e.category} dateLabel={fmtDate(e.start)} />
              <div>
                <div className="card-when">
                  {fmtDate(e.start, 'day')} · {fmtTime(e.start)}
                </div>
                <b style={{ fontSize: '1.25rem' }}>{e.title}</b>
                <div className="muted">{e.format === 'online' ? 'Online' : e.venue?.name}</div>
                <div className="mono" style={{ marginTop: 6 }}>
                  Order #{o.id} · {o.attendees.length} {o.attendees.length === 1 ? 'ticket' : 'tickets'} · {money(o.total, { free: true })}
                </div>
              </div>
              <div>{o.status === 'refunded' ? <span className="pill soft">Refunded</span> : <span className="pill ok">Confirmed</span>}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function QR({ value }: { value: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: 240, color: { dark: '#16130f', light: '#fbf8f1' } }).then(setSrc);
  }, [value]);
  return src ? <img src={src} alt={`QR code ${value}`} width={160} height={160} /> : <div style={{ width: 160, height: 160 }} />;
}

export function TicketDetail() {
  const { orderId } = useParams();
  const { db, user, refundOrder } = useStore();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const order = db.orders.find((o) => o.id === orderId && o.userId === user?.id);
  const event = order && db.events.find((e) => e.id === order.eventId);
  if (!order || !event) return <NotFound />;
  const refundable = canRefund(order, event);

  return (
    <div className="wrap">
      <nav className="crumbs mono" style={{ marginTop: 24 }}>
        <Link to="/tickets">Tickets</Link> / #{order.id}
      </nav>
      <h1 className="page-title" style={{ marginTop: 16 }}>
        {event.title}
      </h1>
      <p className="mono">{fmtRange(event.start, event.end)}</p>
      {order.status === 'refunded' && <div className="banner">This order was refunded. These tickets are no longer valid.</div>}

      <div className="ticket-layout">
        <div className="stubs">
          {order.attendees.map((a, i) => (
            <div className={`stub ${order.status === 'refunded' ? 'void' : ''}`} key={a.id}>
              <div className="stub-main">
                <div className="eyebrow">
                  Ticket {i + 1} of {order.attendees.length}
                </div>
                <b className="stub-name">{a.name}</b>
                <div>{a.ticketName}</div>
                <div className="mono muted" style={{ marginTop: 10 }}>
                  {fmtDate(event.start, 'day')} · {fmtTime(event.start)}
                  <br />
                  {event.format === 'online' ? 'Online' : `${event.venue?.name}, ${event.venue?.address}`}
                </div>
                {event.format === 'online' && event.onlineUrl && order.status === 'confirmed' && (
                  <a className="btn sm" style={{ marginTop: 12 }} href={event.onlineUrl} target="_blank" rel="noreferrer">
                    Join online event
                  </a>
                )}
              </div>
              <div className="stub-qr">
                <QR value={`RAVERS:${order.id}:${a.id}`} />
                <span className="mono">{a.id.toUpperCase()}</span>
                {a.checkedIn && <span className="pill ok">Checked in</span>}
              </div>
            </div>
          ))}
        </div>

        <aside className="box">
          <div className="label">Order summary</div>
          <div className="co-lines" style={{ marginTop: 12 }}>
            {order.lines.map((l) => (
              <div key={l.ticketTypeId}>
                <span>
                  {l.qty} × {l.name}
                </span>
                <span>{money(l.qty * l.unitPrice)}</span>
              </div>
            ))}
            {order.discount > 0 && (
              <div className="ok">
                <span>Promo {order.promoCode}</span>
                <span>−{money(order.discount)}</span>
              </div>
            )}
            {order.fees > 0 && (
              <div>
                <span>Fees</span>
                <span>{money(order.fees)}</span>
              </div>
            )}
            <div className="co-total">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
          </div>
          <p className="mono muted">
            Ordered {fmtDate(order.createdAt, 'long')}
            {order.cardLast4 && ` · Card ending ${order.cardLast4}`}
            <br />
            Sent to {order.buyerEmail}
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            <button className="btn ghost block" onClick={() => window.print()}>
              Print tickets
            </button>
            <button className="btn ghost block" onClick={() => downloadIcs(event)}>
              Add to calendar
            </button>
            <Link to={`/e/${event.id}`} className="btn ghost block">
              Event page
            </Link>
            {order.status === 'confirmed' &&
              (refundable ? (
                confirming ? (
                  <div className="box" style={{ padding: 14 }}>
                    <p style={{ marginTop: 0 }}>
                      {order.total > 0 ? `Refund ${money(order.total)} and release these tickets?` : 'Cancel this registration?'}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn danger sm"
                        onClick={() => {
                          refundOrder(order.id);
                          setConfirming(false);
                          toast(order.total > 0 ? 'Refund requested' : 'Registration cancelled');
                        }}
                      >
                        Yes, cancel
                      </button>
                      <button className="btn ghost sm" onClick={() => setConfirming(false)}>
                        Keep
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="btn danger block" onClick={() => setConfirming(true)}>
                    {order.total > 0 ? 'Request a refund' : 'Cancel registration'}
                  </button>
                )
              ) : (
                <p className="mono muted">{REFUND_POLICIES[event.refundPolicy]}. This order can no longer be refunded.</p>
              ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
