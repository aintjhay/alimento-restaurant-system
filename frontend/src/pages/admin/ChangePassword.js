import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiCheck, FiEye, FiEyeOff, FiLock, FiShield } from 'react-icons/fi';
import AdminNav from '../../components/admin/AdminNav';
import { useAuth } from '../../context/AuthContext';
import { API_URL, authHeaders } from '../../services/api';
import './ChangePassword.css';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to change password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      logout();
      navigate('/admin/login', { replace: true });
    } catch (err) {
      setError(err instanceof TypeError || err instanceof SyntaxError ? 'Unable to reach the service. Please try again.' : err.message);
    } finally {
      setBusy(false);
    }
  }

  const visibilityButton = (field, label) => <button
    type="button"
    className="password-visibility"
    aria-label={`${visible[field] ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
    onClick={() => setVisible(state => ({ ...state, [field]: !state[field] }))}
  >
    <span>{visible[field] ? 'Hide' : 'Show'}</span>
    {visible[field] ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
  </button>;

  return <AdminNav title="Change password">
    <div className="change-password-page">
      <section className="change-password-card" aria-labelledby="change-password-heading">
        <header className="change-password-card-heading">
          <span className="change-password-icon"><FiShield aria-hidden="true" /></span>
          <div>
            <span className="change-password-eyebrow">ACCOUNT SECURITY</span>
            <h2 id="change-password-heading">Update your password</h2>
            <p>Choose a strong password to help keep your administrator account secure.</p>
          </div>
        </header>

        {error && <div className="change-password-alert" role="alert"><FiAlertCircle aria-hidden="true" />{error}</div>}

        <form className="change-password-form" onSubmit={submit}>
          <div className="change-password-field">
            <label htmlFor="current-password">Current password</label>
            <div className="change-password-input-wrap">
              <FiLock className="change-password-input-icon" aria-hidden="true" />
              <input id="current-password" type={visible.current ? 'text' : 'password'} autoComplete="current-password" required value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} disabled={busy} />
              {visibilityButton('current', 'current password')}
            </div>
          </div>

          <div className="change-password-field">
            <label htmlFor="new-password">New password</label>
            <div className="change-password-input-wrap">
              <FiLock className="change-password-input-icon" aria-hidden="true" />
              <input id="new-password" type={visible.next ? 'text' : 'password'} autoComplete="new-password" minLength={12} maxLength={72} required value={newPassword} onChange={event => setNewPassword(event.target.value)} disabled={busy} />
              {visibilityButton('next', 'new password')}
            </div>
            <span className={`change-password-hint${newPassword.length >= 12 ? ' met' : ''}`}>
              {newPassword.length >= 12 && <FiCheck aria-hidden="true" />}At least 12 characters
            </span>
          </div>

          <div className="change-password-field">
            <label htmlFor="confirm-password">Confirm new password</label>
            <div className="change-password-input-wrap">
              <FiLock className="change-password-input-icon" aria-hidden="true" />
              <input id="confirm-password" type={visible.confirm ? 'text' : 'password'} autoComplete="new-password" minLength={12} maxLength={72} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} disabled={busy} />
              {visibilityButton('confirm', 'confirmation')}
            </div>
            {confirmPassword && <span className={`change-password-hint${confirmPassword === newPassword ? ' met' : ' mismatch'}`}>
              {confirmPassword === newPassword ? <><FiCheck aria-hidden="true" />Passwords match</> : 'Passwords do not match yet'}
            </span>}
          </div>

          <footer className="change-password-footer">
            <p><FiShield aria-hidden="true" />You’ll be signed out on other sessions after this change.</p>
            <button className="admin-button change-password-submit" type="submit" disabled={busy}>{busy ? 'Updating...' : 'Update password'}</button>
          </footer>
        </form>
      </section>
    </div>
  </AdminNav>;
}
