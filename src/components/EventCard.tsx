import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { EventItem } from '../lib/types';
import { minPrice, organizerOf, remaining, useStore } from '../lib/store';
import { fmtDate, fmtWhen, money } from '../lib/format';
import Poster from './Poster';
import { HeartIcon } from './Icons';
import { useToast } from './Toast';

export function useLike() {
  const { toggleLike, isLiked, user } = useStore();
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  return (id: string) => {
    if (!user) {
      nav(`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`);
      return;
    }
    const was = isLiked(id);
    toggleLike(id);
    toast(was ? 'Removed from likes' : 'Saved to likes', was ? undefined : { to: '/likes', label: 'View' });
  };
}

export function LikeButton({ id, className = '' }: { id: string; className?: string }) {
  const { isLiked } = useStore();
  const like = useLike();
  const on = isLiked(id);
  return (
    <button
      className={`like ${on ? 'on' : ''} ${className}`}
      aria-pressed={on}
      aria-label={on ? 'Unlike event' : 'Like event'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        like(id);
      }}
    >
      <HeartIcon filled={on} />
    </button>
  );
}

export function priceLabel(e: EventItem) {
  const min = minPrice(e);
  const max = Math.max(...e.tickets.map((t) => t.price), 0);
  if (max === 0) return 'Free';
  if (min === 0) return `Free – ${money(max)}`;
  return min === max ? money(min) : `From ${money(min)}`;
}

export default function EventCard({ event }: { event: EventItem }) {
  const { db, followerCount } = useStore();
  const org = organizerOf(db, event);
  const left = remaining(event);
  const cap = event.tickets.reduce((s, t) => s + t.quantity, 0);
  const almost = left > 0 && left / cap < 0.12;
  return (
    <Link to={`/e/${event.id}`} className="card">
      <div style={{ position: 'relative' }}>
        <Poster cover={event.cover} title={event.title} category={event.category} dateLabel={fmtDate(event.start)} />
        {left === 0 && <span className="pill sold-out">Sold out</span>}
        {almost && <span className="pill accent sold-out">Almost full</span>}
      </div>
      <LikeButton id={event.id} />
      <div className="card-body">
        <div className="card-title">{event.title}</div>
        <div className="card-when">{fmtWhen(event.start)}</div>
        <div className="card-where">{event.format === 'online' ? 'Online event' : `${event.venue?.name} · ${event.city}`}</div>
        <div className="card-meta">
          <span className="card-price">{priceLabel(event)}</span>
          {org && (
            <>
              <span>·</span>
              <span>
                {org.name} · {followerCount(org.id).toLocaleString()} followers
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
