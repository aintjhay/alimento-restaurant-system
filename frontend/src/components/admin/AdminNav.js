import React, { useState } from 'react';
import { FiGrid, FiLayout, FiPercent, FiCoffee, FiMonitor, FiList, FiTag, FiPackage, FiBarChart2, FiLogOut, FiMenu, FiX, FiUser } from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminPanel.css';
import './AdminSidebar.css';

const groups = [
  { name: 'Overview', links: [['/admin/dashboard', 'Dashboard', FiGrid]] },
  { name: 'Operations', links: [['/admin/pos', 'POS', FiMonitor], ['/admin/kitchen', 'Kitchen & Bar', FiCoffee]] },
  { name: 'Menu & inventory', links: [['/admin/products', 'Menu Management', FiList], ['/admin/store', 'Portal settings', FiLayout], ['/admin/promotions', 'Promotions', FiPercent], ['/admin/categories', 'Categories', FiTag], ['/admin/inventory', 'Inventory', FiPackage]] },
  { name: 'Reports', links: [['/admin/sales', 'Sales Reports', FiBarChart2]] }
];

export default function AdminNav({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Administrator';
  const signOut = () => { logout(); navigate('/admin/login', { replace: true }); };
  return <div className="admin-shell">
    <aside className="admin-nav admin-sidebar" aria-label="Admin sidebar">
      <div className="admin-sidebar-brand"><div><span className="admin-brand-name">Alimento</span><span className="admin-brand-caption">ADMIN PANEL</span></div>
        <button className="admin-menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="admin-sidebar-body" onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}</button>
      </div>
      <div id="admin-sidebar-body" className={`admin-sidebar-body${menuOpen ? ' is-open' : ''}`} onKeyDown={event => { if (event.key === 'Escape') { setMenuOpen(false); event.currentTarget.previousElementSibling?.querySelector('button')?.focus(); } }}>
        <nav aria-label="Administration">{groups.map(group => <div className="admin-nav-group" key={group.name}>
          <p className="admin-group-label">{group.name}</p>
          {group.links.map(([to, label, Icon]) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}><Icon aria-hidden="true" /><span>{label}</span></NavLink>)}
        </div>)}</nav>
        <div className="admin-account"><div className="admin-account-details"><span className="admin-account-avatar"><FiUser aria-hidden="true" /></span><div><strong>{displayName}</strong><small>{user?.role || 'admin'}</small></div></div>
          <button className="admin-signout" onClick={signOut}><FiLogOut aria-hidden="true" /><span>Sign out</span></button>
        </div>
      </div>
    </aside>
    <main className="admin-content"><h1>{title}</h1>{children}</main>
  </div>;
}
