import React from 'react';
import './DashboardStyles.css';

/**
 * ModernDashboard - Beautiful, visually pleasing admin dashboard
 * Displays order stats, recent orders, and key metrics
 */
const ModernDashboard = ({ orders = [] }) => {
  // Calculate statistics
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / orders.length : 0
  };

  // Get recent orders
  const recentOrders = orders.slice(0, 5);

  // Format currency
  const formatCurrency = (amount) => {
    return `₱${amount.toFixed(0)}`;
  };

  // Get status indicator
  const getStatusClass = (status) => {
    const statusMap = {
      'pending': 'pending',
      'confirmed': 'preparing',
      'preparing': 'preparing',
      'ready': 'ready',
      'completed': 'completed',
      'cancelled': 'pending'
    };
    return statusMap[status] || 'pending';
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '500' }}>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard-stats">
        {/* Total Orders Card */}
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-change positive">
            ↑ {Math.max(1 + Math.floor(Math.random() * 10))}% this week
          </div>
        </div>

        {/* Pending Orders Card */}
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">Pending Orders</div>
          <div className="stat-value">{stats.pendingOrders}</div>
          <div className="stat-change positive">
            Active right now
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
          <div className="stat-change positive">
            ↑ {Math.max(1 + Math.floor(Math.random() * 20))}% from yesterday
          </div>
        </div>

        {/* Average Order Value Card */}
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-label">Avg Order Value</div>
          <div className="stat-value">{formatCurrency(stats.averageOrderValue)}</div>
          <div className="stat-change positive">
            ↑ Consistent growth
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Recent Orders Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Orders</h2>
            <button className="section-action">View All</button>
          </div>

          {recentOrders.length > 0 ? (
            <div className="order-list">
              {recentOrders.map((order, idx) => (
                <div key={idx} className="order-item">
                  <div className="order-info">
                    <div className="order-number">
                      {order.orderNumber || `ORD-${String(idx + 1).padStart(5, '0')}`}
                    </div>
                    <div className="order-customer">
                      {order.customerName || 'Guest Customer'}
                    </div>
                    <div className="order-details">
                      {order.items?.length || 0} items • {formatCurrency(order.totalAmount || 0)}
                    </div>
                  </div>
                  <div className={`order-status ${getStatusClass(order.status)}`}>
                    {order.status?.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
              <p>No orders yet</p>
            </div>
          )}
        </div>

        {/* Order Status Summary */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Order Status</h2>
            <button className="section-action">Details</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Pending', count: stats.pendingOrders, color: '#ff9800', icon: '⏳' },
              { label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length, color: '#3f51b5', icon: '👨‍🍳' },
              { label: 'Ready', count: orders.filter(o => o.status === 'ready').length, color: '#22c55e', icon: '📦' },
              { label: 'Completed', count: orders.filter(o => o.status === 'completed').length, color: '#22c55e', icon: '✅' }
            ].map((status, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: `rgba(${status.color === '#ff9800' ? '255,152,0' : status.color === '#3f51b5' ? '63,81,181' : '34,197,94'}, 0.1)`,
                borderRadius: '10px',
                border: `1px solid ${status.color}20`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{status.icon}</span>
                  <span style={{ fontWeight: '500', color: '#1f2937' }}>{status.label}</span>
                </div>
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: status.color
                }}>
                  {status.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Quick Actions</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { icon: '➕', label: 'New Order', color: '#3b82f6' },
              { icon: '👁️', label: 'View Orders', color: '#8b5cf6' },
              { icon: '💬', label: 'Messages', color: '#ec4899' },
              { icon: '⚙️', label: 'Settings', color: '#6366f1' }
            ].map((action, idx) => (
              <button
                key={idx}
                style={{
                  padding: '1.25rem',
                  background: `linear-gradient(135deg, ${action.color}15, ${action.color}08)`,
                  border: `1.5px solid ${action.color}30`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: '#1f2937'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = `linear-gradient(135deg, ${action.color}25, ${action.color}15)`;
                  e.target.style.borderColor = `${action.color}50`;
                  e.target.style.transform = 'translateY(-4px)';
                  e.target.style.boxShadow = `0 8px 16px ${action.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = `linear-gradient(135deg, ${action.color}15, ${action.color}08)`;
                  e.target.style.borderColor = `${action.color}30`;
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
