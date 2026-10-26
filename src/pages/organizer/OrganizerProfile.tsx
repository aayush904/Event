import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { CITIES } from '../../lib/constants';
import { useToast } from '../../components/Toast';

export default function OrganizerProfile() {
  const { myOrganizer, updateOrganizer } = useStore();
  const toast = useToast();
  const [name, setName] = useState(myOrganizer?.name ?? '');
  const [bio, setBio] = useState(myOrganizer?.bio ?? '');
  const [city, setCity] = useState(myOrganizer?.city ?? CITIES[0]);
  const [website, setWebsite] = useState(myOrganizer?.website ?? '');

  if (!myOrganizer) return null;

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateOrganizer({ name: name.trim(), bio: bio.trim(), city, website: website.trim() || undefined });
    toast('Organizer profile saved', { to: `/o/${myOrganizer.id}`, label: 'View' });
  };

  return (
    <div className="wrap narrow">
      <h1 className="page-title">Organizer profile</h1>
      <p className="muted">
        This is what people see on your events and on your <Link to={`/o/${myOrganizer.id}`}>public page</Link>.
      </p>
      <form onSubmit={save} style={{ marginTop: 24 }}>
        <label className="field">
          <span>Organizer name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Bio</span>
          <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Who you are and what kind of events you run." />
        </label>
        <div className="two">
          <label className="field">
            <span>Based in</span>
            <select className="select" value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Website</span>
            <input className="input" type="url" placeholder="https://" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>
        <button className="btn accent">Save profile</button>
      </form>
    </div>
  );
}
