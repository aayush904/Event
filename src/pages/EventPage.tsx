import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { capacity, isPast, minPrice, organizerOf, publicEvents, remaining, useStore } from '../lib/store';
import { REFUND_POLICIES, categoryLabel } from '../lib/constants';
import { fmtDate, fmtRange, fmtTime, money } from '../lib/format';
import Poster from '../components/Poster';
import EventCard, { LikeButton, priceLabel } from '../components/EventCard';
import Checkout from '../components/Checkout';
import { CalIcon, ClockIcon, GlobeIcon, PinIcon, RefundIcon, ShareIcon, TicketIcon } from '../components/Icons';
import { useToast } from '../components/Toast';
import { downloadIcs, googleCalendarUrl } from '../lib/ics';
import { NotFound } from './Static';

export function FollowButton({ organizerId, small = false }: { organizerId: string; small?: boolean }) {
  const { isFollowing, toggleFollow, user, myOrganizer } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  if (myOrganizer?.id === organizerId) return null;
  const on = isFollowing(organizerId);
  return (
    <button
      className={`btn ${on ? 'ghost' : ''} ${small ? 'sm' : ''}`}
      aria-pressed={on}
      onClick={() => {
        if (!user) return nav(`/login?next=${encodeURIComponent(location.pathname)}`);
        toggleFollow(organizerId);
        toast(on ? 'Unfollowed' : 'Following — new events will show up in your feed');
      }}
    >
      {on ? 'Following' : 'Follow'}
    </button>
  );
}

