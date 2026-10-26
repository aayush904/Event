import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import { CATEGORIES, CITIES } from '../lib/constants';
import { useToast } from '../components/Toast';
import type { CategoryId } from '../lib/types';

export default function Account() {
  const { user, updateUser, setCity, resetDemo, logout } = useStore();
  const [params] = useSearchParams();
  const toast = useToast();
  const nav = useNavigate();
  const [name, setName] = useState(user!.name);
  const [email, setEmail] = useState(user!.email);
  const [city, setCityField] = useState(user!.city);
  const [interests, setInterests] = useState<CategoryId[]>(user!.interests);
  const welcome = params.get('welcome') === '1';

  const save = (e: FormEvent) => {
    e.preventDefault();
    updateUser({ name: name.trim(), email: email.trim().toLowerCase(), city, interests });
    setCity(city);
    toast('Settings saved');
    if (welcome) nav('/');
  };

  const toggle = (id: CategoryId) => setInterests((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  return (
    <div className="wrap narrow">
      <h1 className="page-title">{welcome ? `Welcome, ${user!.name.split(' ')[0]}` : 'Account'}</h1>
      {welcome && <p className="muted">Pick a few interests and we’ll tune the “For you” tab on the home page.</p>}
      <form onSubmit={save} style={{ marginTop: 24 }}>
        <div className="two">
          <label className="field">
            <span>Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        </div>
        <label className="field">
          <span>Home city</span>
          <select className="select" value={city} onChange={(e) => setCityField(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>Interests</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((c) => (
              <button type="button" key={c.id} className={`chip ${interests.includes(c.id) ? 'on' : ''}`} onClick={() => toggle(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <button className="btn accent">Save changes</button>
      </form>

      <section className="section">
        <div className="section-head">
          <h2>Demo data</h2>
        </div>
        <p className="muted">
          Everything in this demo lives in your browser. Resetting restores the sample events and clears your orders, likes and created events.
        </p>
        <button
          className="btn danger"
          onClick={() => {
            if (confirm('Reset all demo data? This logs you out.')) {
              resetDemo();
              logout();
              nav('/');
            }
          }}
        >
          Reset demo data
        </button>
      </section>
    </div>
  );
}
