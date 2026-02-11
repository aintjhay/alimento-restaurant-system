import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/images/logo/alimentologo.png';

const PortalHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const portalUser = localStorage.getItem('portalUser');
    if (portalUser) {
      try {
        setUser(JSON.parse(portalUser));
      } catch (err) {
        setUser(null);
      }
    }
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('portalUser');
    localStorage.removeItem('portalCheckoutType');
    setUser(null);
    setShowUserMenu(false);
    navigate('/portal');
  };

  const handleMenuItemClick = (action) => {
    setShowUserMenu(false);
    if (action === 'logout') {
      handleLogout();
    }
  };

  return (
    <header className="portal-header">
      <div className="portal-header-container">
        {/* Logo & Brand */}
        <div className="portal-brand" onClick={() => navigate('/portal')}>
          <img src={logo} alt="Alimento Resto" className="portal-logo" />
          <span className="portal-brand-name">Alimento</span>
        </div>

        {/* Navigation */}
        <nav className="portal-nav">
          <button
            className={`portal-nav-link ${isActive('/portal') ? 'active' : ''}`}
            onClick={() => navigate('/portal')}
          >
            Menu
          </button>
          <button className="portal-nav-link">Contact</button>
        </nav>

        {/* Right Section: Auth or User Menu */}
        <div className="portal-right-section">
          {user ? (
            <div className="user-menu-container" ref={menuRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <span className="user-icon">👤</span>
                <span className="user-greeting">{user.name}</span>
                <span className={`menu-chevron ${showUserMenu ? 'open' : ''}`}>
                  ▼
                </span>
              </button>

              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <div className="user-menu-header">
                    <span className="user-menu-title">{user.name}</span>
                    <span className="user-menu-email">{user.email}</span>
                  </div>

                  <div className="user-menu-divider"></div>

                  <button
                    className="user-menu-item"
                    onClick={() => handleMenuItemClick('profile')}
                  >
                    <span className="menu-item-icon">👤</span>
                    <span>Profile</span>
                  </button>

                  <button
                    className="user-menu-item"
                    onClick={() => handleMenuItemClick('orders')}
                  >
                    <span className="menu-item-icon">📋</span>
                    <span>Orders & Reordering</span>
                  </button>

                  <button
                    className="user-menu-item"
                    onClick={() => handleMenuItemClick('favorites')}
                  >
                    <span className="menu-item-icon">❤️</span>
                    <span>Favorites</span>
                  </button>

                  <button
                    className="user-menu-item"
                    onClick={() => handleMenuItemClick('help')}
                  >
                    <span className="menu-item-icon">❓</span>
                    <span>Help Center</span>
                  </button>

                  <div className="user-menu-divider"></div>

                  <button
                    className="user-menu-item logout-item"
                    onClick={() => handleMenuItemClick('logout')}
                  >
                    <span className="menu-item-icon">🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <button
                className="header-login-btn"
                onClick={() => navigate('/portal/login')}
              >
                Log in
              </button>
              <button
                className="header-signup-btn"
                onClick={() => navigate('/portal/login')}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default PortalHeader;
