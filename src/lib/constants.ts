import type { CategoryId, RefundPolicy } from './types';

export const CATEGORIES: { id: CategoryId; label: string; short: string }[] = [
  { id: 'music', label: 'Music', short: 'Music' },
  { id: 'nightlife', label: 'Nightlife', short: 'Nightlife' },
  { id: 'performing-arts', label: 'Performing & visual arts', short: 'Arts' },
  { id: 'food-drink', label: 'Food & drink', short: 'Food' },
  { id: 'business', label: 'Business', short: 'Business' },
  { id: 'tech', label: 'Science & tech', short: 'Tech' },
  { id: 'hobbies', label: 'Hobbies', short: 'Hobbies' },
  { id: 'health', label: 'Health & wellness', short: 'Health' },
  { id: 'sports', label: 'Sports & fitness', short: 'Sports' },
  { id: 'community', label: 'Community', short: 'Community' },
  { id: 'film', label: 'Film & media', short: 'Film' },
  { id: 'dating', label: 'Dating', short: 'Dating' },
  { id: 'holidays', label: 'Holidays', short: 'Holidays' },
  { id: 'classes', label: 'Classes & workshops', short: 'Classes' },
];

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const CITIES = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Austin',
  'San Francisco',
  'London',
  'Toronto',
  'Berlin',
];

export const REFUND_POLICIES: Record<RefundPolicy, string> = {
  none: 'No refunds',
  '1day': 'Refunds up to 1 day before the event',
  '7days': 'Refunds up to 7 days before the event',
  '30days': 'Refunds up to 30 days before the event',
};

export const DATE_FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'weekend', label: 'This weekend' },
  { id: 'week', label: 'This week' },
  { id: 'next-week', label: 'Next week' },
  { id: 'month', label: 'This month' },
] as const;

/** Poster palettes: background, ink, accent. */
export const PALETTES: [string, string, string][] = [
  ['#ff4a1c', '#16130f', '#f4efe4'],
  ['#16130f', '#f4efe4', '#ff4a1c'],
  ['#d9e66b', '#16130f', '#2f4bd8'],
  ['#2f4bd8', '#f4efe4', '#d9e66b'],
  ['#f2c4cf', '#3a0d1a', '#ff4a1c'],
  ['#0f5a46', '#f4efe4', '#f2b134'],
  ['#f2b134', '#16130f', '#0f5a46'],
  ['#e9e3d4', '#16130f', '#c4361c'],
  ['#5b2a86', '#f7e9ff', '#f2b134'],
  ['#9ec9e8', '#0e2236', '#ff4a1c'],
];

export const PATTERN_COUNT = 8;
