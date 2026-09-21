import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './KitchenDisplay.css';
import './StationDisplay.css';
import './KitchenBoard.css';
import { LuMartini, LuBell, LuBellOff, LuMaximize, LuRefreshCw, LuFlame, LuChartColumn, LuClock, LuUndo2, LuCheck, LuArmchair, LuStickyNote, LuUser, LuTriangleAlert } from 'react-icons/lu';
import StatusBoard, { getStationStatus } from './StatusBoard';
import { isBarItem } from './stationItems';
import { ConnectionStatus, MixedOrderProgress, getNewOrderIds, useOrderSound } from './StationUpdates';
import API_BASE_URL from '../../config/api';
import { authHeaders } from '../../services/api';


function KitchenDisplay() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('active');
  const [history, setHistory] = useState([]);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const showHistory = filter === 'history' || filter === 'all';
  useEffect(() => {
    if (!showHistory) { setHistoryLoading(false); return; }
    const controller = new AbortController();
    let fetching = false;
    const loadHistory = async () => {
      if (fetching) return;
      fetching = true;
      setHistoryLoading(true);
      setHistoryError('');
      try {
        const results = await Promise.all(['completed', 'cancelled'].map(async status => {
          const response = await fetch(`${API_BASE_URL}/api/orders?status=${status}&limit=100`, { signal: controller.signal, headers: authHeaders() });
          const data = await response.json();
          if (!response.ok || !data.success || !Array.isArray(data.orders)) throw new Error('Unable to load history. Try Refresh.');
          return data.orders;
        }));
        if (!controller.signal.aborted) { setHistoryLoaded(true); setHistory(results.flat().map(order => ({ ...order, allItems: order.items || [], preparationItems: (order.items || []).map((item, actualIndex) => ({ ...item, actualIndex })) }))); }
      } catch (error) {
        if (!controller.signal.aborted) setHistoryError(error.message);
      } finally {
        fetching = false;
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    };
    loadHistory();
    const interval = setInterval(loadHistory, 10000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [showHistory, historyRefresh]);
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
      const response = await fetch(`${API_BASE_URL}/api/orders?status=active&limit=200`, { signal: controller.signal, headers: authHeaders() });
      const data = await response.json();

      if (!response.ok || !data.success || !Array.isArray(data.orders)) throw new Error('Orders unavailable');
      if (data.success) {
        const allOrders = data.orders || [];
        const preparationOrders = allOrders
          .filter(order => order.items?.length)
          .map(order => {
            // Keep original item indices for food and drink status updates.
            const preparationItemsWithIndices = (order.items || [])
              .map((item, actualIndex) => ({
                ...item,
                actualIndex: actualIndex
              }));
            
            return {
              ...order,
              preparationItems: preparationItemsWithIndices,
              allItems: order.items || []
            };
          });

        const incomingIds = getNewOrderIds(seenOrderIds.current, preparationOrders, 'preparationItems');
        seenOrderIds.current = new Set([...(seenOrderIds.current || []), ...preparationOrders.map(order => order._id)]);
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
        setOrders(preparationOrders);
      }
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Kitchen Display fetch error:', error);
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
    console.log('🔥 Kitchen: Updating item', itemIndex, 'to status', newStatus, 'for order', orderId);
    setUpdatingOrderId(orderId);
    try {
      const payload = { 
        status: newStatus,
        itemIndex: itemIndex,
        changedBy: isBarItem(orders.find(order => order._id === orderId)?.items?.[itemIndex] || {}) ? 'bartender' : 'kitchen'
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
        const preparationItemsWithIndices = (result.order.items || [])
          .map((item, actualIndex) => ({
            ...item,
            actualIndex: actualIndex
          }));
        
        const updatedOrder = {
          ...result.order,
          _id: result.order._id || orderId,
          preparationItems: preparationItemsWithIndices,
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

  const combinedOrders = [...orders, ...history.filter(item => !orders.some(order => order._id === item._id))];
  const stationOrders = combinedOrders.map(order => ({
    ...order,
    originalStatus: order.status,
    status: getStationStatus(order, order.preparationItems)
  }));
  const counts = Object.fromEntries(['pending', 'preparing', 'ready', 'out_for_delivery', 'served', 'completed', 'cancelled'].map(status =>
    [status, stationOrders.filter(order => order.status === status).length]
  ));
  counts.active = counts.pending + counts.preparing + counts.ready;

  const getActionButtons = (order, itemIndex) => {
    if (['completed', 'cancelled', 'served', 'out_for_delivery'].includes(order.originalStatus)) return null;
    const isUpdating = updatingOrderId === order._id;
    const readyLabel = 'Mark ready';
    const handoverLabel = order.orderType === 'Delivery' ? 'Out for Delivery' : order.orderType === 'Takeaway' ? 'Collected' : 'Served';
    const allItems = order.items || order.allItems || [];
    const itemStatus = (allItems[itemIndex]?.itemStatus) || order.originalStatus;
    
    switch (itemStatus) {
      case 'pending':
        return (
          <button className="kds-action-btn start-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'preparing')} disabled={isUpdating}>
            {isUpdating ? <LuClock aria-hidden="true" /> : <LuFlame aria-hidden="true" />} Start Preparing
          </button>
        );
      case 'preparing':
        return (
          <>
            <button className="kds-action-btn undo-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'pending')} disabled={isUpdating} aria-label="Undo item status" title="Undo item status"><LuUndo2 aria-hidden="true" /></button>
            <button className="kds-action-btn ready-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'ready')} disabled={isUpdating}>
              {isUpdating ? <LuClock aria-hidden="true" /> : <LuCheck aria-hidden="true" />} {readyLabel}
            </button>
          </>
        );
      case 'ready':
        return (
          <>
            <button className="kds-action-btn undo-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'preparing')} disabled={isUpdating} aria-label="Undo item status" title="Undo item status"><LuUndo2 aria-hidden="true" /></button>
            <button className="kds-action-btn served-btn" onClick={() => handleUpdateStatus(order._id, itemIndex, 'served')} disabled={isUpdating}>
              {isUpdating ? <LuClock aria-hidden="true" /> : <LuCheck aria-hidden="true" />} {handoverLabel}
            </button>
          </>
        );
      case 'served':
        return (
          <button className="kds-action-btn completed-btn" disabled>
            <LuCheck aria-hidden="true" /> {handoverLabel}
          </button>
        );
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="kds-loading">
        <div className="kds-loading-spinner"></div>
        <p className="kds-loading-text">Loading Kitchen & Bar Display...</p>
      </div>
    );
  }

  return (
    <div className="kds-container station-display kitchen-board">
      {/* Header */}
      <header className="kds-header">
        <div className="kds-header-left">
          <div className="kds-logo">
            <div className="kds-logo-icon"><LuFlame aria-hidden="true" /></div>
            <div className="kds-logo-text">
              <h1>Kitchen &amp; Bar Display</h1>
              <ConnectionStatus lastUpdated={lastUpdated} now={currentTime} error={connectionError} refreshing={refreshing} />
            </div>
          </div>
        </div>

        <div className="kds-header-right">
          <div className="kds-clock">{formatClock(currentTime)}</div>
          <button
            className={`kds-sound-btn kds-alert-toggle ${soundEnabled && soundReady ? 'active' : ''}`}
            onClick={() => { if (!soundEnabled || !soundReady) { enableSound(); setSoundEnabled(true); } else setSoundEnabled(false); }}
            role="switch"
            aria-label="Order alert sound"
            aria-checked={soundEnabled && soundReady}
            title={soundEnabled && soundReady ? 'Mute order alerts' : 'Enable order alert sound'}
          >
            <span className="kds-alert-icon" aria-hidden="true">{soundEnabled && soundReady ? <LuBell /> : <LuBellOff />}</span>
            <span className="kds-alert-copy">
              <span className="kds-alert-label">Order alerts</span>
              <span className="kds-alert-state">{soundEnabled && soundReady ? 'Sound on' : soundEnabled ? 'Enable sound' : 'Muted'}</span>
            </span>
            <span className="kds-alert-track" aria-hidden="true"><span /></span>
          </button>
          <button className="kds-fullscreen-btn" onClick={toggleFullscreen} title="Toggle fullscreen" aria-label="Toggle fullscreen"><LuMaximize aria-hidden="true" /></button>
          <button className={`kds-refresh-btn ${refreshing ? 'refreshing' : ''}`} onClick={() => { fetchOrders(); setHistoryRefresh(value => value + 1); }} disabled={refreshing || historyLoading}>
            <span className={refreshing ? 'spin' : ''}><LuRefreshCw aria-hidden="true" /></span> Refresh
          </button>
          <button className="kds-nav-btn dashboard-btn" onClick={() => navigate('/admin/dashboard')}><LuChartColumn aria-hidden="true" /> Dashboard</button>
        </div>
      </header>


      {/* Filter Tabs */}
      <div className="kds-filters">
        {[
          { key: 'active', label: 'Active Orders', count: counts.active },
          { key: 'out_for_delivery', label: 'Out for Delivery', count: counts.out_for_delivery },
          { key: 'history', label: 'History', count: historyLoaded ? counts.served + counts.completed + counts.cancelled : null },
          { key: 'all', label: 'All Orders', count: historyLoaded ? combinedOrders.length : null }
        ].map(tab => (
          <button
            key={tab.key}
            className={`kds-filter-btn ${filter === tab.key ? 'active kitchen-active' : ''}`}
            aria-pressed={filter === tab.key}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            {tab.count !== null && <span className="kds-filter-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {showHistory && <p className="kds-history-note" role="status">{historyError || (historyLoading ? 'Updating history...' : 'History includes served orders and the latest 100 completed and 100 cancelled orders.')}</p>}
      <StatusBoard orders={stationOrders} filter={filter} preparingLabel="Preparing" preparationOnly>
            {order => {
              const urgency = ['pending', 'preparing', 'ready'].includes(order.status) ? getTimerUrgency(order.createdAt) : 'normal';
              return (
                <div key={order._id} className={`kds-order-card status-${order.status} ${urgency} ${currentTime - (newOrderTimes[order._id] || 0) < 30000 ? 'new-order' : ''}`}>
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
                          {order.status === 'preparing' && <LuFlame aria-hidden="true" />}
                          {order.status === 'ready' && <LuCheck aria-hidden="true" />}
                          {order.status === 'served' && <LuCheck aria-hidden="true" />}
                          {' '}{order.status === 'pending' ? 'Received' : order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="kds-card-timer">
                      <div className={`kds-timer ${urgency}`}>{getTimeElapsed(order.createdAt, order.completedAt, order.status)}</div>
                      <div className={`kds-timer-label ${urgency}`}>{urgency === 'urgent' ? 'Overdue' : urgency === 'warning' ? 'Waiting 15+ min' : 'Elapsed'}</div>
                    </div>
                  </div>

                  {order.customerName && <div className="kds-customer-name"><LuUser aria-hidden="true" /> {order.customerName}</div>}

                  {order.originalStatus === 'out_for_delivery' && <button className="kds-action-btn completed-btn" disabled={updatingOrderId === order._id} onClick={() => handleUpdateStatus(order._id, undefined, 'completed')}>Mark delivered</button>}
                  <MixedOrderProgress order={order} />

                  <div className="kds-items-count">
                    {order.preparationItems.length} item{order.preparationItems.length !== 1 ? 's' : ''}
                  </div>

                  <div className="kds-card-items">
                    {order.preparationItems.map((item, displayIdx) => {
                      // Use the actualIndex stored during filtering
                      const actualItemIndex = item.actualIndex;
                      return (
                        <div key={displayIdx} className="kds-item">
                          <span className={`kds-item-qty ${isBarItem(item) ? 'bar-qty' : 'kitchen-qty'}`}>{item.quantity}×</span>
                          <div className="kds-item-details">
                            <div className="kds-item-name">{item.name}</div>
                            <div className="kds-item-modifiers">{isBarItem(item) ? <><LuMartini aria-hidden="true" /> Bar</> : <><LuFlame aria-hidden="true" /> Kitchen</>}</div>
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
                              {item.itemStatus === 'pending' && <><LuClock aria-hidden="true" /> Received</>}
                              {item.itemStatus === 'preparing' && <><LuFlame aria-hidden="true" /> Preparing</>}
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

                  {order.notes && <div className="kds-order-notes"><LuStickyNote aria-hidden="true" /> {order.notes}</div>}
                </div>
              );
            }}
      </StatusBoard>
    </div>
  );
}

export default KitchenDisplay;
