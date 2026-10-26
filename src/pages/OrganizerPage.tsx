import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isPast, useStore } from '../lib/store';
import EventCard from '../components/EventCard';
import { FollowButton } from './EventPage';
import { NotFound } from './Static';
import { fmtDate } from '../lib/format';

export default function OrganizerPage() {
  const { id } = useParams();
  const { db, followerCount, myOrganizer } = useStore();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const org = db.organizers.find((o) => o.id === id);
  if (!org) return <NotFound />;

  const events = db.events.filter((e) => e.organizerId === org.id && e.status !== 'draft');
  const upcoming = events.filter((e) => !isPast(e)).sort((a, b) => a.start.localeCompare(b.start));
  const past = events.filter(isPast).sort((a, b) => b.start.localeCompare(a.start));
  const list = tab === 'upcoming' ? upcoming : past;
  const sold = events.reduce((s, e) => s + e.tickets.reduce((x, t) => x + t.sold, 0), 0);

  return (
    <div className="wrap">
      <header className="org-header">
        <span className="org-initial xl">{org.name[0]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">Organizer · {org.city}</div>
          <h1 className="page-title" style={{ marginTop: 8 }}>
            {org.name}
          </h1>
          {org.bio && <p className="org-bio">{org.bio}</p>}
          {org.website && (
            <a className="mono" href={org.website} target="_blank" rel="noreferrer">
              {org.website.replace(/^https?:\/\//, '')} ↗
            </a>
          )}
        </div>
        <div className="org-side">
          <div className="stats" style={{ marginBottom: 14 }}>
            <div className="stat">
              <span className="label">Followers</span>
              <b>{followerCount(org.id).toLocaleString()}</b>
            </div>
            <div className="stat">
              <span className="label">Tickets sold</span>
              <b>{sold.toLocaleString()}</b>
            </div>
          </div>
          {myOrganizer?.id === org.id ? (
            <Link to="/organizer/profile" className="btn block">
              Edit profile
            </Link>
          ) : (
            <FollowButton organizerId={org.id} />
          )}
        </div>
      </header>

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
          <h3>{tab === 'upcoming' ? 'No upcoming events.' : 'No past events yet.'}</h3>
          <p className="muted">Follow {org.name} to hear when something new goes on sale.</p>
        </div>
      ) : tab === 'upcoming' ? (
        <div className="grid">
          {list.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      ) : (
        <div className="rowlist">
          {list.map((e) => (
            <Link to={`/e/${e.id}`} className="row" key={e.id}>
              <div className="row-date">
                <span className="mono">{fmtDate(e.start)}</span>
              </div>
              <b>{e.title}</b>
              <span className="mono muted">{e.city}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
