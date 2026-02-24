/**
 * RecentOrders - Wrapper component for recent orders display
 * Shows summary metrics and grid of order cards with professional styling
 */

import React, { useState } from 'react';
import OrderCard from './OrderCard';
import { RefreshIcon } from '../icons/ForecastIcons';
import './RecentOrders.css';

const RecentOrders = ({ orders = [], onRefresh, onPrint, onDetails, onStatusChange, limit = 10 }) => {
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return String(order.status).toLowerCase() === filterStatus.toLowerCase();
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp);
      case 'oldest':
        return new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp);
      case 'highest':
        return (b.totalAmount || b.total || 0) - (a.totalAmount || a.total || 0);
      case 'lowest':
        return (a.totalAmount || a.total || 0) - (b.totalAmount || b.total || 0);
      default:
        return 0;
    }
  }).slice(0, limit);

  // Calculate metrics
  const metrics = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0),
    unpaidOrders: orders.filter(o => o.paymentStatus !== 'Paid' && o.paymentStatus !== 'paid').length,
    pendingOrders: orders.filter(o => String(o.status).toLowerCase() === 'pending').length,
    preparingOrders: orders.filter(o => String(o.status).toLowerCase() === 'preparing').length,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="recent-orders-container">
      {/* Header with Summary */}
      <div className="recent-orders-header">
        <div className="header-left">
          <h2>Recent Orders</h2>
          <p className="header-subtitle">Last {limit} orders</p>
        </div>
        <button 
          className={`btn-refresh ${isRefreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh orders"
        >
          <RefreshIcon size={20} color="#00796b" />
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="orders-summary-grid">
        <div className="summary-metric">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <span className="metric-label">Total Orders</span>
            <span className="metric-value">{metrics.totalOrders}</span>
          </div>
        </div>

        <div className="summary-metric">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <span className="metric-label">Revenue</span>
            <span className="metric-value">₱{metrics.totalRevenue.toFixed(0)}</span>
          </div>
        </div>

        <div className="summary-metric metric-warning">
          <div className="metric-icon">💳</div>
          <div className="metric-content">
            <span className="metric-label">Unpaid</span>
            <span className="metric-value">{metrics.unpaidOrders}</span>
          </div>
        </div>

        <div className="summary-metric metric-info">
          <div className="metric-icon">⏳</div>
          <div className="metric-content">
            <span className="metric-label">Pending</span>
            <span className="metric-value">{metrics.pendingOrders}</span>
          </div>
        </div>

        <div className="summary-metric metric-warning">
          <div className="metric-icon">🔨</div>
          <div className="metric-content">
            <span className="metric-label">Preparing</span>
            <span className="metric-value">{metrics.preparingOrders}</span>
          </div>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="orders-controls">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Orders Grid/List */}
      <div className="orders-cards-container">
        {sortedOrders.length > 0 ? (
          sortedOrders.map((order) => (
            <OrderCard
              key={order._id || order.id || order.orderNumber}
              order={order}
              onPrint={onPrint}
              onDetails={onDetails}
              onStatusChange={onStatusChange}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Orders Found</h3>
            <p>
              {filterStatus !== 'all' 
                ? `No ${filterStatus} orders at the moment.`
                : 'No recent orders to display.'}
            </p>
          </div>
        )}
      </div>

      {/* Show more notice */}
      {filteredOrders.length > limit && (
        <div className="show-more-notice">
          Showing {limit} of {filteredOrders.length} orders • 
          <a href="#"> View all orders</a>
        </div>
      )}
    </div>
  );
};

export default RecentOrders;
