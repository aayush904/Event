import { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQ: { section: string; id?: string; items: [string, string][] }[] = [
  {
    section: 'Buying tickets',
    items: [
      ['Where are my tickets?', 'Log in and open Tickets from the menu. Each ticket has its own QR code you can show on your phone or print.'],
      ['Can I get a refund?', 'It depends on the organizer’s refund policy, shown on every event page. If your order is still within the window, open it under Tickets and choose “Request a refund”.'],
      ['I bought tickets for friends — can I put their names on them?', 'Yes. During checkout you can add a name to each ticket. Otherwise they’re issued in the buyer’s name.'],
      ['What are the service fees?', 'Paid tickets carry a 3.7% + $1.79 per-ticket service fee, shown before you pay. Free events have no fees.'],
    ],
  },
  {
    section: 'Running events',
    items: [
      ['How do I create an event?', 'Choose Create in the header. Add the basics, location, date, description and ticket types, then publish — or save it as a draft and come back later.'],
      ['Can I offer discounts?', 'Add promo codes in the Tickets step of the event editor. Each code takes a percentage off and an optional redemption limit.'],
      ['How do I check people in?', 'Open the event from Manage events, go to Attendees, and tick each person off as they arrive. You can also search by name or order number.'],
      ['Can I export my guest list?', 'Yes — the Orders and Attendees tabs in the event dashboard both export to CSV.'],
    ],
  },
  {
    section: 'Terms',
    id: 'terms',
    items: [['Is this a real ticketing service?', 'No. Turnout is a demo application. No payments are processed and data is stored only in your browser.']],
  },
  {
    section: 'Privacy',
    id: 'privacy',
    items: [['What data do you keep?', 'Everything — accounts, orders, likes — is saved in your browser’s local storage and never leaves your device. Clear it any time from Account → Reset demo data.']],
  },
];

export function Help() {
  const [q, setQ] = useState('');
  const needle = q.toLowerCase();
  return (
    <div className="wrap narrow">
      <h1 className="page-title">Help centre</h1>
      <input className="input" placeholder="Search help articles" value={q} onChange={(e) => setQ(e.target.value)} style={{ margin: '16px 0 8px' }} />
      {FAQ.map((s) => {
        const items = s.items.filter(([a, b]) => !needle || (a + b).toLowerCase().includes(needle));
        if (!items.length) return null;
        return (
          <section className="section" key={s.section} id={s.id} style={{ marginTop: 40 }}>
            <div className="section-head">
              <h2>{s.section}</h2>
            </div>
            {items.map(([qq, a]) => (
              <details className="faq" key={qq}>
                <summary>{qq}</summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
        );
      })}
    </div>
  );
}

export function Pricing() {
  return (
    <div className="wrap">
      <h1 className="page-title">Pricing</h1>
      <p className="muted" style={{ maxWidth: 560 }}>
        No subscriptions, no setup costs. You only pay when you sell a paid ticket — and you can pass that fee on to your buyers.
      </p>
      <div className="price-grid">
        <div className="box">
          <div className="eyebrow">Free events</div>
          <div className="price-big">$0</div>
          <p>Unlimited free events, RSVPs and check-ins.</p>
        </div>
        <div className="box" style={{ background: 'var(--accent)' }}>
          <div className="eyebrow" style={{ color: 'var(--ink)' }}>
            Paid events
          </div>
          <div className="price-big">3.7% + $1.79</div>
          <p>Per paid ticket. Includes payment processing, promo codes, guest lists and payouts.</p>
        </div>
        <div className="box">
          <div className="eyebrow">Big runs</div>
          <div className="price-big">Talk to us</div>
          <p>Selling over 5,000 tickets a year? We’ll work out a rate that makes sense.</p>
        </div>
      </div>
      <Link to="/organizer/events/new" className="btn accent" style={{ marginTop: 32 }}>
        Create your first event
      </Link>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="wrap" style={{ padding: '80px 0 0', textAlign: 'center' }}>
      <div className="display" style={{ fontSize: 'clamp(6rem, 22vw, 14rem)', color: 'var(--accent)' }}>
        404
      </div>
      <p style={{ fontSize: '1.25rem' }}>This page left early.</p>
      <Link to="/" className="btn" style={{ marginTop: 12 }}>
        Back to events
      </Link>
    </div>
  );
}
