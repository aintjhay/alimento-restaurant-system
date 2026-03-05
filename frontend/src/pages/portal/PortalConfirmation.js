import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import PortalOrderCard from '../../components/portal/PortalOrderCard';
import OrderStatusNotification from '../../components/portal/OrderStatusNotification';
import realtimeService from '../../services/realtimeService';
import './Portal.css';

const PortalConfirmation = () => {
  const navigate = useNavigate();
  const [lastOrder, setLastOrder] = useState(null);
  const [isAddingToHistory, setIsAddingToHistory] = useState(false);

  useEffect(() => {
    const order = JSON.parse(localStorage.getItem('portalLastOrder') || '{}');
    setLastOrder(order);

    // Add order to order history in localStorage for immediate viewing
    if (order && order._id) {
      const portalUser = localStorage.getItem('portalUser');
      if (portalUser) {
        try {
          const userData = JSON.parse(portalUser);
          const userId = userData._id || userData.id;
          
          if (userId) {
            setIsAddingToHistory(true);
            
            // Add to portalOrders in localStorage
            const existingOrders = localStorage.getItem('portalOrders');
            let orders = [];
            
            try {
              orders = JSON.parse(existingOrders) || [];
            } catch {
              orders = [];
            }
            
            // Add the new order to the beginning
            const updatedOrders = [order, ...orders.filter(o => o._id !== order._id)];
            localStorage.setItem('portalOrders', JSON.stringify(updatedOrders));
            
            console.log('✅ Order added to history for immediate viewing');
          }
        } catch (err) {
          console.error('Error adding order to history:', err);
        }
      }

      // Start real-time polling for the order
      console.log(`📡 Starting real-time polling for order ${order._id}`);
      realtimeService.startPolling(
        order._id,
        (updatedOrder) => {
          // Update the displayed order with latest info
          setLastOrder(updatedOrder);
          
          // Save updated order to localStorage
          localStorage.setItem('portalLastOrder', JSON.stringify(updatedOrder));
          
          // Show notification
          realtimeService.notify(
            `📦 Your order is now ${realtimeService.getStatusText(updatedOrder.status).toLowerCase()}!`,
            'success'
          );
        },
        5000 // Poll every 5 seconds
      );
    }

    return () => {
      // Stop polling when component unmounts
      if (lastOrder && lastOrder._id) {
        realtimeService.stopPolling(lastOrder._id);
      }
    };
  }, []);

  const handleViewOrder = () => {
    navigate('/portal/orders');
  };

  const handleContinueShopping = () => {
    navigate('/portal');
  };

  if (!lastOrder || !lastOrder.orderNumber) {
    return (
      <div className="portal-page">
        <PortalHeader />
        <div className="portal-confirmation">
          <p className="portal-kicker">Error</p>
          <h1>Order not found</h1>
          <p>Your order details could not be found. Please try placing a new order.</p>
          <button className="primary-btn" onClick={() => navigate('/portal')}>
            Back to menu
          </button>
        </div>
        <PortalFooter />
      </div>
    );
  }

  return (
    <div className="portal-page">
      <PortalHeader />
      
      {/* Order Status Notifications */}
      <OrderStatusNotification />
      
      <div className="portal-confirmation">
        <div className="confirmation-success">
          <div className="success-icon">✅</div>
          <p className="portal-kicker">Order Received</p>
          <h1>Thank you for your order!</h1>
          <p className="confirmation-subtitle">
            Your order has been placed successfully. We'll notify you as it's being prepared.
          </p>
        </div>

        {/* Rich Order Card Display */}
        <div className="confirmation-order-display">
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            Order Details
          </h2>
          <PortalOrderCard order={lastOrder} onReorder={null} />
        </div>

        <div className="confirmation-card">
          <div className="card-row">
            <label>Order Number</label>
            <strong className="order-number">{lastOrder.orderNumber || 'Pending'}</strong>
          </div>

          {lastOrder.totalAmount && (
            <div className="card-row">
              <label>Total Amount</label>
              <strong className="order-total">₱{lastOrder.totalAmount.toFixed(2)}</strong>
            </div>
          )}

          {lastOrder.items && (
            <div className="card-row">
              <label>Items</label>
              <span className="items-count">{lastOrder.items.length} item(s)</span>
            </div>
          )}

          {lastOrder.estimatedCompletionTime && (
            <div className="card-row">
              <label>Estimated Ready Time</label>
              <span className="estimated-time">
                ~35 minutes
              </span>
            </div>
          )}
        </div>

        <div className="confirmation-message">
          <p>📧 You'll receive updates about your order via email and in your order history.</p>
          <p>🔔 Real-time order status updates are enabled. Check back here or in your order history for live tracking!</p>
        </div>

        <div className="confirmation-actions">
          <button 
            className="primary-btn view-order-btn"
            onClick={handleViewOrder}
          >
            📋 View My Order
          </button>
          <button 
            className="secondary-btn continue-shopping-btn"
            onClick={handleContinueShopping}
          >
            🍽️ Back to Menu
          </button>
        </div>
      </div>
      
      <PortalFooter />
    </div>
  );
};

export default PortalConfirmation;
