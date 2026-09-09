import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/images/logo/alimentologo.png';
import UserIcon from '../icons/UserIcon';
import CartIcon from '../icons/CartIcon';
import ClipboardIcon from '../icons/ClipboardIcon';
import LogOutIcon from '../icons/LogOutIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import { useAuth } from '../../context/AuthContext';

const PortalHeader = ({ onCartClick = () => {}, cartCount: propCartCount, onLogin } = {}) => {
  const navigate = useNavigate();
  const { logout, user: authUser, isAuthenticated } = useAuth();
  const location = useLocation();
  const user = isAuthenticated && authUser?.type !== 'guest' ? authUser : null;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeNav, setActiveNav] = useState('menu');
  const [cartCount, setCartCount] = useState(propCartCount || 0);
  const menuRef = useRef(null);

  useEffect(() => {
    if (propCartCount !== undefined) {
      setCartCount(propCartCount);
    }
  }, [propCartCount]);

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

  useEffect(() => {
    // Watch for cart changes
    const handleStorageChange = () => {
      const portalCart = localStorage.getItem('portalCart');
      if (portalCart) {
        try {
          const cart = JSON.parse(portalCart);
          // Calculate total quantity (sum of all item quantities)
          const totalItems = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
          setCartCount(totalItems);
        } catch (err) {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check periodically for local changes (every 500ms)
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    localStorage.removeItem('portalCheckoutType');
    setShowUserMenu(false);
    navigate('/portal');
  };

  const handleMenuItemClick = (action) => {
    setShowUserMenu(false);
    if (action === 'logout') {
      handleLogout();
    } else if (action === 'orders') {
      navigate('/portal/orders');
    } else if (action === 'profile') {
      navigate('/portal/profile');
    }
  };

  return (
    <header className="portal-header">
      <div className="portal-header-container">
        {/* Logo & Brand */}
        <Link className="portal-brand" to="/portal" aria-label="Alimento home">
          <img src={logo} alt="" className="portal-logo" width="48" height="48" />
          <span className="portal-brand-name">Alimento</span>
        </Link>

        {/* Navigation */}
        <nav className="portal-nav" aria-label="Main navigation">
          <button
            className={`portal-nav-link ${activeNav === 'menu' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('menu');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              navigate('/portal');
            }}
          >
            Menu
          </button>
          <button 
            className={`portal-nav-link ${activeNav === 'contact' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('contact');
              const contactSection = document.getElementById('contact');
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Contact
          </button>
        </nav>

        {/* Right Section: Auth or User Menu */}
        <div className="portal-right-section">
          {user ? (
            <div className="user-menu-container" ref={menuRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <span className="user-icon"><UserIcon size={20} color="#2f6f6a" /></span>
                <span className="user-greeting">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.name || 'User'}
                </span>
                <span className={`menu-chevron ${showUserMenu ? 'open' : ''}`}>
                  <ChevronDownIcon size={16} color="#2f6f6a" />
                </span>
              </button>

              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <div className="user-menu-header">
                    <span className="user-menu-title">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.name || 'User'}
                    </span>
                    <span className="user-menu-email">{user.email}</span>
                  </div>

                  <div className="user-menu-divider"></div>

                  <button
                    className="user-menu-item"
                    onClick={() => handleMenuItemClick('profile')}
                  >
                    <span className="menu-item-icon"><UserIcon size={18} color="#2f6f6a" /></span>
                    <span>Profile</span>
                  </button>

                  <button
                    className="user-menu-item"
                    onClick={() => handleMenuItemClick('orders')}
                  >
                    <span className="menu-item-icon"><ClipboardIcon size={18} color="#2f6f6a" /></span>
                    <span>Orders & Reordering</span>
                  </button>

                  <div className="user-menu-divider"></div>

                  <button
                    className="user-menu-item logout-item"
                    onClick={() => handleMenuItemClick('logout')}
                  >
                    <span className="menu-item-icon"><LogOutIcon size={18} color="#d32f2f" /></span>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <button
                className="header-login-btn"
                onClick={() => onLogin ? onLogin('login') : navigate('/portal/login')}
              >
                Log in
              </button>
              <button
                className="header-signup-btn"
                onClick={() => onLogin ? onLogin('register') : navigate('/portal/login?mode=register')}
              >
                Create account
              </button>
            </div>
          )}
          
          {/* Cart Icon - On the far right */}
          <button 
            className="header-cart-btn"
            onClick={onCartClick}
            title="View cart"
            aria-label={`View cart${cartCount > 0 ? `, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}` : ', empty'}`}
          >
            <CartIcon size={24} color="#2f6f6a" />
            {cartCount > 0 && (
              <span key={cartCount} className="cart-badge" aria-label={`${cartCount} ${cartCount === 1 ? 'item' : 'items'} in cart`}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default PortalHeader;
