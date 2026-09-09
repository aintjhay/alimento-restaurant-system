import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import components
import Dashboard from './pages/dashboard/OperationsDashboard';
import PosSystem from './pages/pos/PosSystem';
import KitchenDisplay from './pages/kitchen/KitchenDisplay';
import BartenderDisplay from './pages/kitchen/BartenderDisplay';
import Login from './pages/auth/Login';
import PortalHome from './pages/portal/PortalHome';
import PortalLoginRegister from './pages/portal/PortalLoginRegister';
import PortalCheckout from './pages/portal/PortalCheckout';
import PortalConfirmation from './pages/portal/PortalConfirmation';
import PortalTracking from './pages/portal/PortalTracking';
import PortalOrderHistory from './pages/portal/PortalOrderHistory';
import PortalFavorites from './pages/portal/PortalFavorites';
import PortalUserProfile from './pages/portal/PortalUserProfile';
import InventoryManagement from './pages/inventory/InventoryManagement';
import ProductManagement from './pages/admin/ProductManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import SalesReport from './pages/admin/SalesReport';

const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="route-loading">Checking administrator session...</div>;
  if (!isAuthenticated || user?.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return children;
};

function AppRoutes() {

  return (
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/" element={<PortalHome />} />
            <Route path="/portal" element={<PortalHome />} />
            <Route path="/portal/login" element={<PortalLoginRegister />} />
            <Route path="/portal/checkout" element={<PortalCheckout />} />
            <Route path="/portal/confirmation" element={<PortalConfirmation />} />
            <Route path="/portal/track" element={<PortalTracking />} />
            <Route path="/portal/track/:token" element={<PortalTracking />} />
            <Route path="/portal/orders" element={<PortalOrderHistory />} />
            <Route path="/portal/favorites" element={<PortalFavorites />} />
            <Route path="/portal/profile" element={<PortalUserProfile />} />
            
            {/* Protected Routes */}
            <Route path="/admin/dashboard" element={<ProtectedAdminRoute><Dashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/pos" element={<ProtectedAdminRoute><PosSystem /></ProtectedAdminRoute>} />
            <Route path="/admin/kitchen" element={<ProtectedAdminRoute><KitchenDisplay /></ProtectedAdminRoute>} />
            <Route path="/admin/bartender" element={<ProtectedAdminRoute><BartenderDisplay /></ProtectedAdminRoute>} />
            <Route path="/admin/inventory" element={<ProtectedAdminRoute><InventoryManagement /></ProtectedAdminRoute>} />
            <Route path="/admin/products" element={<ProtectedAdminRoute><ProductManagement /></ProtectedAdminRoute>} />
            <Route path="/admin/categories" element={<ProtectedAdminRoute><CategoryManagement /></ProtectedAdminRoute>} />
            <Route path="/admin/sales" element={<ProtectedAdminRoute><SalesReport /></ProtectedAdminRoute>} />

            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/pos" element={<Navigate to="/admin/pos" replace />} />
            <Route path="/kitchen" element={<Navigate to="/admin/kitchen" replace />} />
            <Route path="/bartender" element={<Navigate to="/admin/bartender" replace />} />
            <Route path="/inventory" element={<Navigate to="/admin/inventory" replace />} />
            <Route path="/admin/*" element={<ProtectedAdminRoute><Navigate to="/admin/dashboard" replace /></ProtectedAdminRoute>} />
            
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
  );
}

function ScopedAuthRoutes() {
  const { pathname } = useLocation();
  const scope = pathname === '/admin' || pathname.startsWith('/admin/') ? 'admin' : 'portal';
  return <AuthProvider key={scope} scope={scope}><AppRoutes /></AuthProvider>;
}

function App() {
  return <Router><ScopedAuthRoutes /></Router>;
}

export default App;
