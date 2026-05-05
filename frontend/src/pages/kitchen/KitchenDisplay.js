import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './KitchenDisplay.css';
import API_BASE_URL from '../../config/api';

const KITCHEN_CATEGORIES = ['Pasta', 'Sandwiches', 'Sides', 'Rice Meals'];

function KitchenDisplay() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('active');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const previousOrderCount = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setRefreshing(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(`${API_BASE_URL}/api/orders?limit=200`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        const allOrders = data.orders || [];
        const kitchenOrders = allOrders
          .filter(order => order.items?.some(item => isKitchenItem(item)))
          .map(order => {
            // Create kitchenItems with their actual indices in the items array
            const kitchenItemsWithIndices = (order.items || [])
              .map((item, actualIndex) => ({
                ...item,
                actualIndex: actualIndex
              }))
              .filter(item => isKitchenItem(item));
            
            return {
              ...order,
              kitchenItems: kitchenItemsWithIndices,
              allItems: order.items || []
            };
          });

        if (soundEnabled && kitchenOrders.length > previousOrderCount.current && previousOrderCount.current > 0) {
          playNotificationSound();
        }
        previousOrderCount.current = kitchenOrders.length;
        setOrders(kitchenOrders);
      }
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Kitchen Display fetch error:', error);
      setLoading(false);
      setRefreshing(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const isKitchenItem = (item) => {
    const itemName = (item.name || '').toLowerCase();
    const foodKeywords = [
      'pasta', 'spaghetti', 'carbonara', 'bolognese', 'aglio', 'pesto',
      'sandwich', 'club', 'grilled', 'panini', 'blt', 'wrap',
      'rice', 'meal', 'adobo', 'sinigang', 'sisig', 'fried', 'chicken',
      'fries', 'nachos', 'wings', 'calamari', 'bruschetta', 'salad',
      'soup', 'garlic bread', 'mozzarella', 'spring rolls', 'side'
    ];
    if (item.category && KITCHEN_CATEGORIES.includes(item.category)) return true;
    return foodKeywords.some(keyword => itemName.includes(keyword));
  };

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  };

  const handleUpdateStatus = async (orderId, itemIndex, newStatus) => {
    console.log('🔥 Kitchen: Updating item', itemIndex, 'to status', newStatus, 'for order', orderId);
    setUpdatingOrderId(orderId);
    try {
      const payload = { 
        status: newStatus,
        itemIndex: itemIndex,
        changedBy: 'kitchen'
      };
      console.log('📤 Sending payload:', payload);
      
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('📥 Response status:', response.status);
      const result = await response.json();
      console.log('📥 Response body:', result);
      
      if ((result.success || response.ok) && result.order) {
        console.log('✅ Update successful, updating local state');
        // Update local state with the new order data
        const kitchenItemsWithIndices = (result.order.items || [])
          .map((item, actualIndex) => ({
            ...item,
            actualIndex: actualIndex
          }))
          .filter(item => isKitchenItem(item));
        
        const updatedOrder = {
          ...result.order,
          _id: result.order._id || orderId,
          kitchenItems: kitchenItemsWithIndices,
          allItems: result.order.items || []
        };
        
        console.log('Updated order:', updatedOrder);
        
        setOrders(prev => prev.map(order =>
          order._id === orderId ? updatedOrder : order
        ));
      } else {
        console.error('❌ Invalid response from server:', result);
        alert('Failed to update item status: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Status update error:', error);
      alert('Failed to update item status: ' + error.message);
    }
    setUpdatingOrderId(null);
  };

  const getTimeElapsed = (createdAt, completedAt, status) => {
    // If order is completed, use the time from creation to completion
    const endTime = status === 'completed' && completedAt ? new Date(completedAt) : new Date();
    const diffMs = endTime - new Date(createdAt);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  const getTimerUrgency = (createdAt) => {
    const diffMins = Math.floor((new Date() - new Date(createdAt)) / 60000);
    if (diffMins < 15) return 'normal';
    if (diffMins < 30) return 'warning';
    return 'urgent';
  };

  const formatClock = (date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  const getFilteredOrders = () => {
    switch (filter) {
      case 'pending': return orders.filter(o => o.status === 'pending');
      case 'preparing': return orders.filter(o => o.status === 'preparing');
      case 'ready': return orders.filter(o => o.status === 'ready');
      case 'active': return orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
      case 'completed': return orders.filter(o => o.status === 'completed');
      default: return orders;
    }
  };

  const filteredOrders = getFilteredOrders();
  const counts = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    active: orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length
  };

  const getActionButtons = (order, itemIndex) => {
    const isUpdating = updatingOrderId === order._id;
    const allItems = order.items || order.allItems || [];
    const itemStatus = (allItems[itemIndex]?.itemStatus) || order.status;
    
    switch (itemStatus) {
      case 'pending':
        return (
          <button className="kds-action-btn start-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'preparing')} disabled={isUpdating}>
            {isUpdating ? '⏳' : '🔥'} Start Cooking
          </button>
        );
      case 'preparing':
        return (
          <>
            <button className="kds-action-btn undo-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'pending')} disabled={isUpdating}>↩</button>
            <button className="kds-action-btn ready-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'ready')} disabled={isUpdating}>
              {isUpdating ? '⏳' : '✅'} Ready to Serve
            </button>
          </>
        );
      case 'ready':
        return (
          <>
            <button className="kds-action-btn undo-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'preparing')} disabled={isUpdating}>↩</button>
            <button className="kds-action-btn served-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'served')} disabled={isUpdating}>
              {isUpdating ? '⏳' : '🍽️'} Served
            </button>
          </>
        );
      case 'served':
        return (
          <button className="kds-action-btn completed-btn" disabled>
            ✅ Served
          </button>
        );
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="kds-loading">
        <div className="kds-loading-spinner"></div>
        <p className="kds-loading-text">Loading Kitchen Display...</p>
      </div>
    );
  }

  return (
    <div className="kds-container">
      {/* Header */}
      <header className="kds-header">
        <div className="kds-header-left">
          <div className="kds-logo">
            <div className="kds-logo-icon">🔥</div>
            <div className="kds-logo-text">
              <h1>Kitchen Display</h1>
              <span>Alimento Restaurant</span>
            </div>
          </div>
        </div>

        <div className="kds-header-center">
          <div className="kds-stat">
            <span className="kds-stat-number pending">{counts.pending}</span>
            <span className="kds-stat-label">Pending</span>
          </div>
          <div className="kds-stat">
            <span className="kds-stat-number preparing">{counts.preparing}</span>
            <span className="kds-stat-label">Cooking</span>
          </div>
          <div className="kds-stat">
            <span className="kds-stat-number ready">{counts.ready}</span>
            <span className="kds-stat-label">Ready</span>
          </div>
        </div>

        <div className="kds-header-right">
          <div className="kds-clock">{formatClock(currentTime)}</div>
          <button className={`kds-sound-btn ${soundEnabled ? 'active' : ''}`} onClick={() => setSoundEnabled(!soundEnabled)} title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}>
            {soundEnabled ? '🔔' : '🔕'}
          </button>
          <button className="kds-fullscreen-btn" onClick={toggleFullscreen} title="Toggle fullscreen">⛶</button>
          <button className={`kds-refresh-btn ${refreshing ? 'refreshing' : ''}`} onClick={fetchOrders} disabled={refreshing}>
            <span className={refreshing ? 'spin' : ''}>↻</span> Refresh
          </button>
          <button className="kds-nav-btn bar-btn" onClick={() => navigate('/bartender')}>🍸 Bar Display</button>
          <button className="kds-nav-btn dashboard-btn" onClick={() => navigate('/dashboard')}>📊 Dashboard</button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="kds-filters">
        {[
          { key: 'active', label: 'Active Orders', count: counts.active },
          { key: 'pending', label: 'Pending', count: counts.pending },
          { key: 'preparing', label: 'Cooking', count: counts.preparing },
          { key: 'ready', label: 'Ready', count: counts.ready },
          { key: 'completed', label: 'Completed', count: counts.completed },
          { key: 'all', label: 'All Orders', count: orders.length }
        ].map(tab => (
          <button
            key={tab.key}
            className={`kds-filter-btn ${filter === tab.key ? 'active kitchen-active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span className="kds-filter-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="kds-empty-state">
          <div className="kds-empty-icon">👨‍🍳</div>
          <h2 className="kds-empty-title">No orders in the kitchen</h2>
          <p className="kds-empty-subtitle">New orders will appear here automatically</p>
        </div>
      ) : (
        <div className="kds-orders-grid">
          {filteredOrders
            .sort((a, b) => {
              const statusPriority = { pending: 0, preparing: 1, ready: 2, served: 3, completed: 4 };
              const priorityDiff = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
              if (priorityDiff !== 0) return priorityDiff;
              return new Date(a.createdAt) - new Date(b.createdAt);
            })
            .map(order => {
              const urgency = getTimerUrgency(order.createdAt);
              return (
                <div key={order._id} className={`kds-order-card status-${order.status} ${urgency === 'urgent' ? 'urgent' : ''}`}>
                  <div className="kds-card-header">
                    <div className="kds-order-info">
                      <div className="kds-order-number">{order.orderNumber || 'N/A'}</div>
                      <div className="kds-order-meta">
                        {order.tableNumber && <span className="kds-table-badge">🪑 Table {order.tableNumber}</span>}
                        <span className={`kds-order-type ${(order.orderType || 'dine-in').toLowerCase().replace(' ', '-')}`}>
                          {order.orderType || 'Dine-in'}
                        </span>
                        <span className={`kds-status-badge ${order.status}`}>
                          {order.status === 'pending' && '⏳'}
                          {order.status === 'preparing' && '🔥'}
                          {order.status === 'ready' && '✅'}
                          {order.status === 'served' && '🍽️'}
                          {' '}{order.status}
                        </span>
                      </div>
                    </div>
                    <div className="kds-card-timer">
                      <div className={`kds-timer ${urgency}`}>{getTimeElapsed(order.createdAt, order.completedAt, order.status)}</div>
                      <div className="kds-timer-label">Elapsed</div>
                    </div>
                  </div>

                  {order.customerName && <div className="kds-customer-name">{order.customerName}</div>}

                  <div className="kds-items-count">
                    {order.kitchenItems.length} kitchen item{order.kitchenItems.length !== 1 ? 's' : ''}
                    {order.allItems.length > order.kitchenItems.length && ` (${order.allItems.length - order.kitchenItems.length} bar items)`}
                  </div>

                  <div className="kds-card-items">
                    {order.kitchenItems.map((item, displayIdx) => {
                      // Use the actualIndex stored during filtering
                      const actualItemIndex = item.actualIndex;
                      return (
                        <div key={displayIdx} className="kds-item">
                          <span className="kds-item-qty kitchen-qty">{item.quantity}×</span>
                          <div className="kds-item-details">
                            <div className="kds-item-name">{item.name}</div>
                            {item.modifiers?.length > 0 && (
                              <div className="kds-item-modifiers">
                                {item.modifiers.map(mod => `${mod.modifierName}: ${mod.selectedOption}`).join(' · ')}
                              </div>
                            )}
                            {item.addons?.length > 0 && (
                              <div className="kds-item-modifiers">+ {item.addons.map(a => a.name).join(', ')}</div>
                            )}
                            {item.specialInstructions && (
                              <div className="kds-item-note">{item.specialInstructions}</div>
                            )}
                            <div className="kds-item-status-badge">
                              {item.itemStatus === 'pending' && '⏳ Pending'}
                              {item.itemStatus === 'preparing' && '🔥 Cooking'}
                              {item.itemStatus === 'ready' && '✅ Ready'}
                              {item.itemStatus === 'served' && '🍽️ Served'}
                            </div>
                          </div>
                          <div className="kds-item-actions">
                            {actualItemIndex >= 0 && getActionButtons(order, actualItemIndex)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {order.notes && <div className="kds-order-notes">{order.notes}</div>}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default KitchenDisplay;
