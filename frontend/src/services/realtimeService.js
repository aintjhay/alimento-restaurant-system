/**
 * Real-time Service - Manages order status polling and notifications
 * Uses HTTP polling to check for order updates
 */
import API_BASE_URL from '../config/api';

class RealtimeService {
  constructor() {
    this.pollIntervals = {};
    this.listeners = {};
    this.notificationQueue = [];
  }

  /**
   * Start polling for order updates
   * @param {string} orderId - Order ID to poll
   * @param {function} onUpdate - Callback when order status changes
   * @param {number} pollInterval - Poll interval in milliseconds (default 5000)
   */
  startPolling(orderId, onUpdate, pollInterval = 5000) {
    if (this.pollIntervals[orderId]) {
      console.warn(`Already polling order ${orderId}`);
      return;
    }

    console.log(`🔄 Starting real-time polling for order: ${orderId}`);

    // Fetch immediately on start
    this.fetchOrderStatus(orderId, onUpdate);

    // Then set up interval
    this.pollIntervals[orderId] = setInterval(() => {
      this.fetchOrderStatus(orderId, onUpdate);
    }, pollInterval);
  }

  /**
   * Fetch order status
   */
  async fetchOrderStatus(orderId, onUpdate) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order');
      
      const order = await response.json();
      
      // Call callback with updated order
      if (onUpdate) {
        onUpdate(order);
      }

      return order;
    } catch (error) {
      console.error(`Error polling order ${orderId}:`, error);
    }
  }

  /**
   * Stop polling for an order
   */
  stopPolling(orderId) {
    if (this.pollIntervals[orderId]) {
      clearInterval(this.pollIntervals[orderId]);
      delete this.pollIntervals[orderId];
      console.log(`⏹️ Stopped polling for order: ${orderId}`);
    }
  }

  /**
   * Stop all polling
   */
  stopAllPolling() {
    Object.keys(this.pollIntervals).forEach(orderId => {
      clearInterval(this.pollIntervals[orderId]);
    });
    this.pollIntervals = {};
    console.log('⏹️ Stopped all polling');
  }

  /**
   * Subscribe to status change events
   */
  on(orderId, eventType, callback) {
    if (!this.listeners[orderId]) {
      this.listeners[orderId] = {};
    }
    if (!this.listeners[orderId][eventType]) {
      this.listeners[orderId][eventType] = [];
    }
    this.listeners[orderId][eventType].push(callback);
  }

  /**
   * Emit status change event
   */
  emit(orderId, eventType, data) {
    if (this.listeners[orderId] && this.listeners[orderId][eventType]) {
      this.listeners[orderId][eventType].forEach(callback => {
        callback(data);
      });
    }
  }

  /**
   * Show notification
   */
  notify(message, type = 'info', duration = 5000) {
    const notification = {
      id: Date.now(),
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration
    };

    this.notificationQueue.push(notification);
    
    // Auto remove after duration
    setTimeout(() => {
      this.notificationQueue = this.notificationQueue.filter(n => n.id !== notification.id);
    }, duration);

    // Emit notification event
    this.emit('notifications', 'new', notification);

    return notification.id;
  }

  /**
   * Get status timeline data
   */
  getStatusTimeline(statusTimeline) {
    const statuses = ['pending', 'preparing', 'ready', 'completed'];
    const timeline = {};

    statuses.forEach(status => {
      const entry = statusTimeline?.find(t => t.status === status);
      timeline[status] = {
        completed: !!entry,
        timestamp: entry?.timestamp || null,
        notes: entry?.notes || ''
      };
    });

    return timeline;
  }

  /**
   * Get status text
   */
  getStatusText(status) {
    const texts = {
      'pending': 'Pending Payment',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready for Pickup',
      'served': 'Order Served',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return texts[status] || status;
  }

  /**
   * Get status color
   */
  getStatusColor(status) {
    const colors = {
      'pending': '#FF9800',      // orange
      'confirmed': '#2196F3',    // blue
      'preparing': '#2196F3',    // blue
      'ready': '#4CAF50',        // green
      'served': '#4CAF50',       // green
      'completed': '#4CAF50',    // green
      'cancelled': '#F44336'     // red
    };
    return colors[status] || '#999';
  }
}

// Export singleton instance
const realtimeService = new RealtimeService();
export default realtimeService;
