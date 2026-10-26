export type CategoryId =
  | 'music'
  | 'nightlife'
  | 'performing-arts'
  | 'food-drink'
  | 'business'
  | 'tech'
  | 'hobbies'
  | 'health'
  | 'sports'
  | 'community'
  | 'film'
  | 'dating'
  | 'holidays'
  | 'classes';

export type Cover =
  | { kind: 'poster'; palette: number; pattern: number }
  | { kind: 'image'; src: string };

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  /** Price in cents. 0 = free. */
  price: number;
  quantity: number;
  sold: number;
  maxPerOrder: number;
  /** Optional sales end (ISO). Defaults to event start. */
  salesEnd?: string;
}

export interface PromoCode {
  code: string;
  percentOff: number;
  uses: number;
  limit?: number;
}

export interface AgendaItem {
  time: string;
  title: string;
}

export type RefundPolicy = 'none' | '1day' | '7days' | '30days';

export interface Venue {
  name: string;
  address: string;
  city: string;
}

export interface EventItem {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: CategoryId;
  tags: string[];
  organizerId: string;
  start: string;
  end: string;
  format: 'venue' | 'online';
  venue?: Venue;
  onlineUrl?: string;
  /** City used for location browsing. "Online" for online events. */
  city: string;
  cover: Cover;
  tickets: TicketType[];
  promoCodes: PromoCode[];
  refundPolicy: RefundPolicy;
  agenda: AgendaItem[];
  ageLimit?: string;
  status: 'published' | 'draft' | 'cancelled';
  createdAt: string;
  views: number;
}

export interface Organizer {
  id: string;
  name: string;
  bio: string;
  city: string;
  /** Followers that exist outside this browser (seed data). */
  baseFollowers: number;
  ownerUserId?: string;
  website?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  city: string;
  interests: CategoryId[];
  organizerId?: string;
  createdAt: string;
}

export interface Attendee {
  id: string;
  ticketTypeId: string;
  ticketName: string;
  name: string;
  checkedIn: boolean;
}

export interface OrderLine {
  ticketTypeId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  eventId: string;
  userId: string;
  buyerName: string;
  buyerEmail: string;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  fees: number;
  total: number;
  promoCode?: string;
  cardLast4?: string;
  createdAt: string;
  status: 'confirmed' | 'refunded';
  attendees: Attendee[];
}

export interface DB {
  version: number;
  events: EventItem[];
  organizers: Organizer[];
  users: User[];
  orders: Order[];
  likes: Record<string, string[]>;
  follows: Record<string, string[]>;
  sessionUserId: string | null;
  city: string;
}
