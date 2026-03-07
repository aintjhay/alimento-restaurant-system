import React, { useState } from 'react';
import realtimeService from '../../services/realtimeService';
import { PendingIcon, PreparingIcon, ReadyIcon, CompletedIcon } from '../icons/StatusIcons';
import CheckIcon from '../icons/CheckIcon';
import XIcon from '../icons/XIcon';
import RefreshIcon from '../icons/RefreshIcon';
import './PortalOrderCard.css';

/**
 * PortalOrderCard - Simple order card display with status and items
 */
const PortalOrderCard = ({ order, onReorder }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' });
  };

  const getStatusIcon = (status) => {
    const props = { size: 14 };
    const icons = {
      'pending':   <PendingIcon {...props} />,
      'confirmed': <CheckIcon size={14} color="currentColor" />,
      'preparing': <PreparingIcon {...props} />,
      'ready':     <ReadyIcon {...props} />,
      'completed': <CompletedIcon {...props} />,
      'cancelled': <XIcon size={14} color="currentColor" />,
    };
    return icons[status] || null;
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
              <span className="info-date">{formatDate(order.createdAt)}</span>
              <span className="info-separator">•</span>
              <span className="info-time">{formatTime(order.createdAt)}</span>
            </div>

            {/* Items Summary */}
            <div className="items-summary">
              <span className="items-count">
                {itemsCount} {itemsCount === 1 ? 'item' : 'items'} ({totalQuantity} qty)
              </span>
              <span className="total-amount">₱{order.totalAmount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Card Right - Status Badge */}
        <div className="order-card-right">
          <div 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(order.status) }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              {getStatusIcon(order.status)} {getStatusText(order.status)}
            </span>
          </div>

          <span className="view-details-hint">
            {isExpanded ? 'Hide details ▲' : 'View details ▼'}
          </span>
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
                <RefreshIcon size={15} color="white" /> Order Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalOrderCard;
