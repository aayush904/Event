import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../lib/store';

function useNext() {
  const [params] = useSearchParams();
  const next = params.get('next') ?? '/';
  // Only allow in-app redirects.
  return next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

function AuthShell({ title, aside, children }: { title: string; aside: string; children: React.ReactNode }) {
  return (
    <div className="wrap auth">
      <div className="auth-art">
        <div className="display">{aside}</div>
      </div>
      <div className="auth-form">
        <h1 className="page-title" style={{ marginTop: 0 }}>
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}

export function Login() {
  const { login, user } = useStore();
  const next = useNext();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) return <Navigate to={next} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) setError(res.error);
    else nav(next, { replace: true });
  };

  return (
    <AuthShell title="Log in" aside="Good to see you again.">
      <form onSubmit={submit}>
        {error && <p className="error">{error}</p>}
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button className="btn accent block">Log in</button>
      </form>
      <div className="demo-hint mono">
        Demo account: demo@turnout.test / demo1234{' '}
        <button
          className="linkbtn"
          onClick={() => {
            setEmail('demo@turnout.test');
            setPassword('demo1234');
          }}
        >
          Fill in
        </button>
      </div>
      <p>
        New here? <Link to={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link>
      </p>
    </AuthShell>
  );
}

export function Signup() {
  const { signup, user } = useStore();
  const next = useNext();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) return <Navigate to={next} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Tell us your name.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    const res = signup(name, email, password);
    if (!res.ok) setError(res.error);
    else nav(next === '/' ? '/account?welcome=1' : next, { replace: true });
  };

  return (
    <AuthShell title="Sign up" aside="Find your people. Or sell them tickets.">
      <form onSubmit={submit}>
        {error && <p className="error">{error}</p>}
        <label className="field">
          <span>Full name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <small>At least 8 characters.</small>
        </label>
        <button className="btn accent block">Create account</button>
      </form>
      <p>
        Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
      </p>
    </AuthShell>
  );
}
