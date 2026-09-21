import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import AlertIcon from '../../components/icons/AlertIcon';
import CheckIcon from '../../components/icons/CheckIcon';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import './Portal.css';
import './PortalLoginRegister.css';
import './PortalPasswordReset.css';

export default function PortalPasswordReset({ reset = false }) {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const validToken = /^[a-f0-9]{64}$/.test(token);

  useEffect(() => {
    if (reset && window.location.hash) {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    }
  }, [reset]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (reset && password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${base}/api/auth/${reset ? 'reset-password' : 'forgot-password'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reset ? { token, password } : { email: email.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to reset your password. Please try again.');
      setMessage(data.message);
      setPassword(''); setConfirm('');
    } catch (err) {
      setError(err instanceof TypeError || err instanceof SyntaxError ? 'Unable to reach the service. Please try again.' : err.message);
    } finally { setBusy(false); }
  }

  return <div className="portal-page portal-auth-page password-reset-page">
    <div className="portal-auth-stage">
      <PortalHeader />
      <main className="portal-main"><div className="auth-container"><div className="auth-card">
        <div className="password-reset-heading">
        <h1 className="auth-title">{reset ? 'Choose a new password' : 'Forgot password?'}</h1>
        <p className="auth-subtitle">{reset ? 'Enter your new password below.' : 'Enter your account email and we will send you a reset link.'}</p>
        </div>
        {error && <div className="password-reset-notice password-reset-error" role="alert"><span aria-hidden="true"><AlertIcon color="currentColor" /></span><p>{error}</p></div>}
        {message && <div className="password-reset-notice password-reset-success" role="status"><span aria-hidden="true"><CheckIcon color="currentColor" /></span><p>{message}</p></div>}
        {reset && !validToken && <div className="password-reset-notice password-reset-error" role="alert"><span aria-hidden="true"><AlertIcon color="currentColor" /></span><p>This reset link is missing or invalid. Please request a new link.</p></div>}
        {!message && (!reset || validToken) && <form className="auth-form" onSubmit={submit}>
          {!reset ? <div className="form-group">
            <label htmlFor="reset-email">Email address</label>
            <div className="input-wrapper"><input id="reset-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></div>
          </div> : <>
            <div className="form-group"><label htmlFor="new-password">New password</label>
              <div className="input-wrapper"><input id="new-password" type="password" autoComplete="new-password" required minLength={6} maxLength={72} value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /></div>
            </div>
            <div className="form-group"><label htmlFor="confirm-password">Confirm new password</label>
              <div className="input-wrapper"><input id="confirm-password" type="password" autoComplete="new-password" required minLength={6} maxLength={72} value={confirm} onChange={event => setConfirm(event.target.value)} disabled={busy} /></div>
            </div>
          </>}
          <button className="auth-submit-btn" type="submit" disabled={busy}>{busy ? 'Please wait…' : reset ? 'Reset password' : 'Send reset link'}</button>
        </form>}
        <nav className="password-reset-navigation" aria-label="Password recovery">
          {reset && !message && <Link to="/portal/forgot-password">Request a new reset link</Link>}
          <Link to="/portal/login"><span aria-hidden="true"><ArrowLeftIcon size={18} color="currentColor" /></span>Back to log in</Link>
        </nav>
      </div></div></main>
    </div>
    <PortalFooter />
  </div>;
}