export default function EventPage() {
  const { id } = useParams();
  const { db, user, recordView, followerCount, myOrganizer } = useStore();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const event = db.events.find((e) => e.id === id);

  useEffect(() => {
    if (id) recordView(id);
  }, [id]); // recordView changes identity on every store update; only count a view per event visit

  useEffect(() => {
    if (params.get('checkout') === '1' && user) {
      setOpen(true);
      params.delete('checkout');
      setParams(params, { replace: true });
    }
  }, [params, user, setParams]);

  if (!event) return <NotFound />;
  const isOwner = myOrganizer?.id === event.organizerId;
  if (event.status === 'draft' && !isOwner) return <NotFound />;

  const org = organizerOf(db, event);
  const left = remaining(event);
  const past = isPast(event);
  const cancelled = event.status === 'cancelled';
  const durationH = (new Date(event.end).getTime() - new Date(event.start).getTime()) / 3600000;
  const more = publicEvents(db).filter((e) => e.id !== event.id && e.organizerId === event.organizerId).slice(0, 4);
  const similar = publicEvents(db)
    .filter((e) => e.id !== event.id && e.organizerId !== event.organizerId && (e.category === event.category || e.city === event.city))
    .sort((a, b) => Number(b.category === event.category) - Number(a.category === event.category))
    .slice(0, 4);

  const getTickets = () => {
    if (!user) return nav(`/login?next=${encodeURIComponent(`/e/${event.id}?checkout=1`)}`);
    setOpen(true);
  };

  const share = async () => {
    const url = `${location.origin}/e/${event.id}`;
    try {
      if (navigator.share) await navigator.share({ title: event.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link copied');
      }
    } catch {
      /* user cancelled share */
    }
  };

  const mapsUrl = event.venue ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue.name}, ${event.venue.address}`)}` : '';
  const cta = cancelled ? 'Event cancelled' : past ? 'Event ended' : left === 0 ? 'Sold out' : minPrice(event) === 0 && event.tickets.every((t) => t.price === 0) ? 'Reserve a spot' : 'Get tickets';
  const disabled = cancelled || past || left === 0;

  return (
    <article className="event-page">
      <div className="wrap">
        {event.status === 'draft' && (
          <div className="banner">
            Preview — this event is a draft and only you can see it. <Link to={`/organizer/events/${event.id}/edit`}>Edit</Link>
          </div>
        )}
        {cancelled && <div className="banner">This event has been cancelled by the organizer.</div>}
        <nav className="crumbs mono">
          <Link to="/">Home</Link> / <Link to={`/search?loc=${encodeURIComponent(event.city)}`}>{event.city}</Link> /{' '}
          <Link to={`/search?cat=${event.category}`}>{categoryLabel(event.category)}</Link>
        </nav>
        <div className="event-hero">
          <Poster size="lg" cover={event.cover} title={event.title} category={event.category} dateLabel={fmtDate(event.start, 'day')} />
        </div>

        <div className="event-layout">
          <div className="event-main">
            <div className="event-date mono">{fmtDate(event.start, 'long')}</div>
            <h1 className="event-title">{event.title}</h1>
            <p className="event-summary">{event.summary}</p>

            <div className="event-actions">
              <LikeButton id={event.id} className="inline" />
              <button className="btn ghost sm" onClick={share}>
                <ShareIcon size={16} /> Share
              </button>
              {isOwner && (
                <>
                  <Link className="btn ghost sm" to={`/organizer/events/${event.id}/edit`}>
                    Edit event
                  </Link>
                  <Link className="btn ghost sm" to={`/organizer/events/${event.id}`}>
                    Dashboard
                  </Link>
                </>
              )}
            </div>

            {org && (
              <div className="org-card">
                <Link to={`/o/${org.id}`} className="org-initial lg">
                  {org.name[0]}
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono muted">Hosted by</div>
                  <Link to={`/o/${org.id}`}>
                    <b style={{ fontSize: '1.125rem' }}>{org.name}</b>
                  </Link>
                  <div className="mono muted">{followerCount(org.id).toLocaleString()} followers</div>
                </div>
                <FollowButton organizerId={org.id} />
              </div>
            )}

            <section className="event-block">
              <h2>Date and time</h2>
              <div className="fact">
                <CalIcon />
                <div>
                  <div>{fmtRange(event.start, event.end)}</div>
                  <div className="cal-links">
                    <button className="linkbtn mono" onClick={() => downloadIcs(event)}>
                      Download .ics
                    </button>
                    <a className="mono" href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">
                      Google Calendar
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section className="event-block">
              <h2>Location</h2>
              {event.format === 'online' ? (
                <div className="fact">
                  <GlobeIcon />
                  <div>
                    <div>Online event</div>
                    <div className="muted">The link is shared with ticket holders by email and on their ticket.</div>
                  </div>
                </div>
              ) : (
                <div className="fact">
                  <PinIcon />
                  <div>
                    <b>{event.venue?.name}</b>
                    <div>{event.venue?.address}</div>
                    <a className="mono" href={mapsUrl} target="_blank" rel="noreferrer">
                      Open in maps ↗
                    </a>
                  </div>
                </div>
              )}
            </section>

            <section className="event-block">
              <h2>Good to know</h2>
              <ul className="facts">
                <li>
                  <ClockIcon /> {durationH >= 1 ? `${+durationH.toFixed(1)} hours` : `${Math.round(durationH * 60)} minutes`}
                </li>
                <li>
                  {event.format === 'online' ? <GlobeIcon /> : <PinIcon />} {event.format === 'online' ? 'Online' : 'In person'}
                </li>
                <li>
                  <TicketIcon /> {event.ageLimit ? `Ages ${event.ageLimit}` : 'All ages'}
                </li>
                <li>
                  <RefundIcon /> {REFUND_POLICIES[event.refundPolicy]}
                </li>
              </ul>
            </section>

            <section className="event-block">
              <h2>About this event</h2>
              <div className="prose">
                {event.description.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            {event.agenda.length > 0 && (
              <section className="event-block">
                <h2>Agenda</h2>
                <ol className="agenda">
                  {event.agenda.map((a, i) => (
                    <li key={i}>
                      <span className="mono">{a.time}</span>
                      <span>{a.title}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {event.tags.length > 0 && (
              <section className="event-block">
                <h2>Tags</h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link className="tag" to={`/search?cat=${event.category}`}>
                    {categoryLabel(event.category)}
                  </Link>
                  {event.tags.map((t) => (
                    <Link className="tag" key={t} to={`/search?q=${encodeURIComponent(t)}&loc=Anywhere`}>
                      #{t}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="ticket-panel">
            <div className="ticket-panel-inner">
              <div className="eyebrow">Tickets</div>
              <div className="tp-price">{priceLabel(event)}</div>
              <ul className="tp-tiers">
                {event.tickets.map((t) => (
                  <li key={t.id}>
                    <span>{t.name}</span>
                    <span className="mono">{t.quantity - t.sold <= 0 ? 'Sold out' : money(t.price, { free: true })}</span>
                  </li>
                ))}
              </ul>
              <button className="btn accent block" disabled={disabled} onClick={getTickets}>
                {cta}
              </button>
              {!disabled && left < capacity(event) * 0.15 && <p className="mono tp-note">Selling fast — {left} left</p>}
              <p className="mono muted tp-note">
                {fmtDate(event.start, 'day')} · {fmtTime(event.start)}
              </p>
            </div>
          </aside>
        </div>

        {more.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2>More from {org?.name}</h2>
              <Link to={`/o/${org?.id}`} className="mono">
                Organizer page →
              </Link>
            </div>
            <div className="grid">
              {more.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2>You might also like</h2>
            </div>
            <div className="grid">
              {similar.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="mobile-buy">
        <div>
          <b>{priceLabel(event)}</b>
          <div className="mono muted">{fmtDate(event.start, 'day')}</div>
        </div>
        <button className="btn accent" disabled={disabled} onClick={getTickets}>
          {cta}
        </button>
      </div>

      {open && <Checkout event={event} onClose={() => setOpen(false)} />}
    </article>
  );
}
