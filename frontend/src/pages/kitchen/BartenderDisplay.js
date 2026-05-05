import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './KitchenDisplay.css';
import API_BASE_URL from '../../config/api';

const BAR_CATEGORIES = ['Cocktails', 'Yogurt Milkshakes', 'Coffee', 'Coolers'];

function BartenderDisplay() {
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
        const barOrders = allOrders
          .filter(order => order.items?.some(item => isBarItem(item)))
          .map(order => {
            // Create barItems with their actual indices in the items array
            const barItemsWithIndices = (order.items || [])
              .map((item, actualIndex) => ({
                ...item,
                actualIndex: actualIndex
              }))
              .filter(item => isBarItem(item));
            
            return {
              ...order,
              barItems: barItemsWithIndices,
              allItems: order.items || []
            };
          });

        if (soundEnabled && barOrders.length > previousOrderCount.current && previousOrderCount.current > 0) {
          playNotificationSound();
        }
        previousOrderCount.current = barOrders.length;
        setOrders(barOrders);
      }
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Bartender Display fetch error:', error);
      setLoading(false);
      setRefreshing(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const isBarItem = (item) => {
    // Primary check: use category if available
    if (item.category && BAR_CATEGORIES.includes(item.category)) {
      return true;
    }
    
    // Fallback: keyword matching for items without category
    const itemName = (item.name || '').toLowerCase();
    const drinkKeywords = [
      'cocktail', 'mojito', 'margarita', 'daiquiri', 'cosmopolitan', 'martini',
      'milkshake', 'yogurt', 'shake', 'smoothie',
      'coffee', 'espresso', 'latte', 'cappuccino', 'americano', 'mocha', 'macchiato',
      'cooler', 'iced', 'juice', 'lemonade', 'soda', 'tea', 'frappe',
      'beer', 'wine', 'sangria', 'spritz', 'negroni', 'old fashioned',
      'mango', 'strawberry', 'blueberry', 'matcha', 'chocolate drink',
      'sunrise', 'sunset', 'tropical', 'paradise', 'blue lagoon'
    ];
    return drinkKeywords.some(keyword => itemName.includes(keyword));
  };

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 1046;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.25;
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
  };

  const handleUpdateStatus = async (orderId, itemIndex, newStatus) => {
    console.log('🍸 Bartender: Updating item', itemIndex, 'to status', newStatus, 'for order', orderId);
    setUpdatingOrderId(orderId);
    try {
      const payload = { 
        status: newStatus,
        itemIndex: itemIndex,
        changedBy: 'bartender'
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
        const barItemsWithIndices = (result.order.items || [])
          .map((item, actualIndex) => ({
            ...item,
            actualIndex: actualIndex
          }))
          .filter(item => isBarItem(item));
        
        const updatedOrder = {
          ...result.order,
          _id: result.order._id || orderId,
          barItems: barItemsWithIndices,
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
    if (diffMins < 10) return 'normal';
    if (diffMins < 20) return 'warning';
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
    
    // Safety check: ensure itemIndex is valid
    if (itemIndex < 0 || itemIndex >= allItems.length) {
      console.warn(`Invalid itemIndex ${itemIndex} for order with ${allItems.length} items`);
      return null;
    }
    
    const itemStatus = (allItems[itemIndex]?.itemStatus) || order.status;
    
    switch (itemStatus) {
      case 'pending':
        return (
          <button className="kds-action-btn start-btn bar-theme" onClick={() => handleUpdateStatus(order._id, itemIndex, 'preparing')} disabled={isUpdating}>
            {isUpdating ? '⏳' : '🍸'} Start Making
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
              {isUpdating ? '⏳' : '🍹'} Served
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
        <div className="kds-loading-spinner bar-spinner"></div>
        <p className="kds-loading-text">Loading Bartender Display...</p>
      </div>
    );
  }

  return (
    <div className="kds-container">
      {/* Header */}
      <header className="kds-header">
        <div className="kds-header-left">
          <div className="kds-logo">
            <div className="kds-logo-icon">🍸</div>
            <div className="kds-logo-text">
              <h1>Bartender Display</h1>
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
            <span className="kds-stat-label">Making</span>
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
          <button className="kds-nav-btn kitchen-btn" onClick={() => navigate('/kitchen')}>🔥 Kitchen Display</button>
          <button className="kds-nav-btn dashboard-btn" onClick={() => navigate('/dashboard')}>📊 Dashboard</button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="kds-filters">
        {[
          { key: 'active', label: 'Active Orders', count: counts.active },
          { key: 'pending', label: 'Pending', count: counts.pending },
          { key: 'preparing', label: 'Making', count: counts.preparing },
          { key: 'ready', label: 'Ready', count: counts.ready },
          { key: 'completed', label: 'Completed', count: counts.completed },
          { key: 'all', label: 'All Orders', count: orders.length }
        ].map(tab => (
          <button
            key={tab.key}
            className={`kds-filter-btn ${filter === tab.key ? 'active bar-active' : ''}`}
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
          <div className="kds-empty-icon">🍹</div>
          <h2 className="kds-empty-title">No drink orders</h2>
          <p className="kds-empty-subtitle">New drink orders will appear here automatically</p>
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
                          {order.status === 'preparing' && '🍸'}
                          {order.status === 'ready' && '✅'}
                          {order.status === 'served' && '🍹'}
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
                    {order.barItems.length} drink{order.barItems.length !== 1 ? 's' : ''}
                    {order.allItems.length > order.barItems.length && ` (${order.allItems.length - order.barItems.length} kitchen items)`}
                  </div>

                  <div className="kds-card-items">
                    {order.barItems.map((item, displayIdx) => {
                      // Use the actualIndex stored during filtering
                      const actualItemIndex = item.actualIndex;
                      return (
                        <div key={displayIdx} className="kds-item">
                          <span className="kds-item-qty bar-qty">{item.quantity}×</span>
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
                              {item.itemStatus === 'preparing' && '🍸 Making'}
                              {item.itemStatus === 'ready' && '✅ Ready'}
                              {item.itemStatus === 'served' && '🍹 Served'}
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

export default BartenderDisplay;
