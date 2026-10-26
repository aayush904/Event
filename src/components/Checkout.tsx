import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import Poster from './Poster';
import { priceOrder, useStore } from '../lib/store';
import { fmtDate, fmtWhen, money } from '../lib/format';
import type { EventItem, Order } from '../lib/types';
import { downloadIcs } from '../lib/ics';

type Step = 'tickets' | 'details' | 'payment' | 'done';

const HOLD_SECONDS = 15 * 60;

function luhn(num: string) {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 13) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = +digits[digits.length - 1 - i];
    if (i % 2) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export default function Checkout({ event, onClose }: { event: EventItem; onClose: () => void }) {
  const { user, checkout } = useStore();
  const [step, setStep] = useState<Step>('tickets');
  const [qty, setQty] = useState<Record<string, number>>(() =>
    event.tickets.length === 1 && event.tickets[0].quantity > event.tickets[0].sold ? { [event.tickets[0].id]: 1 } : {},
  );
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<string | undefined>();
  const [promoError, setPromoError] = useState('');
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [attendees, setAttendees] = useState<string[]>([]);
  const [card, setCard] = useState({ number: '', exp: '', cvc: '', name: user?.name ?? '' });
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);

  const p = priceOrder(event, qty, promo);
  const count = p.lines.reduce((s, l) => s + l.qty, 0);
  const salesClosed = new Date(event.start).getTime() < Date.now();

  useEffect(() => {
    if (step === 'tickets' || step === 'done') return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setStep('tickets');
      setSecondsLeft(HOLD_SECONDS);
      setError('Your ticket hold expired. Tickets have been released — please choose again.');
    }
  }, [secondsLeft]);

  const bump = (id: string, d: number, max: number) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(max, (q[id] ?? 0) + d)) }));

  const applyPromo = () => {
    const code = event.promoCodes.find((c) => c.code.toUpperCase() === promoInput.trim().toUpperCase());
    if (!code) {
      setPromoError('That code isn’t valid for this event.');
      setPromo(undefined);
      return;
    }
    if (code.limit && code.uses >= code.limit) {
      setPromoError('That code has been fully redeemed.');
      return;
    }
    setPromoError('');
    setPromo(code.code);
  };

  const place = () => {
    const res = checkout({
      eventId: event.id,
      quantities: qty,
      promoCode: promo,
      buyerName: name.trim(),
      buyerEmail: email.trim(),
      attendeeNames: attendees,
      cardLast4: p.total > 0 ? card.number.replace(/\D/g, '').slice(-4) : undefined,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOrder(res.order);
    setStep('done');
  };

  const toDetails = () => {
    setError('');
    setAttendees((a) => Array.from({ length: count }, (_, i) => a[i] ?? ''));
    setStep('details');
  };

  const fromDetails = () => {
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Add your name and a valid email so we can send your tickets.');
      return;
    }
    setError('');
    if (p.total > 0) setStep('payment');
    else place();
  };

  const fromPayment = () => {
    if (!luhn(card.number)) return setError('That card number doesn’t look right. Try 4242 4242 4242 4242.');
    const m = card.exp.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (!m || +m[1] < 1 || +m[1] > 12 || new Date(2000 + +m[2], +m[1]) < new Date()) return setError('Check the expiry date (MM/YY).');
    if (!/^\d{3,4}$/.test(card.cvc)) return setError('CVC should be 3 or 4 digits.');
    setError('');
    place();
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  let ticketIndex = 0;

  const summary = (
    <aside className="co-summary">
      <Poster cover={event.cover} title={event.title} category={event.category} dateLabel={fmtDate(event.start)} />
      <div className="co-summary-body">
        <b>{event.title}</b>
        <div className="mono muted">{fmtWhen(event.start)}</div>
        <div className="co-lines">
          {p.lines.length === 0 && <div className="muted">No tickets selected</div>}
          {p.lines.map((l) => (
            <div key={l.ticketTypeId}>
              <span>
                {l.qty} × {l.name}
              </span>
              <span>{money(l.qty * l.unitPrice)}</span>
            </div>
          ))}
          {p.discount > 0 && (
            <div className="ok">
              <span>Promo {p.code?.code}</span>
              <span>−{money(p.discount)}</span>
            </div>
          )}
          {p.fees > 0 && (
            <div>
              <span>Service fees</span>
              <span>{money(p.fees)}</span>
            </div>
          )}
          <div className="co-total">
            <span>Total</span>
            <span>{money(p.total)}</span>
          </div>
        </div>
      </div>
    </aside>
  );

  if (step === 'done' && order) {
    return (
      <Modal title="You’re going" onClose={onClose}>
        <div className="co-done">
          <div className="eyebrow">Order #{order.id}</div>
          <h2 className="display" style={{ fontSize: 'clamp(2rem,6vw,3.5rem)', margin: '8px 0 12px' }}>
            See you there, {order.buyerName.split(' ')[0]}.
          </h2>
          <p>
            {order.attendees.length} {order.attendees.length === 1 ? 'ticket' : 'tickets'} for <b>{event.title}</b> on{' '}
            {fmtWhen(event.start)}. A copy is on its way to {order.buyerEmail}.
          </p>
          <div className="hero-actions">
            <Link to={`/tickets/${order.id}`} className="btn accent" onClick={onClose}>
              View tickets
            </Link>
            <button className="btn ghost" onClick={() => downloadIcs(event)}>
              Add to calendar
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={
        <span style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {step === 'tickets' ? 'Choose tickets' : step === 'details' ? 'Your details' : 'Payment'}
          {step !== 'tickets' && <span className="pill accent">Held for {mm}:{ss}</span>}
        </span>
      }
      onClose={onClose}
    >
      <div className="co-grid">
        <div>
          <ol className="co-steps mono">
            {(['tickets', 'details', ...(p.total > 0 ? ['payment'] : [])] as Step[]).map((s, i) => (
              <li key={s} className={s === step ? 'on' : ''}>
                {i + 1}. {s}
              </li>
            ))}
          </ol>
          {error && <p className="error">{error}</p>}

          {step === 'tickets' && (
            <>
              {salesClosed && <p className="error">Sales for this event have ended.</p>}
              <div className="tiers">
                {event.tickets.map((t) => {
                  const left = t.quantity - t.sold;
                  const ended = salesClosed || (t.salesEnd ? new Date(t.salesEnd).getTime() < Date.now() : false);
                  const max = Math.min(left, t.maxPerOrder);
                  return (
                    <div className={`tier ${left <= 0 || ended ? 'off' : ''}`} key={t.id}>
                      <div>
                        <b>{t.name}</b>
                        <div className="mono">{money(t.price, { free: true })}</div>
                        {t.description && <div className="muted" style={{ fontSize: '.875rem' }}>{t.description}</div>}
                        <div className="mono muted" style={{ fontSize: '.75rem', marginTop: 4 }}>
                          {left <= 0 ? 'Sold out' : ended ? 'Sales ended' : left < 20 ? `Only ${left} left` : `${left} available`}
                        </div>
                      </div>
                      {left > 0 && !ended && (
                        <div className="stepper">
                          <button onClick={() => bump(t.id, -1, max)} disabled={!qty[t.id]} aria-label={`Fewer ${t.name}`}>
                            −
                          </button>
                          <span aria-live="polite">{qty[t.id] ?? 0}</span>
                          <button onClick={() => bump(t.id, 1, max)} disabled={(qty[t.id] ?? 0) >= max} aria-label={`More ${t.name}`}>
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="promo">
                <input
                  className="input"
                  placeholder="Promo code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                />
                <button className="btn ghost" onClick={applyPromo} disabled={!promoInput.trim()}>
                  Apply
                </button>
              </div>
              {promoError && <p className="error">{promoError}</p>}
              {promo && <p className="mono" style={{ color: 'var(--ok)' }}>Code {promo} applied.</p>}
              <button className="btn accent block" disabled={count === 0} onClick={toDetails}>
                {count === 0 ? 'Select tickets' : `Continue · ${money(p.total, { free: true })}`}
              </button>
            </>
          )}

          {step === 'details' && (
            <>
              <label className="field">
                <span>Full name</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </label>
              <label className="field">
                <span>Email</span>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                <small>Tickets are sent here.</small>
              </label>
              {count > 1 && (
                <div className="box" style={{ marginBottom: 18, padding: 16 }}>
                  <div className="label" style={{ marginBottom: 10 }}>
                    Attendee names (optional)
                  </div>
                  {p.lines.flatMap((l) =>
                    Array.from({ length: l.qty }, (_, k) => {
                      const idx = ticketIndex++;
                      return (
                        <label className="field" key={`${l.ticketTypeId}-${k}`} style={{ marginBottom: 10 }}>
                          <span>
                            {l.name} #{k + 1}
                          </span>
                          <input
                            className="input"
                            placeholder={name || 'Same as buyer'}
                            value={attendees[idx] ?? ''}
                            onChange={(e) => setAttendees((a) => a.map((v, j) => (j === idx ? e.target.value : v)))}
                          />
                        </label>
                      );
                    }),
                  )}
                </div>
              )}
              <label className="check" style={{ marginBottom: 18 }}>
                <input type="checkbox" defaultChecked />
                Keep me posted about events from this organizer
              </label>
              <div className="co-nav">
                <button className="btn ghost" onClick={() => setStep('tickets')}>
                  Back
                </button>
                <button className="btn accent" onClick={fromDetails}>
                  {p.total > 0 ? 'Continue to payment' : 'Register'}
                </button>
              </div>
            </>
          )}

          {step === 'payment' && (
            <>
              <p className="mono muted" style={{ marginTop: 0 }}>
                Demo checkout — no money moves. Use 4242 4242 4242 4242, any future date, any CVC.
              </p>
              <label className="field">
                <span>Card number</span>
                <input
                  className="input"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 1234 1234 1234"
                  value={card.number}
                  onChange={(e) =>
                    setCard({
                      ...card,
                      number: e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 19)
                        .replace(/(\d{4})(?=\d)/g, '$1 '),
                    })
                  }
                />
              </label>
              <div className="two">
                <label className="field">
                  <span>Expiry</span>
                  <input
                    className="input"
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
                    value={card.exp}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCard({ ...card, exp: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v });
                    }}
                  />
                </label>
                <label className="field">
                  <span>CVC</span>
                  <input
                    className="input"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={card.cvc}
                    onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  />
                </label>
              </div>
              <label className="field">
                <span>Name on card</span>
                <input className="input" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} autoComplete="cc-name" />
              </label>
              <div className="co-nav">
                <button className="btn ghost" onClick={() => setStep('details')}>
                  Back
                </button>
                <button className="btn accent" onClick={fromPayment}>
                  Pay {money(p.total)}
                </button>
              </div>
            </>
          )}
        </div>
        {summary}
      </div>
    </Modal>
  );
}
