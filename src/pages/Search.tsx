import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { minPrice, organizerOf, publicEvents, useStore } from '../lib/store';
import { CATEGORIES, CITIES, DATE_FILTERS, categoryLabel } from '../lib/constants';
import { inDateRange } from '../lib/format';
import EventCard from '../components/EventCard';
import { SearchBar } from '../components/Layout';

export default function Search() {
  const { db } = useStore();
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const q = params.get('q') ?? '';
  const loc = params.get('loc') ?? db.city;
  const cat = params.get('cat') ?? '';
  const date = params.get('date') ?? '';
  const on = params.get('on') ?? '';
  const price = params.get('price') ?? '';
  const format = params.get('format') ?? '';
  const sort = params.get('sort') ?? 'date';

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'date' && value !== 'custom') next.delete('on');
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    const needle = q.toLowerCase();
    let list = publicEvents(db).filter((e) => {
      if (loc !== 'Anywhere') {
        if (loc === 'Online' ? e.format !== 'online' : e.city !== loc && !(format === 'online' && e.format === 'online')) return false;
      }
      if (cat && e.category !== cat) return false;
      if (date && !inDateRange(e.start, date, on)) return false;
      if (price === 'free' && !e.tickets.some((t) => t.price === 0)) return false;
      if (price === 'paid' && e.tickets.every((t) => t.price === 0)) return false;
      if (format && e.format !== format) return false;
      if (needle) {
        const org = organizerOf(db, e)?.name ?? '';
        const hay = [e.title, e.summary, e.tags.join(' '), e.venue?.name, e.venue?.address, org, categoryLabel(e.category)]
          .join(' ')
          .toLowerCase();
        if (!needle.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    if (sort === 'popular') list = [...list].sort((a, b) => b.views - a.views);
    if (sort === 'price') list = [...list].sort((a, b) => minPrice(a) - minPrice(b));
    return list;
  }, [db, q, loc, cat, date, on, price, format, sort]);

  const activeCount = [cat, date, price, format].filter(Boolean).length;

  const radio = (name: string, current: string, options: { id: string; label: string }[]) => (
    <div className="filter-group">
      {[{ id: '', label: 'Any' }, ...options].map((o) => (
        <label key={o.id} className="check">
          <input type="radio" name={name} checked={current === o.id} onChange={() => set(name, o.id)} />
          {o.label}
        </label>
      ))}
    </div>
  );

  return (
    <div className="wrap">
      <SearchBar className="mobile-search" />
      <h1 className="page-title">
        {q ? <>“{q}”</> : cat ? categoryLabel(cat) : 'All events'}
        <span className="muted"> {loc === 'Anywhere' ? 'everywhere' : loc === 'Online' ? 'online' : `in ${loc}`}</span>
      </h1>
      <div className="search-toolbar">
        <span className="mono">
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn ghost sm filters-toggle" onClick={() => setShowFilters((s) => !s)}>
            Filters{activeCount ? ` (${activeCount})` : ''}
          </button>
          <label className="mono" htmlFor="sort">
            Sort
          </label>
          <select id="sort" className="select" style={{ minHeight: 36, width: 'auto' }} value={sort} onChange={(e) => set('sort', e.target.value)}>
            <option value="date">Soonest</option>
            <option value="popular">Most popular</option>
            <option value="price">Lowest price</option>
          </select>
        </div>
      </div>

      <div className="search-layout">
        <aside className={`filters ${showFilters ? 'open' : ''}`}>
          <div className="filters-head">
            <b>Filters</b>
            {activeCount > 0 && (
              <button
                className="linkbtn mono"
                onClick={() => {
                  const next = new URLSearchParams();
                  if (q) next.set('q', q);
                  next.set('loc', loc);
                  setParams(next);
                }}
              >
                Clear all
              </button>
            )}
          </div>

          <fieldset>
            <legend className="label">Location</legend>
            <select className="select" value={loc} onChange={(e) => set('loc', e.target.value)}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
              <option>Online</option>
              <option>Anywhere</option>
            </select>
          </fieldset>

          <fieldset>
            <legend className="label">Date</legend>
            {radio('date', date, [...DATE_FILTERS, { id: 'custom', label: 'Pick a date' }])}
            {date === 'custom' && <input type="date" className="input" value={on} onChange={(e) => set('on', e.target.value)} />}
          </fieldset>

          <fieldset>
            <legend className="label">Category</legend>
            <select className="select" value={cat} onChange={(e) => set('cat', e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset>
            <legend className="label">Price</legend>
            {radio('price', price, [
              { id: 'free', label: 'Free' },
              { id: 'paid', label: 'Paid' },
            ])}
          </fieldset>

          <fieldset>
            <legend className="label">Format</legend>
            {radio('format', format, [
              { id: 'venue', label: 'In person' },
              { id: 'online', label: 'Online' },
            ])}
          </fieldset>
        </aside>

        <section>
          {results.length === 0 ? (
            <div className="empty">
              <h3>No events match those filters.</h3>
              <p className="muted">Widen the date range, switch city, or search for something broader.</p>
              <button className="btn ghost" onClick={() => setParams(new URLSearchParams({ loc: 'Anywhere' }))}>
                Show everything
              </button>
            </div>
          ) : (
            <div className="grid">
              {results.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
