import React, { useState } from 'react';
import realtimeService from '../../services/realtimeService';
import './PortalOrderCard.css';

/**
 * PortalOrderCard - Simple order card display with status and items
 */
const PortalOrderCard = ({ order, onReorder }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Convert to Philippines time (GMT+8)
    const phTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    return phTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'confirmed': '✓',
      'preparing': '👨‍🍳',
      'ready': '📦',
      'completed': '✅',
      'cancelled': '❌'
    };
    return icons[status] || '•';
  };

  const getStatusColor = (status) => {
    return realtimeService.getStatusColor(status);
  };

  const getStatusText = (status) => {
    return realtimeService.getStatusText(status);
  };

  // Calculate items count
  const itemsCount = order.items?.length || 0;
  const totalQuantity = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  return (
    <div 
      className="portal-order-card"
      style={{ borderLeftColor: getStatusColor(order.status) }}
    >
      {/* Card Header - Always Visible */}
      <div 
        className="order-card-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="order-card-left">
          {/* Order Number Badge - Simple */}
          <div className="order-number-badge">
            {order.orderNumber || `#${order._id?.slice(-6) || 'N/A'}`}
          </div>

          {/* Quick Info */}
          <div className="order-quick-info">
            <div className="info-row">
              <span className="info-label">
                {getStatusIcon(order.status)} {getStatusText(order.status)}
              </span>
              <span className="info-separator">•</span>
              <span className="info-date">{formatDate(order.createdAt)}</span>
              <span className="info-separator">•</span>
              <span className="info-time">{formatTime(order.createdAt)}</span>
            </div>

            {/* Items Summary */}
            <div className="items-summary">
              <span className="items-count">{itemsCount} items ({totalQuantity} qty)</span>
              <span className="total-amount">₱{order.totalAmount?.toFixed(0) || '0'}</span>
            </div>
          </div>
        </div>

        {/* Card Right - Status Badge */}
        <div className="order-card-right">
          <div 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(order.status) }}
          >
            {getStatusIcon(order.status)} {getStatusText(order.status)}
          </div>

          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="order-card-expanded">
          {/* Items List */}
          <div className="order-items-section">
            <h4>Items ({itemsCount})</h4>
            <div className="items-list">
              {order.items?.map((item, idx) => (
                <div key={idx} className="order-item">
                  <div className="item-details">
                    <div className="item-header">
                      <span className="item-name">{item.name || 'Item'}</span>
                      <span className="item-qty">x{item.quantity || 1}</span>
                    </div>
                    {item.specialInstructions && (
                      <div className="item-instructions">
                        📝 {item.specialInstructions}
                      </div>
                    )}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="item-modifiers">
                        {item.modifiers.map((mod, i) => (
                          <span key={i} className="modifier-tag">
                            {mod.modifierName}: {mod.selectedOption}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <div className="item-addons">
                        {item.addons.map((addon, i) => (
                          <span key={i} className="addon-tag">
                            + {addon.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="item-price">
                    ₱{(item.itemTotal || item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary-section">
            <h4>Order Summary</h4>
            <div className="summary-lines">
              <div className="summary-line">
                <span>Subtotal:</span>
                <span>₱{(order.subtotal || 0).toFixed(2)}</span>
              </div>
              {order.taxAmount > 0 && (
                <div className="summary-line">
                  <span>Tax (12%):</span>
                  <span>₱{(order.taxAmount || 0).toFixed(2)}</span>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div className="summary-line">
                  <span>Delivery Fee:</span>
                  <span>₱{(order.deliveryFee || 0).toFixed(2)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="summary-line discount">
                  <span>Discount:</span>
                  <span>-₱{(order.discount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="summary-line total">
                <span>Total:</span>
                <span className="total-amount">₱{(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="order-actions">
            {order.status === 'completed' && onReorder && (
              <button className="btn-primary" onClick={() => onReorder(order)}>
                🔁 Order Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalOrderCard;
