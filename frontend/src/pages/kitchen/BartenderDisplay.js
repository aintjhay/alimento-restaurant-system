import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './KitchenDisplay.css';
import './StationDisplay.css';
import { LuMartini, LuBell, LuBellOff, LuMaximize, LuRefreshCw, LuFlame, LuChartColumn, LuClock, LuUndo2, LuCheck, LuArmchair, LuStickyNote, LuUser, LuTriangleAlert } from 'react-icons/lu';
import StatusBoard, { getStationStatus } from './StatusBoard';
import { isBarItem } from './stationItems';
import { ConnectionStatus, MixedOrderProgress, getNewOrderIds, useOrderSound } from './StationUpdates';
import API_BASE_URL from '../../config/api';
import { authHeaders } from '../../services/api';


function BartenderDisplay() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('active');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const seenOrderIds = useRef(null);
  const fetchInProgress = useRef(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [newOrderTimes, setNewOrderTimes] = useState({});
  const { playNotificationSound, enableSound, soundReady } = useOrderSound();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = useCallback(async () => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      setRefreshing(true);
      const response = await fetch(`${API_BASE_URL}/api/orders?limit=200`, { signal: controller.signal, headers: authHeaders() });
      const data = await response.json();

      if (!response.ok || !data.success || !Array.isArray(data.orders)) throw new Error('Orders unavailable');
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

        const incomingIds = getNewOrderIds(seenOrderIds.current, barOrders, 'barItems');
        seenOrderIds.current = new Set([...(seenOrderIds.current || []), ...barOrders.map(order => order._id)]);
        if (incomingIds.length) {
          const now = Date.now();
          setNewOrderTimes(previous => Object.fromEntries([
            ...Object.entries(previous).filter(([, time]) => now - time < 30000),
            ...incomingIds.map(id => [id, now])
          ]));
          if (soundEnabled) playNotificationSound();
        }
        setLastUpdated(new Date());
        setConnectionError(false);
        setOrders(barOrders);
      }
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Bartender Display fetch error:', error);
      setConnectionError(true);
      setLoading(false);
      setRefreshing(false);
    } finally {
      clearTimeout(timeoutId);
      fetchInProgress.current = false;
    }
  }, [soundEnabled, playNotificationSound]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);



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
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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

  const stationOrders = orders.map(order => ({
    ...order,
    originalStatus: order.status,
    status: getStationStatus(order, order.barItems)
  }));
  const counts = Object.fromEntries(['pending', 'preparing', 'ready', 'served', 'completed'].map(status =>
    [status, stationOrders.filter(order => order.status === status).length]
  ));
  counts.active = counts.pending + counts.preparing + counts.ready;

  const getActionButtons = (order, itemIndex) => {
    if (['completed', 'cancelled', 'served'].includes(order.originalStatus)) return null;
    const isUpdating = updatingOrderId === order._id;
    const allItems = order.items || order.allItems || [];
    
    // Safety check: ensure itemIndex is valid
    if (itemIndex < 0 || itemIndex >= allItems.length) {
      console.warn(`Invalid itemIndex ${itemIndex} for order with ${allItems.length} items`);
      return null;
    }
    
    const itemStatus = (allItems[itemIndex]?.itemStatus) || order.originalStatus;
    
    switch (itemStatus) {
      case 'pending':
        return (
          <button className="kds-action-btn start-btn bar-theme" onClick={() => handleUpdateStatus(order._id, itemIndex, 'preparing')} disabled={isUpdating}>
            {isUpdating ? <LuClock aria-hidden="true" /> : <LuMartini aria-hidden="true" />} Start Preparing
          </button>
        );
      case 'preparing':
        return (
          <>
            <button className="kds-action-btn undo-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'pending')} disabled={isUpdating} aria-label="Undo item status" title="Undo item status"><LuUndo2 aria-hidden="true" /></button>
            <button className="kds-action-btn ready-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'ready')} disabled={isUpdating}>
              {isUpdating ? <LuClock aria-hidden="true" /> : <LuCheck aria-hidden="true" />} Ready to Serve
            </button>
          </>
        );
      case 'ready':
        return (
          <>
            <button className="kds-action-btn undo-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'preparing')} disabled={isUpdating} aria-label="Undo item status" title="Undo item status"><LuUndo2 aria-hidden="true" /></button>
            <button className="kds-action-btn served-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'served')} disabled={isUpdating}>
              {isUpdating ? <LuClock aria-hidden="true" /> : <LuCheck aria-hidden="true" />} Served
            </button>
          </>
        );
      case 'served':
        return (
          <button className="kds-action-btn completed-btn" disabled>
            <LuCheck aria-hidden="true" /> Served
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
    <div className="kds-container station-display">
      {/* Header */}
      <header className="kds-header">
        <div className="kds-header-left">
          <div className="kds-logo">
            <div className="kds-logo-icon"><LuMartini aria-hidden="true" /></div>
            <div className="kds-logo-text">
              <h1>Bartender Display</h1>
              <span>Alimento Restaurant</span>
            </div>
          </div>
        </div>

        <div className="kds-header-right">
          <div className="kds-clock">{formatClock(currentTime)}</div>
          <button className={`kds-sound-btn ${soundEnabled ? 'active' : ''}`} onClick={() => { if (!soundEnabled || !soundReady) { enableSound(); setSoundEnabled(true); } else setSoundEnabled(false); }} aria-label="Order alerts" aria-pressed={soundEnabled && soundReady} title={soundEnabled ? 'Mute order alerts' : 'Enable order alerts'}>
            {soundEnabled ? <LuBell aria-hidden="true" /> : <LuBellOff aria-hidden="true" />} <span>Order alerts: {soundEnabled ? (soundReady ? 'On' : 'Enable sound') : 'Off'}</span>
          </button>
          <button className="kds-fullscreen-btn" onClick={toggleFullscreen} title="Toggle fullscreen" aria-label="Toggle fullscreen"><LuMaximize aria-hidden="true" /></button>
          <button className={`kds-refresh-btn ${refreshing ? 'refreshing' : ''}`} onClick={fetchOrders} disabled={refreshing}>
            <span className={refreshing ? 'spin' : ''}><LuRefreshCw aria-hidden="true" /></span> Refresh
          </button>
          <button className="kds-nav-btn kitchen-btn" onClick={() => navigate('/admin/kitchen')}><LuFlame aria-hidden="true" /> Kitchen Display</button>
          <button className="kds-nav-btn dashboard-btn" onClick={() => navigate('/admin/dashboard')}><LuChartColumn aria-hidden="true" /> Dashboard</button>
        </div>
      </header>

      <ConnectionStatus lastUpdated={lastUpdated} now={currentTime} error={connectionError} refreshing={refreshing} />

      {/* Filter Tabs */}
      <div className="kds-filters">
        {[
          { key: 'active', label: 'Active Orders', count: counts.active },
          { key: 'pending', label: 'Pending', count: counts.pending },
          { key: 'preparing', label: 'Preparing', count: counts.preparing },
          { key: 'ready', label: 'Ready', count: counts.ready },
          { key: 'served', label: 'Served', count: counts.served },
          { key: 'completed', label: 'Completed', count: counts.completed },
          { key: 'all', label: 'All Orders', count: orders.length }
        ].map(tab => (
          <button
            key={tab.key}
            className={`kds-filter-btn ${filter === tab.key ? 'active bar-active' : ''}`}
            aria-pressed={filter === tab.key}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span className="kds-filter-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <StatusBoard orders={stationOrders} filter={filter} preparingLabel="Preparing">
            {order => {
              const urgency = ['pending', 'preparing', 'ready'].includes(order.status) ? getTimerUrgency(order.createdAt) : 'normal';
              return (
                <div key={order._id} className={`kds-order-card status-${order.status} ${urgency === 'urgent' ? 'urgent' : ''} ${currentTime - (newOrderTimes[order._id] || 0) < 30000 ? 'new-order' : ''}`}>
                  <div className="kds-card-header">
                    <div className="kds-order-info">
                      <div className="kds-order-number">{order.orderNumber || 'N/A'} {currentTime - (newOrderTimes[order._id] || 0) < 30000 && <span className="kds-new-label">New</span>}</div>
                      <div className="kds-order-meta">
                        {order.tableNumber && <span className="kds-table-badge"><LuArmchair aria-hidden="true" /> Table {order.tableNumber}</span>}
                        <span className={`kds-order-type ${(order.orderType || 'dine-in').toLowerCase().replace(' ', '-')}`}>
                          {order.orderType || 'Dine-in'}
                        </span>
                        <span className={`kds-status-badge ${order.status}`}>
                          {order.status === 'pending' && <LuClock aria-hidden="true" />}
                          {order.status === 'preparing' && <LuMartini aria-hidden="true" />}
                          {order.status === 'ready' && <LuCheck aria-hidden="true" />}
                          {order.status === 'served' && <LuCheck aria-hidden="true" />}
                          {' '}{order.status}
                        </span>
                      </div>
                    </div>
                    <div className="kds-card-timer">
                      <div className={`kds-timer ${urgency}`}>{getTimeElapsed(order.createdAt, order.completedAt, order.status)}</div>
                      <div className="kds-timer-label">Elapsed</div>
                    </div>
                  </div>

                  {order.customerName && <div className="kds-customer-name"><LuUser aria-hidden="true" /> {order.customerName}</div>}

                  <MixedOrderProgress order={order} />

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
                              <div className="kds-item-note"><LuTriangleAlert aria-hidden="true" /> {item.specialInstructions}</div>
                            )}
                            <div className={`kds-item-status-badge ${item.itemStatus || order.status}`}>
                              {item.itemStatus === 'pending' && <><LuClock aria-hidden="true" /> Pending</>}
                              {item.itemStatus === 'preparing' && <><LuMartini aria-hidden="true" /> Preparing</>}
                              {item.itemStatus === 'ready' && <><LuCheck aria-hidden="true" /> Ready</>}
                              {item.itemStatus === 'served' && <><LuCheck aria-hidden="true" /> Served</>}
                            </div>
                          </div>
                          <div className="kds-item-actions">
                            {actualItemIndex >= 0 && getActionButtons(order, actualItemIndex)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {order.notes && <div className="kds-order-notes"><LuStickyNote aria-hidden="true" />{order.notes}</div>}
                </div>
              );
            }}
      </StatusBoard>
    </div>
  );
}

export default BartenderDisplay;
