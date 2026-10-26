import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isPast, publicEvents, useStore } from '../lib/store';
import { CATEGORIES, CITIES } from '../lib/constants';
import { fmtDate, fmtTime, inDateRange, startOfDay } from '../lib/format';
import EventCard, { priceLabel } from '../components/EventCard';
import Poster from '../components/Poster';
import { SearchBar } from '../components/Layout';
import { ArrowIcon } from '../components/Icons';
import type { EventItem } from '../lib/types';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'for-you', label: 'For you' },
  { id: 'today', label: 'Today' },
  { id: 'weekend', label: 'This weekend' },
  { id: 'free', label: 'Free' },
  { id: 'online', label: 'Online' },
  { id: 'music', label: 'Music' },
  { id: 'food-drink', label: 'Food & drink' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'classes', label: 'Classes' },
];

function weekNumber(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y.getTime()) / 86400000 + 1) / 7);
}

export default function Home() {
  const { db, setCity, user, followerCount } = useStore();
  const [tab, setTab] = useState('all');
  const [shown, setShown] = useState(8);
  const city = db.city;

  const all = useMemo(() => publicEvents(db), [db]);
  const local = useMemo(() => all.filter((e) => e.city === city || e.city === 'Online'), [all, city]);
  const inCity = local.filter((e) => e.city === city);

  const filtered = useMemo(() => {
    switch (tab) {
      case 'for-you': {
        const interests = user?.interests ?? [];
        const followed = user ? db.follows[user.id] ?? [] : [];
        const scored = local.filter((e) => interests.includes(e.category) || followed.includes(e.organizerId));
        return scored.length ? scored : local;
      }
      case 'today':
      case 'weekend':
        return local.filter((e) => inDateRange(e.start, tab));
      case 'free':
        return local.filter((e) => e.tickets.some((t) => t.price === 0));
      case 'online':
        return all.filter((e) => e.format === 'online');
      case 'all':
        return local;
      default:
        return local.filter((e) => e.category === tab);
    }
  }, [tab, local, all, user, db.follows]);

  const featured: EventItem | undefined =
    [...inCity].sort((a, b) => b.views - a.views)[0] ?? all[0];

  const now = new Date();
  const weekEnd = startOfDay(now).getTime() + 7 * 86400000;
  const weekAhead = inCity.filter((e) => new Date(e.start).getTime() < weekEnd).slice(0, 7);

  const cityCounts = CITIES.map((c) => ({ c, n: all.filter((e) => e.city === c).length }));
  const topOrganizers = [...db.organizers]
    .filter((o) => db.events.some((e) => e.organizerId === o.id && !isPast(e) && e.status === 'published'))
    .sort((a, b) => followerCount(b.id) - followerCount(a.id))
    .slice(0, 6);

  return (
    <>
      <div className="wrap">
        <SearchBar className="mobile-search" />
      </div>

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">
              Week {weekNumber(now)} · {fmtDate(now.toISOString())} – {fmtDate(new Date(weekEnd - 1).toISOString())} ·{' '}
              {inCity.length} listings
            </div>
            <h1 className="hero-title">
              What’s on in
              <span className="city-pick">
                <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Choose city">
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <span aria-hidden="true">{city}</span>
              </span>
            </h1>
            <p className="hero-sub">
              Gigs, supper clubs, workshops, runs, readings and late nights — listed by the people putting them on.
            </p>
            <div className="hero-actions">
              <Link to={`/search?loc=${encodeURIComponent(city)}`} className="btn accent">
                Browse all in {city} <ArrowIcon />
              </Link>
              <Link to="/organizer/events/new" className="btn ghost">
                List your event
              </Link>
            </div>
          </div>
          {featured && (
            <Link to={`/e/${featured.id}`} className="hero-feature">
              <span className="stamp">Pick of the week</span>
              <Poster cover={featured.cover} title={featured.title} category={featured.category} dateLabel={fmtDate(featured.start)} />
              <div className="hero-feature-meta">
                <div>
                  <b>{featured.title}</b>
                  <div className="mono muted">
                    {fmtDate(featured.start, 'day')} · {featured.venue?.name ?? 'Online'}
                  </div>
                </div>
                <span className="mono">{priceLabel(featured)}</span>
              </div>
            </Link>
          )}
        </div>
      </section>

      <div className="wrap">
        <section className="cat-index" aria-label="Browse by category">
          {CATEGORIES.map((c, i) => (
            <Link key={c.id} to={`/search?cat=${c.id}&loc=${encodeURIComponent(city)}`}>
              <span className="mono">{String(i + 1).padStart(2, '0')}</span>
              {c.short}
            </Link>
          ))}
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Events in {city}</h2>
            <Link to={`/search?loc=${encodeURIComponent(city)}`} className="mono">
              See all →
            </Link>
          </div>
          <div className="scroller" style={{ marginBottom: 28 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`chip ${tab === t.id ? 'on' : ''}`}
                onClick={() => {
                  setTab(t.id);
                  setShown(8);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="empty">
              <h3>Nothing here yet.</h3>
              <p className="muted">Try another filter, or check out what’s on online.</p>
              <button className="btn ghost" onClick={() => setTab('online')}>
                Show online events
              </button>
            </div>
          ) : (
            <>
              <div className="grid">
                {filtered.slice(0, shown).map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
              {filtered.length > shown && (
                <div style={{ textAlign: 'center', marginTop: 36 }}>
                  <button className="btn ghost" onClick={() => setShown((s) => s + 8)}>
                    Load more ({filtered.length - shown})
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {weekAhead.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2>The week ahead</h2>
              <span className="mono muted">{city}</span>
            </div>
            <div className="rowlist">
              {weekAhead.map((e) => (
                <Link to={`/e/${e.id}`} className="row" key={e.id}>
                  <div className="row-date">
                    <span className="mono">{new Date(e.start).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</span>
                    <b>{new Date(e.start).getDate()}</b>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{e.title}</div>
                    <div className="muted" style={{ fontSize: '.9375rem' }}>
                      {fmtTime(e.start)} · {e.venue?.name}
                    </div>
                  </div>
                  <span className="mono">{priceLabel(e)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <div className="section-head">
            <h2>Organizers worth following</h2>
          </div>
          <div className="org-strip">
            {topOrganizers.map((o) => (
              <Link to={`/o/${o.id}`} key={o.id} className="org-tile">
                <span className="org-initial">{o.name[0]}</span>
                <b>{o.name}</b>
                <span className="mono muted">
                  {o.city} · {followerCount(o.id).toLocaleString()} followers
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Elsewhere</h2>
          </div>
          <div className="city-grid">
            {cityCounts.map(({ c, n }) => (
              <Link
                key={c}
                to={`/search?loc=${encodeURIComponent(c)}`}
                className={c === city ? 'on' : ''}
                onClick={() => setCity(c)}
              >
                <span>{c}</span>
                <span className="mono">{n} events</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="cta-band">
        <div className="wrap cta-grid">
          <h2 className="display">Got something on?</h2>
          <div>
            <p>
              Publish an event, sell tickets, scan people in at the door. Free events are free to list; paid tickets carry a small fee
              that you can pass on to buyers.
            </p>
            <div className="hero-actions">
              <Link to="/organizer/events/new" className="btn">
                Create an event
              </Link>
              <Link to="/pricing" className="btn ghost">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
