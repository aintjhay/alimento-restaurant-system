import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalHeader from '../../components/portal/PortalHeader';
import AccountSidebar from '../../components/portal/AccountSidebar';
import { LuReceiptText, LuArrowUpRight } from 'react-icons/lu';
import PortalFooter from '../../components/portal/PortalFooter';
import PortalOrderCard from '../../components/portal/PortalOrderCard';
import OrderStatusNotification from '../../components/portal/OrderStatusNotification';
import realtimeService from '../../services/realtimeService';
import { API_URL } from '../../services/api';
import './Portal.css';
import './PortalUserProfile.css';
import './PortalOrderHistory.css';
import { mergeOrderUpdate } from '../../utils/orderUtils';

const PortalOrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active (pending/confirmed/preparing), completed




  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const activeOrderIds = JSON.stringify(orders.filter(order => !['completed', 'cancelled', 'served'].includes(order.status)).map(order => order._id || order.id).filter(Boolean).sort());

  useEffect(() => {
    const ids = JSON.parse(activeOrderIds);
    let active = true;
    ids.forEach(id => realtimeService.startPolling(id, response => {
      if (!active) return;
      const updated = response?.data || response?.order || response;
      if (!(updated?._id || updated?.id)) return;
      const previous = ordersRef.current.find(order => (order._id || order.id) === id);
      if (previous && previous.status !== updated.status) {
        realtimeService.notify(`Order ${updated.orderNumber || id} is now ${realtimeService.getStatusText(updated.status).toLowerCase()}!`, 'success');
      }
      setOrders(current => current.map(order => (order._id || order.id) === id ? mergeOrderUpdate(order, updated) : order));
    }, 10000));
    return () => { active = false; ids.forEach(id => realtimeService.stopPolling(id)); };
  }, [activeOrderIds]);

  const loadOrderHistoryFromStorage = useCallback(async () => {
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
  }, []);

  const loadOrderHistory = useCallback(async (userId) => {
    setLoading(true);
    try {
      console.log('🔄 Fetching orders for user:', userId);
      // Fetch orders from backend API for the logged-in user
      const response = await fetch(`${API_URL}/orders/user/${userId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("portalToken")}` } });
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
  }, [loadOrderHistoryFromStorage]);

  useEffect(() => {
    const portalUser = localStorage.getItem('portalUser');
    if (!portalUser) {
      navigate('/portal/track');
      return;
    }

    try {
      const userData = JSON.parse(portalUser);
      if (userData.type === 'guest') { navigate('/portal/track'); return; }
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

    return () => {
      realtimeService.stopAllPolling();
    };
  }, [navigate, loadOrderHistory, loadOrderHistoryFromStorage]);

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
    if (filter === 'active') return ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status);
    if (filter === 'completed') return ['completed', 'served'].includes(order.status);
    return order.status === filter;
  });

  if (!user) {
    return <div className="portal-page profile-page orders-page"><PortalHeader /><PortalFooter /></div>;
  }

  return (
    <div className="portal-page profile-page orders-page">
      <PortalHeader />
      
      {/* Order Status Notifications */}
      <OrderStatusNotification />
      
      <main className="portal-main">
        <div className="portal-section account-orders-shell">
          <div className="account-page-heading orders-heading">
            <div><p className="orders-eyebrow">YOUR ACCOUNT</p><h1>Your orders</h1><span>Good food, past and present. Find all your orders here.</span></div>
            <button className="orders-browse" onClick={() => navigate('/portal')}>Browse menu <LuArrowUpRight aria-hidden="true" /></button>
          </div>
          <div className="account-layout">
            <AccountSidebar user={user} active="orders" />
            <div className="account-content orders-content">
          <div className="orders-panel-heading"><div><h2>Order history</h2><p>View progress, check details, or order your favorites again.</p></div><span>{loading ? 'Loading' : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`}</span></div>
          {/* Filter Buttons */}
          <div className="order-filters" role="group" aria-label="Filter orders">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ].map(item => (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                className={`filter-btn ${filter === item.value ? 'active' : ''}`}
                onClick={() => setFilter(item.value)}
              >
                {item.label} <span className="order-filter-count">{orders.filter(order => item.value === 'all' || (item.value === 'active' ? ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status) : item.value === 'completed' ? ['completed', 'served'].includes(order.status) : order.status === item.value)).length}</span>
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
                <span className="orders-empty-icon"><LuReceiptText aria-hidden="true" /></span><h2>{filter === 'all' ? 'Your first order starts here' : `No ${filter} orders`}</h2><p>{filter === 'all' ? 'Explore the menu and find your next favorite.' : 'Try another filter to see the rest of your orders.'}</p>
                <button 
                  className="primary-btn"
                  onClick={() => navigate('/portal')}
                >
                  Browse menu
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
          </div>
        </div>
      </main>

      <PortalFooter />
    </div>
  );
};

export default PortalOrderHistory;
