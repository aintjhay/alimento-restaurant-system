/**
 * OrderCard - Professional order card component
 * Displays order information in a clean, expandable card format
 */

import React, { useState } from 'react';
import { PendingIcon, PreparingIcon, ReadyIcon, CompletedIcon, UnpaidIcon, VerifiedIcon } from '../icons/StatusIcons';
import { EyeIcon, PrinterIcon, MoreIcon } from '../icons/ForecastIcons';
import './OrderCard.css';

const OrderCard = ({ order, onPrint, onDetails, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Parse dates safely
  const orderDate = new Date(order.createdAt || order.timestamp || new Date());
  const timeString = orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateString = orderDate.toLocaleDateString();

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'Pending':
        return 'status-pending';
      case 'preparing':
      case 'Preparing':
        return 'status-preparing';
      case 'ready':
      case 'Ready':
        return 'status-ready';
      case 'completed':
      case 'Completed':
        return 'status-completed';
      default:
        return 'status-default';
    }
  };

  // Get payment status color
  const getPaymentColor = (status) => {
    return status === 'Paid' || status === 'paid' ? 'payment-paid' : 'payment-unpaid';
  };

  // Get appropriate icon for status
  const getStatusIcon = (status) => {
    switch (String(status).toLowerCase()) {
      case 'pending':
        return <PendingIcon size={18} />;
      case 'preparing':
        return <PreparingIcon size={18} />;
      case 'ready':
        return <ReadyIcon size={18} />;
      case 'completed':
        return <CompletedIcon size={18} />;
      default:
        return <PendingIcon size={18} />;
    }
  };

  const getPaymentIcon = (status) => {
    return status === 'Paid' || status === 'paid' ? <VerifiedIcon size={18} /> : <UnpaidIcon size={18} />;
  };

  return (
    <div className={`order-card ${getStatusColor(order.status)} ${isExpanded ? 'expanded' : ''}`}>
      {/* Card Header - Always Visible */}
      <div className="order-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="order-card-left">
          <div className="order-number-badge">{order.orderNumber || `#${order._id?.slice(-6) || 'N/A'}`}</div>
          <div className="order-quick-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {order.orderType === 'Delivery' || !order.tableNumber ? (
                <>
                  <span style={{ fontSize: '1.2rem' }}>🚚</span>
                  <span className="order-table">{order.orderType === 'Delivery' ? 'Delivery' : 'Online Order'}</span>
                </>
              ) : (
                <span className="order-table">
                  {order.tableNumber ? `Table ${order.tableNumber}` : order.customerName || 'Dine-in'}
                </span>
              )}
            </div>
            <span className="order-time">{timeString}</span>
          </div>
        </div>

        <div className="order-card-right">
          <div className="order-amount">₱{order.totalAmount?.toFixed(0) || order.total?.toFixed(0) || '0'}</div>
          <div className="status-dropdown-container">
            <button 
              className={`order-status-badge ${getStatusColor(order.status)}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowStatusMenu(!showStatusMenu);
              }}
            >
              {getStatusIcon(order.status)}
              <span>{order.status}</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            {showStatusMenu && (
              <div className="status-dropdown-menu">
                <button 
                  className="dropdown-item pending"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onStatusChange?.(order._id || order.id, 'pending');
                    setShowStatusMenu(false);
                  }}
                >
                  <PendingIcon size={14} /> Pending
                </button>
                <button 
                  className="dropdown-item preparing"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onStatusChange?.(order._id || order.id, 'preparing');
                    setShowStatusMenu(false);
                  }}
                >
                  <PreparingIcon size={14} /> Preparing
                </button>
                <button 
                  className="dropdown-item ready"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onStatusChange?.(order._id || order.id, 'ready');
                    setShowStatusMenu(false);
                  }}
                >
                  <ReadyIcon size={14} /> Ready
                </button>
                <button 
                  className="dropdown-item completed"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onStatusChange?.(order._id || order.id, 'completed');
                    setShowStatusMenu(false);
                  }}
                >
                  <CompletedIcon size={14} /> Completed
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Expand Indicator */}
      <div className="card-divider"></div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="order-card-expanded">
          {/* Payment & Proof Section */}
          <div className="card-section payment-section">
            <div className="section-row">
              <div className="info-box">
                <label>Payment Status</label>
                <div className={`payment-badge ${getPaymentColor(order.paymentStatus)}`}>
                  {getPaymentIcon(order.paymentStatus)}
                  <span>{order.paymentStatus || 'N/A'}</span>
                </div>
              </div>
              <div className="info-box">
                <label>Total Amount</label>
                <div className="amount-large">₱{order.totalAmount?.toFixed(0) || order.total?.toFixed(0) || '0'}</div>
              </div>
            </div>

            {order.subtotal && (
              <div className="amount-breakdown">
                <div className="break-item">
                  <span>Subtotal:</span>
                  <span>₱{order.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {order.taxAmount && (
                  <div className="break-item">
                    <span>Tax:</span>
                    <span>₱{order.taxAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
              </div>
            )}

            {order.proofImage && (
              <div className="proof-section">
                <label>Payment Proof</label>
                <div className="proof-status">✓ Attached</div>
              </div>
            )}
          </div>

          {/* Items Section */}
          {order.items && order.items.length > 0 && (
            <div className="card-section items-section">
              <label>Items ({order.items.length})</label>
              <div className="items-list">
                {order.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="item-row">
                    <span className="item-name">{item.name || item.itemName || 'Item'}</span>
                    <span className="item-qty">×{item.quantity || 1}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="items-more">+{order.items.length - 3} more items</div>
                )}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {order.orderType && (
            <div className="card-section info-section">
              <label>Order Type</label>
              <span className="order-type-badge">{order.orderType}</span>
            </div>
          )}

          {/* Delivery Info Section - For Delivery Orders */}
          {(order.tableNumber === 'Delivery' || order.orderType === 'Delivery') && (
            <div className="card-section delivery-info-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1rem' }}>🍴</span>
                <label>Delivery Information</label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#666' }}>Recipient</span>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#212121', fontWeight: '600' }}>{order.customerName || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#666' }}>Contact</span>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#212121', fontWeight: '600' }}>{order.customerContact || 'N/A'}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#666' }}>Address</span>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#212121', fontWeight: '600', lineHeight: '1.4' }}>{order.customerAddress || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#666' }}>Payment</span>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#212121', fontWeight: '600', textTransform: 'capitalize' }}>
                    {order.paymentMethod ? (order.paymentMethod === 'cash' ? 'Cash on Delivery' : order.paymentMethod.toUpperCase()) : 'N/A'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#666' }}>Delivery Status</span>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#212121', fontWeight: '600', textTransform: 'capitalize' }}>{order.status || 'Pending'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Date */}
          <div className="card-section date-section">
            <label>Order Date</label>
            <span className="order-date">{dateString} at {timeString}</span>
          </div>

          {/* Action Buttons */}
          <div className="card-actions">
            <button className="action-btn action-view" onClick={() => onDetails?.(order)}>
              <EyeIcon size={16} color="#2196f3" />
              View Details
            </button>
            <button className="action-btn action-print" onClick={() => onPrint?.(order)}>
              <PrinterIcon size={16} color="#666" />
              Print
            </button>
            {order.paymentStatus !== 'Paid' && (
              <button className="action-btn action-pay" onClick={() => onStatusChange?.(order._id || order.id, 'paid')}>
                💳 Mark Paid
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCard;
