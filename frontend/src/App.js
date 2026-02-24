import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';

// Import components
import Dashboard from './pages/dashboard/Dashboard';
import PosSystem from './pages/pos/PosSystem';
import Login from './pages/auth/Login';
import PortalHome from './pages/portal/PortalHome';
import PortalCheckoutChoice from './pages/portal/PortalCheckoutChoice';
import PortalLoginRegister from './pages/portal/PortalLoginRegister';
import PortalCheckout from './pages/portal/PortalCheckout';
import PortalConfirmation from './pages/portal/PortalConfirmation';
import PortalOrderHistory from './pages/portal/PortalOrderHistory';
import PortalFavorites from './pages/portal/PortalFavorites';
import PortalUserProfile from './pages/portal/PortalUserProfile';

function App() {
  const isAuthenticated = true; // For development

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/portal" element={<PortalHome />} />
            <Route path="/portal/checkout-choice" element={<PortalCheckoutChoice />} />
            <Route path="/portal/login" element={<PortalLoginRegister />} />
            <Route path="/portal/checkout" element={<PortalCheckout />} />
            <Route path="/portal/confirmation" element={<PortalConfirmation />} />
            <Route path="/portal/orders" element={<PortalOrderHistory />} />
            <Route path="/portal/favorites" element={<PortalFavorites />} />
            <Route path="/portal/profile" element={<PortalUserProfile />} />
            
            {/* Protected Routes */}
            <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/pos" element={isAuthenticated ? <PosSystem /> : <Navigate to="/login" />} />
            
            {/* Catch-all */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
