import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import { CATEGORIES, CITIES } from '../lib/constants';
import { Mark, SearchIcon } from './Icons';

export function SearchBar({ className = '' }: { className?: string }) {
  const { db, setCity } = useStore();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [loc, setLoc] = useState(params.get('loc') ?? db.city);

  useEffect(() => {
    setQ(params.get('q') ?? '');
    setLoc(params.get('loc') ?? db.city);
  }, [params, db.city]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (q.trim()) next.set('q', q.trim());
    else next.delete('q');
    next.set('loc', loc);
    if (loc !== 'Online' && loc !== 'Anywhere') setCity(loc);
    nav(`/search?${next.toString()}`);
  };

  return (
    <form className={`searchbar ${className}`} onSubmit={submit} role="search">
      <label className="sr-only" htmlFor={`q-${className}`}>
        Search events
      </label>
      <input id={`q-${className}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events, venues, organizers" />
      <label className="sr-only" htmlFor={`loc-${className}`}>
        Location
      </label>
      <select id={`loc-${className}`} value={loc} onChange={(e) => setLoc(e.target.value)}>
        {CITIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
        <option>Online</option>
        <option>Anywhere</option>
      </select>
      <button aria-label="Search">
        <SearchIcon />
      </button>
    </form>
  );
}

function UserMenu() {
  const { user, logout, db } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (!user) return null;
  const tickets = db.orders.filter((o) => o.userId === user.id && o.status === 'confirmed').length;
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="usermenu" ref={ref}>
      <button className="avatar" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Account menu">
        {initials}
      </button>
      {open && (
        <div className="menu">
          <div className="who">
            <b>{user.name}</b>
            <div className="mono muted">{user.email}</div>
          </div>
          <Link to="/tickets">Tickets {tickets > 0 && <span className="mono muted">({tickets})</span>}</Link>
          <Link to="/likes">Likes</Link>
          <Link to="/following">Following</Link>
          <hr />
          <Link to="/organizer/events">Manage my events</Link>
          <Link to="/organizer/events/new">Create an event</Link>
          <Link to="/organizer/profile">Organizer profile</Link>
          <hr />
          <Link to="/account">Account settings</Link>
          <button
            onClick={() => {
              logout();
              nav('/');
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { user } = useStore();
  const loc = useLocation();
  const next = encodeURIComponent(loc.pathname + loc.search);
  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <span>Tickets for small rooms, big nights and everything between.</span>
          <span className="hide-xs">
            <Link to="/help">Help centre</Link>
          </span>
        </div>
      </div>
      <header className="header">
        <div className="wrap">
          <Link to="/" className="logo" aria-label="Turnout home">
            <span className="logo-mark">
              <Mark />
            </span>
            Turnout
          </Link>
          <SearchBar className="desk" />
          <nav className="nav">
            <NavLink to="/search" className="hide-sm">
              Find events
            </NavLink>
            <NavLink to="/organizer/events/new" className="keep">
              Create
            </NavLink>
            {user ? (
              <>
                <NavLink to="/likes" className="hide-sm">
                  Likes
                </NavLink>
                <NavLink to="/tickets" className="hide-sm">
                  Tickets
                </NavLink>
                <UserMenu />
              </>
            ) : (
              <>
                <NavLink to={`/login?next=${next}`}>Log in</NavLink>
                <Link to={`/signup?next=${next}`} className="btn sm">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <h4>Turnout</h4>
            <p style={{ maxWidth: 340, margin: 0, color: '#d8cfbd' }}>
              A ticketing platform for people who put on things. Discover what’s on, or publish your own event in a few minutes.
            </p>
          </div>
          <div>
            <h4>Discover</h4>
            <ul>
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link to={`/search?cat=${c.id}`}>{c.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Organize</h4>
            <ul>
              <li>
                <Link to="/organizer/events/new">Create an event</Link>
              </li>
              <li>
                <Link to="/organizer/events">Manage events</Link>
              </li>
              <li>
                <Link to="/pricing">Pricing</Link>
              </li>
              <li>
                <Link to="/help">Organizer help</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Cities</h4>
            <ul>
              {CITIES.slice(0, 6).map((c) => (
                <li key={c}>
                  <Link to={`/search?loc=${encodeURIComponent(c)}`}>{c}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-big">Show up.</div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} Turnout. Demo project — no real payments are taken.</span>
          <span>
            <Link to="/help">Help</Link> · <Link to="/help#terms">Terms</Link> · <Link to="/help#privacy">Privacy</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useStore();
  const loc = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return children;
}
