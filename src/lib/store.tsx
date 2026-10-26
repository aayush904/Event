import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DB, EventItem, Order, Organizer, User } from './types';
import { createSeed } from './seed';
import { hashPassword, startOfDay, uid } from './format';

const KEY = 'turnout:db:v1';
const SEED_KEY = 'turnout:seeded-at';

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      return refreshSeedDates(db);
    }
  } catch {
    /* fall through to seed */
  }
  try {
    localStorage.setItem(SEED_KEY, startOfDay(new Date()).toISOString());
  } catch {
    /* storage unavailable */
  }
  return createSeed();
}

/** Seed events are relative to the day they were created; roll them forward so the demo never goes stale. */
function refreshSeedDates(db: DB): DB {
  let seeded: string | null = null;
  try {
    seeded = localStorage.getItem(SEED_KEY);
  } catch {
    return db;
  }
  const today = startOfDay(new Date());
  if (!seeded) return db;
  const days = Math.round((today.getTime() - new Date(seeded).getTime()) / 86400000);
  if (days <= 0) return db;
  try {
    localStorage.setItem(SEED_KEY, today.toISOString());
  } catch {
    /* ignore */
  }
  const shift = (iso: string) => new Date(new Date(iso).getTime() + days * 86400000).toISOString();
  return {
    ...db,
    events: db.events.map((e) => (e.id.startsWith('e-') ? { ...e, start: shift(e.start), end: shift(e.end) } : e)),
  };
}

type Result = { ok: true } | { ok: false; error: string };

export interface CheckoutInput {
  eventId: string;
  quantities: Record<string, number>;
  promoCode?: string;
  buyerName: string;
  buyerEmail: string;
  attendeeNames: string[];
  cardLast4?: string;
}

export function priceOrder(event: EventItem, quantities: Record<string, number>, promo?: string) {
  const lines = event.tickets
    .filter((t) => (quantities[t.id] ?? 0) > 0)
    .map((t) => ({ ticketTypeId: t.id, name: t.name, qty: quantities[t.id], unitPrice: t.price }));
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const code = promo ? event.promoCodes.find((p) => p.code.toUpperCase() === promo.toUpperCase()) : undefined;
  const discount = code ? Math.round((subtotal * code.percentOff) / 100) : 0;
  const paidQty = lines.filter((l) => l.unitPrice > 0).reduce((s, l) => s + l.qty, 0);
  const fees = subtotal - discount > 0 ? Math.round((subtotal - discount) * 0.037 + paidQty * 179) : 0;
  return { lines, subtotal, discount, fees, total: subtotal - discount + fees, code };
}

