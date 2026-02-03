import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiShoppingCart, 
  FiUsers, 
  FiBarChart2, 
  FiPackage,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiBell
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState({
    name: 'Admin User',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=327282&color=fff'
  });
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', icon: <FiHome />, label: 'Dashboard', roles: ['admin', 'staff'] },
    { path: '/pos', icon: <FiShoppingCart />, label: 'POS System', roles: ['admin', 'staff'] },
    { path: '/admin/menu', icon: <FiPackage />, label: 'Menu Management', roles: ['admin'] },
    { path: '/admin/orders', icon: <FiUsers />, label: 'Order Management', roles: ['admin'] },
    { path: '/admin/inventory', icon: <FiPackage />, label: 'Inventory', roles: ['admin'] },
    { path: '/admin/forecasting', icon: <FiBarChart2 />, label: 'ML Forecasting', roles: ['admin'] },
    { path: '/admin/settings', icon: <FiSettings />, label: 'Settings', roles: ['admin'] },
  ];

  const handleLogout = () => {
    // Implement logout logic
    navigate('/login');
  };

  return (
    <div className="main-layout">
      {/* Toast Notifications */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Sidebar */}
      <motion.aside 
        className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">🍽️</div>
            <motion.div 
              className="logo-text"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -20 }}
              transition={{ delay: 0.1 }}
            >
              <h2>ALIMENTO</h2>
              <p>Restaurant System</p>
            </motion.div>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const hasAccess = item.roles.includes(user.role);
            
            if (!hasAccess) return null;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <motion.span 
                  className="nav-label"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -20 }}
                  transition={{ delay: 0.2 }}
                >
                  {item.label}
                </motion.span>
                {isActive && (
                  <motion.div 
                    className="active-indicator"
                    layoutId="activeIndicator"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <img src={user.avatar} alt={user.name} className="user-avatar" />
            <motion.div 
              className="user-info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -20 }}
              transition={{ delay: 0.3 }}
            >
              <h4>{user.name}</h4>
              <p className="user-role">{user.role}</p>
            </motion.div>
            <button className="logout-btn" onClick={handleLogout}>
              <FiLogOut />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="main-header">
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FiMenu />
            </button>
            <div className="breadcrumb">
              <span className="page-title">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </span>
              <span className="page-subtitle">Alimento Restaurant Management</span>
            </div>
          </div>
          
          <div className="header-right">
            <button className="notification-btn">
              <FiBell />
              <span className="notification-badge">3</span>
            </button>
            
            <div className="system-status">
              <div className="status-indicator online"></div>
              <span>System Online</span>
            </div>
            
            <div className="current-time">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Footer */}
        <footer className="main-footer">
          <div className="footer-content">
            <p>© {new Date().getFullYear()} Alimento Restaurant. All rights reserved.</p>
            <div className="footer-links">

              <span>Version 1.0.0</span>
              <span>•</span>
              <span>API: Connected</span>
              <span>•</span>

              <span>Last Sync: Just now</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default MainLayout;
