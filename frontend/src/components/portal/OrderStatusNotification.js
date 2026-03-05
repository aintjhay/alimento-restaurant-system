import React, { useEffect, useState } from 'react';
import realtimeService from '../../services/realtimeService';
import './OrderStatusNotification.css';

/**
 * OrderStatusNotification - Displays real-time order status notifications
 * Works with HTTP polling initially, ready for WebSocket integration
 */
const OrderStatusNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Listen for new notifications from realtimeService
    realtimeService.on('notifications', 'new', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 5)); // Keep last 5
      
      // Auto-remove after duration
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, notification.duration);
    });

    return () => {
      // Cleanup listener if needed
    };
  }, []);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="order-status-notifications">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification-item notification-${notification.type}`}
        >
          <div className="notification-icon">
            {notification.type === 'success' && '✅'}
            {notification.type === 'error' && '❌'}
            {notification.type === 'warning' && '⚠️'}
            {notification.type === 'info' && 'ℹ️'}
          </div>
          <div className="notification-message">
            {notification.message}
          </div>
          <button
            className="notification-close"
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default OrderStatusNotification;
