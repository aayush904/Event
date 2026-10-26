import { Link } from 'react-router-dom';
import { isPast, publicEvents, useStore } from '../lib/store';
import EventCard from '../components/EventCard';
import { FollowButton } from './EventPage';

export function Likes() {
  const { db, user } = useStore();
  const ids = db.likes[user!.id] ?? [];
  const events = db.events.filter((e) => ids.includes(e.id) && e.status !== 'draft');
  const upcoming = events.filter((e) => !isPast(e)).sort((a, b) => a.start.localeCompare(b.start));
  const past = events.filter(isPast);
  return (
    <div className="wrap">
      <h1 className="page-title">Likes</h1>
      <p className="muted">Events you’ve saved. Tap the heart on any event to add it here.</p>
      {events.length === 0 ? (
        <div className="empty" style={{ marginTop: 24 }}>
          <h3>No likes yet.</h3>
          <Link to="/search" className="btn">
            Browse events
          </Link>
        </div>
      ) : (
        <>
          <div className="grid" style={{ marginTop: 28 }}>
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
          {past.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>Already happened</h2>
              </div>
              <div className="grid" style={{ opacity: 0.6 }}>
                {past.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export function Following() {
  const { db, user, followerCount } = useStore();
  const ids = db.follows[user!.id] ?? [];
  const orgs = db.organizers.filter((o) => ids.includes(o.id));
  const feed = publicEvents(db).filter((e) => ids.includes(e.organizerId));
  return (
    <div className="wrap">
      <h1 className="page-title">Following</h1>
      {orgs.length === 0 ? (
        <div className="empty" style={{ marginTop: 24 }}>
          <h3>You’re not following anyone yet.</h3>
          <p className="muted">Follow organizers to see their new events first.</p>
          <Link to="/" className="btn">
            Discover organizers
          </Link>
        </div>
      ) : (
        <>
          <div className="org-strip" style={{ marginTop: 24 }}>
            {orgs.map((o) => (
              <div key={o.id} className="org-tile">
                <Link to={`/o/${o.id}`} className="org-initial">
                  {o.name[0]}
                </Link>
                <Link to={`/o/${o.id}`}>
                  <b>{o.name}</b>
                </Link>
                <span className="mono muted">{followerCount(o.id).toLocaleString()} followers</span>
                <FollowButton organizerId={o.id} small />
              </div>
            ))}
          </div>
          <section className="section">
            <div className="section-head">
              <h2>Upcoming from people you follow</h2>
            </div>
            {feed.length === 0 ? (
              <p className="muted">Nothing announced yet.</p>
            ) : (
              <div className="grid">
                {feed.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