interface Store {
  db: DB;
  user: User | null;
  myOrganizer: Organizer | null;
  setCity: (city: string) => void;
  signup: (name: string, email: string, password: string) => Result;
  login: (email: string, password: string) => Result;
  logout: () => void;
  updateUser: (patch: Partial<Pick<User, 'name' | 'email' | 'city' | 'interests'>>) => void;
  toggleLike: (eventId: string) => boolean;
  toggleFollow: (organizerId: string) => boolean;
  isLiked: (eventId: string) => boolean;
  isFollowing: (organizerId: string) => boolean;
  followerCount: (organizerId: string) => number;
  checkout: (input: CheckoutInput) => { ok: true; order: Order } | { ok: false; error: string };
  refundOrder: (orderId: string) => void;
  saveEvent: (event: EventItem) => void;
  deleteEvent: (eventId: string) => void;
  updateOrganizer: (patch: Partial<Organizer>) => void;
  toggleCheckIn: (orderId: string, attendeeId: string) => void;
  recordView: (eventId: string) => void;
  resetDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* quota or private mode — keep working in memory */
    }
  }, [db]);

  const user = db.users.find((u) => u.id === db.sessionUserId) ?? null;
  const myOrganizer = user ? db.organizers.find((o) => o.id === user.organizerId) ?? null : null;

  const signup = useCallback(
    (name: string, email: string, password: string): Result => {
      const e = email.trim().toLowerCase();
      if (db.users.some((u) => u.email === e)) return { ok: false, error: 'An account with that email already exists.' };
      const id = uid('u-');
      const orgId = uid('o-');
      const newUser: User = {
        id,
        name: name.trim(),
        email: e,
        passwordHash: hashPassword(password),
        city: db.city,
        interests: [],
        organizerId: orgId,
        createdAt: new Date().toISOString(),
      };
      const org: Organizer = { id: orgId, name: `${name.trim()}’s Events`, bio: '', city: db.city, baseFollowers: 0, ownerUserId: id };
      setDb((d) => ({ ...d, users: [...d.users, newUser], organizers: [...d.organizers, org], sessionUserId: id }));
      return { ok: true };
    },
    [db.users, db.city],
  );

  const login = useCallback(
    (email: string, password: string): Result => {
      const u = db.users.find((x) => x.email === email.trim().toLowerCase());
      if (!u || u.passwordHash !== hashPassword(password)) return { ok: false, error: 'That email and password don’t match.' };
      setDb((d) => ({ ...d, sessionUserId: u.id, city: u.city || d.city }));
      return { ok: true };
    },
    [db.users],
  );

  const toggleIn = (map: Record<string, string[]>, key: string, value: string) => {
    const list = map[key] ?? [];
    return { ...map, [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] };
  };

  const store: Store = useMemo(
    () => ({
      db,
      user,
      myOrganizer,
      setCity: (city) => setDb((d) => ({ ...d, city })),
      signup,
      login,
      logout: () => setDb((d) => ({ ...d, sessionUserId: null })),
      updateUser: (patch) =>
        setDb((d) => ({ ...d, users: d.users.map((u) => (u.id === d.sessionUserId ? { ...u, ...patch } : u)) })),
      toggleLike: (eventId) => {
        if (!user) return false;
        setDb((d) => ({ ...d, likes: toggleIn(d.likes, user.id, eventId) }));
        return true;
      },
      toggleFollow: (organizerId) => {
        if (!user) return false;
        setDb((d) => ({ ...d, follows: toggleIn(d.follows, user.id, organizerId) }));
        return true;
      },
      isLiked: (eventId) => !!user && (db.likes[user.id] ?? []).includes(eventId),
      isFollowing: (organizerId) => !!user && (db.follows[user.id] ?? []).includes(organizerId),
      followerCount: (organizerId) => {
        const o = db.organizers.find((x) => x.id === organizerId);
        const local = Object.values(db.follows).filter((l) => l.includes(organizerId)).length;
        return (o?.baseFollowers ?? 0) + local;
      },
      checkout: (input) => {
        if (!user) return { ok: false, error: 'Please log in to check out.' };
        const event = db.events.find((e) => e.id === input.eventId);
        if (!event) return { ok: false, error: 'Event not found.' };
        for (const t of event.tickets) {
          const q = input.quantities[t.id] ?? 0;
          if (q > t.quantity - t.sold) return { ok: false, error: `Only ${t.quantity - t.sold} left for ${t.name}.` };
        }
        const p = priceOrder(event, input.quantities, input.promoCode);
        if (p.lines.length === 0) return { ok: false, error: 'Choose at least one ticket.' };
        let n = 0;
        const attendees = p.lines.flatMap((l) =>
          Array.from({ length: l.qty }, () => ({
            id: uid('a-'),
            ticketTypeId: l.ticketTypeId,
            ticketName: l.name,
            name: input.attendeeNames[n++]?.trim() || input.buyerName,
            checkedIn: false,
          })),
        );
        const order: Order = {
          id: uid('ord-').toUpperCase().replace('ORD-', ''),
          eventId: event.id,
          userId: user.id,
          buyerName: input.buyerName,
          buyerEmail: input.buyerEmail,
          lines: p.lines,
          subtotal: p.subtotal,
          discount: p.discount,
          fees: p.fees,
          total: p.total,
          promoCode: p.code?.code,
          cardLast4: input.cardLast4,
          createdAt: new Date().toISOString(),
          status: 'confirmed',
          attendees,
        };
        setDb((d) => ({
          ...d,
          orders: [order, ...d.orders],
          events: d.events.map((e) =>
            e.id !== event.id
              ? e
              : {
                  ...e,
                  tickets: e.tickets.map((t) => ({ ...t, sold: t.sold + (input.quantities[t.id] ?? 0) })),
                  promoCodes: e.promoCodes.map((pc) => (pc.code === p.code?.code ? { ...pc, uses: pc.uses + 1 } : pc)),
                },
          ),
        }));
        return { ok: true, order };
      },
      refundOrder: (orderId) =>
        setDb((d) => {
          const order = d.orders.find((o) => o.id === orderId);
          if (!order || order.status === 'refunded') return d;
          return {
            ...d,
            orders: d.orders.map((o) => (o.id === orderId ? { ...o, status: 'refunded' } : o)),
            events: d.events.map((e) =>
              e.id !== order.eventId
                ? e
                : {
                    ...e,
                    tickets: e.tickets.map((t) => {
                      const line = order.lines.find((l) => l.ticketTypeId === t.id);
                      return line ? { ...t, sold: Math.max(0, t.sold - line.qty) } : t;
                    }),
                  },
            ),
          };
        }),
      saveEvent: (event) =>
        setDb((d) => ({
          ...d,
          events: d.events.some((e) => e.id === event.id)
            ? d.events.map((e) => (e.id === event.id ? event : e))
            : [event, ...d.events],
        })),
      deleteEvent: (eventId) => setDb((d) => ({ ...d, events: d.events.filter((e) => e.id !== eventId) })),
      updateOrganizer: (patch) =>
        setDb((d) => ({
          ...d,
          organizers: d.organizers.map((o) => (o.id === myOrganizer?.id ? { ...o, ...patch, id: o.id } : o)),
        })),
      toggleCheckIn: (orderId, attendeeId) =>
        setDb((d) => ({
          ...d,
          orders: d.orders.map((o) =>
            o.id !== orderId
              ? o
              : { ...o, attendees: o.attendees.map((a) => (a.id === attendeeId ? { ...a, checkedIn: !a.checkedIn } : a)) },
          ),
        })),
      recordView: (eventId) =>
        setDb((d) => ({ ...d, events: d.events.map((e) => (e.id === eventId ? { ...e, views: e.views + 1 } : e)) })),
      resetDemo: () => {
        try {
          localStorage.setItem(SEED_KEY, startOfDay(new Date()).toISOString());
        } catch {
          /* ignore */
        }
        setDb(createSeed());
      },
    }),
    [db, user, myOrganizer, signup, login],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
}

export const organizerOf = (db: DB, e: EventItem) => db.organizers.find((o) => o.id === e.organizerId);

export const minPrice = (e: EventItem) => {
  const prices = e.tickets.map((t) => t.price);
  return prices.length ? Math.min(...prices) : 0;
};

export const remaining = (e: EventItem) => e.tickets.reduce((s, t) => s + Math.max(0, t.quantity - t.sold), 0);
export const capacity = (e: EventItem) => e.tickets.reduce((s, t) => s + t.quantity, 0);

export const isPast = (e: EventItem) => new Date(e.end).getTime() < Date.now();

export const publicEvents = (db: DB) =>
  db.events.filter((e) => e.status === 'published' && !isPast(e)).sort((a, b) => a.start.localeCompare(b.start));
