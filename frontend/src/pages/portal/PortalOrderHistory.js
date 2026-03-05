import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import PortalOrderCard from '../../components/portal/PortalOrderCard';
import OrderStatusNotification from '../../components/portal/OrderStatusNotification';
import realtimeService from '../../services/realtimeService';
import { ordersAPI } from '../../services/api';
import './Portal.css';

const PortalOrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, preparing, completed
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const portalUser = localStorage.getItem('portalUser');
    if (!portalUser) {
      navigate('/portal/login');
      return;
    }

    try {
      const userData = JSON.parse(portalUser);
      setUser(userData);
      // Check for both _id and id (backend may return either)
      const userId = userData._id || userData.id;
      if (userId) {
        loadOrderHistory(userId);
      } else {
        // Fallback to localStorage if no user ID
        loadOrderHistoryFromStorage();
      }
    } catch (err) {
      console.error('Error loading user:', err);
      navigate('/portal/login');
    }

    // Listen for notifications
    realtimeService.on('notifications', 'new', (notification) => {
      addNotification(notification);
    });

    return () => {
      realtimeService.stopAllPolling();
    };
  }, [navigate]);

  // Watch for order status changes and show notifications
  useEffect(() => {
    orders.forEach(order => {
      if (order.status !== 'completed' && order.status !== 'cancelled') {
        realtimeService.startPolling(
          order._id || order.id,
          (updatedOrder) => {
            // Check if status changed
            const oldOrder = orders.find(o => (o._id || o.id) === (updatedOrder._id || updatedOrder.id));
            if (oldOrder && oldOrder.status !== updatedOrder.status) {
              realtimeService.notify(
                `📦 Order ${updatedOrder.orderNumber || '#' + updatedOrder._id?.slice(-6)} is now ${realtimeService.getStatusText(updatedOrder.status).toLowerCase()}!`,
                'success'
              );
            }
            
            // Update order in state
            setOrders(prevOrders =>
              prevOrders.map(o =>
                (o._id || o.id) === (updatedOrder._id || updatedOrder.id) ? updatedOrder : o
              )
            );
          },
          5000 // Poll every 5 seconds
        );
      }
    });

    return () => {
      orders.forEach(order => {
        realtimeService.stopPolling(order._id || order.id);
      });
    };
  }, [orders]);

  const loadOrderHistoryFromStorage = async () => {
    setLoading(true);
    try {
      const savedOrders = localStorage.getItem('portalOrders');
      if (savedOrders) {
        try {
          const parsedOrders = JSON.parse(savedOrders);
          setOrders(Array.isArray(parsedOrders) ? parsedOrders : []);
        } catch {
          setOrders([]);
        }
      }
    } catch (error) {
      console.error('Error loading orders from storage:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderHistory = async (userId) => {
    setLoading(true);
    try {
      console.log('🔄 Fetching orders for user:', userId);
      // Fetch orders from backend API for the logged-in user
      const response = await fetch(`http://localhost:5000/api/orders/user/${userId}`);
      const data = await response.json();
      
      console.log('📦 Backend response:', data);
      
      if (data.success && Array.isArray(data.orders)) {
        console.log(`✅ Found ${data.orders.length} orders for user ${userId}`);
        setOrders(data.orders);
        
        // Save to localStorage as backup
        localStorage.setItem('portalOrders', JSON.stringify(data.orders));
      } else {
        console.log('⚠️ No orders found or error in response');
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error loading orders from backend:', error);
      // Fallback to localStorage if API fails
      loadOrderHistoryFromStorage();
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    // Auto remove after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, notification.duration || 5000);
  };

  const handleReorder = (order) => {
    // Add items back to cart
    if (order.items && order.items.length > 0) {
      const CART_KEY = 'portalCart';
      const cartItems = order.items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        basePrice: item.price,
        itemPrice: item.price, // Will be recalculated
        quantity: item.quantity,
        image: item.image || '',
        modifiers: item.modifiers || [],
        addons: item.addons || [],
        specialInstructions: item.specialInstructions || ''
      }));
      
      localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
      navigate('/portal/checkout');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (!user) {
    return <div className="portal-page"><PortalHeader /><PortalFooter /></div>;
  }

  return (
    <div className="portal-page">
      <PortalHeader />
      
      {/* Order Status Notifications */}
      <OrderStatusNotification />
      
      <main className="portal-main">
        <div className="portal-section">
          <div className="portal-section-header">
            <h1>Your Orders</h1>
            <p>Track and view your order history with real-time updates</p>
          </div>

          {/* Filter Buttons */}
          <div className="order-filters">
            {['all', 'pending', 'confirmed', 'preparing', 'completed'].map(status => (
              <button
                key={status}
                className={`filter-btn ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="orders-list">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <p>No orders found</p>
                <button 
                  className="primary-btn"
                  onClick={() => navigate('/portal')}
                >
                  Start Ordering
                </button>
              </div>
            ) : (
              <div className="orders-grid">
                {filteredOrders.map((order) => (
                  <PortalOrderCard
                    key={order._id || order.id}
                    order={order}
                    onReorder={handleReorder}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <PortalFooter />
    </div>
  );
};

export default PortalOrderHistory;
