import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import realtimeService from '../../services/realtimeService';
import './Portal.css';

const PortalConfirmation = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [lastOrder, setLastOrder] = useState(null);

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
      
      <div className="portal-confirmation">
        <div className="confirmation-success">
          <div className="success-icon">✅</div>
          <h1>Thank you for your order!</h1>
          <p className="confirmation-subtitle">
            Your order has been placed successfully.
          </p>
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
        </div>

        <div className="confirmation-actions">
          <button 
            className="primary-btn view-order-btn"
            onClick={handleViewOrder}
          >
            View My Order
          </button>
          <button 
            className="text-link-btn"
            onClick={handleContinueShopping}
          >
            Back to Menu
          </button>
        </div>

        {/* Create Account Section - only shown to guest users */}
        {!isAuthenticated && (
          <div className="create-account-section">
            <h3>Save your preferences?</h3>
            <p>
              Create an account to save your addresses, track orders, and get personalized recommendations.
            </p>
            <button
              type="button"
              onClick={() => navigate('/portal/login')}
              className="secondary-btn"
            >
              Create an Account After This Order
            </button>
          </div>
        )}
      </div>
      
      <PortalFooter />
    </div>
  );
};

export default PortalConfirmation;
