import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LuUserRound, LuReceiptText, LuArrowUpRight } from 'react-icons/lu';

export default function AccountSidebar({ user, active }) {
  const navigate = useNavigate();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'Your account';
  const initials = fullName.split(/\s+/).slice(0, 2).map(name => name.charAt(0)).join('').toUpperCase();
  return <aside className="account-identity">
    <div className="profile-header">
      <span className="profile-avatar" aria-hidden="true">{initials}</span>
      <div><p className="profile-eyebrow">Alimento customer</p><h2>{fullName}</h2><p className="profile-email">{user?.email}</p></div>
    </div>
    <nav className="account-shortcuts" aria-label="Account navigation">
      <span className="account-shortcut-label">ACCOUNT</span>
      {[{ id: 'profile', label: 'Personal details', path: '/portal/profile', Icon: LuUserRound }, { id: 'orders', label: 'Order history', path: '/portal/orders', Icon: LuReceiptText }].map(({ id, label, path, Icon }) => (
        <button key={id} className={active === id ? 'account-current' : ''} aria-current={active === id ? 'page' : undefined} onClick={() => navigate(path)}>
          <Icon aria-hidden="true" />{label}{active === id ? <span className="account-current-dot" /> : <LuArrowUpRight aria-hidden="true" />}
        </button>
      ))}
    </nav>
    <p className="account-sidebar-note">Your saved details help make every checkout a little easier.</p>
  </aside>;
}
