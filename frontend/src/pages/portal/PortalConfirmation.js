import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import realtimeService from '../../services/realtimeService';
import { LuCheck, LuCopy, LuClock, LuX } from 'react-icons/lu';
import './Portal.css';
import { mergeOrderUpdate } from '../../utils/orderUtils';
import './PortalConfirmation.css';

const PortalConfirmation = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [lastOrder, setLastOrder] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    let order;
    try { order = JSON.parse(localStorage.getItem('portalLastOrder') || '{}'); } catch { order = {}; }
    setLastOrder(order);
    setLoaded(true);

    // Add order to order history in localStorage for immediate viewing
    if (order && order._id) {
      const portalUser = localStorage.getItem('portalUser');
      if (portalUser) {
        try {
          const userData = JSON.parse(portalUser);
          const userId = userData._id || userData.id;
          
          if (userId && userData.type !== 'guest') {
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
        (response) => {
          const updatedOrder = response?.data || response?.order || response;
          if (!updatedOrder?._id) return;
          // Update the displayed order with latest info
          setLastOrder(previous => mergeOrderUpdate(previous || {}, updatedOrder));
          
          // Save updated order to localStorage
          const saved = JSON.parse(localStorage.getItem('portalLastOrder') || '{}');
          localStorage.setItem('portalLastOrder', JSON.stringify(mergeOrderUpdate(saved, updatedOrder)));
        },
        5000 // Poll every 5 seconds
      );
    }

    return () => {
      // Stop polling when component unmounts
      if (order && order._id) {
        realtimeService.stopPolling(order._id);
      }
    };
  }, []);

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(lastOrder.orderNumber);
      setCopyMessage('Order number copied.');
    } catch {
      setCopyMessage('Could not copy. Select the order number to copy it manually.');
    }
  };

  const currency = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
  const statusMessages = {
    pending: ['Waiting for confirmation', 'Waiting for the restaurant to confirm your order.'],
    preparing: ['Preparing your order', 'The restaurant is preparing your items.'],
    ready: ['Ready', 'Your order is ready. Check order status for further updates.'],
    served: ['Served', 'Your order has been marked as served.'],
    completed: ['Completed', 'Your order is complete. Thank you for ordering from Alimento.'],
    cancelled: ['Cancelled', 'Your order has been cancelled. Check order details for more information.']
  };
  const paymentLabels = {
    paid: 'Paid', payment_verified: 'Payment verified', payment_pending_verification: 'Awaiting payment verification',
    partially_paid: 'Partially paid', refunded: 'Refunded'
  };
  const paymentMethods = { cash: 'Cash on delivery', qrph: 'QR Ph via PayMongo', gcash: 'GCash', card: 'Card', maya: 'Maya', bank_transfer: 'Bank transfer' };

  if (!loaded || !lastOrder?.orderNumber) {
    return (
      <div className="portal-page confirmation-page">
        <PortalHeader />
        <main className="receipt-shell">
          <h1>{loaded ? 'Order details unavailable' : 'Loading your order...'}</h1>
          {loaded && <><p>{isAuthenticated ? 'Check your order history for the latest details.' : 'Open your saved tracking link to see your order status.'}</p>{isAuthenticated && <button className="receipt-primary" onClick={() => navigate('/portal/orders')}>View orders</button>}<button className="receipt-secondary" onClick={() => navigate('/portal')}>Back to menu</button></>}
        </main>
        <PortalFooter />
      </div>
    );
  }

  const items = lastOrder.items || [];
  const count = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const status = statusMessages[lastOrder.status] || ['Order received', 'View order status for the latest updates.'];
  const cancelled = lastOrder.status === 'cancelled';
  const paymentStatus = paymentLabels[lastOrder.paymentStatus] || (lastOrder.paymentStatus === 'unpaid' ? (lastOrder.paymentMethod === 'cash' ? 'Pay on delivery' : 'Awaiting payment') : 'Payment status unavailable');

  return (
    <div className="portal-page confirmation-page">
      <PortalHeader cartCount={0} />
      <main className="receipt-shell">
        <div className="receipt-intro">
          <span className={`receipt-success-icon ${cancelled ? 'cancelled' : ''}`} aria-hidden="true">{cancelled ? <LuX /> : <LuCheck />}</span>
          <h1>{cancelled ? 'Order cancelled' : 'Order received'}</h1>
          <p>{cancelled ? 'See your order details below.' : 'Thank you! Your order has been sent to Alimento.'}</p>
        </div>
        <section className="receipt-card" aria-label="Order receipt">
          <div className="receipt-number"><div><span>Order number</span><strong>{lastOrder.orderNumber}</strong></div><button type="button" aria-label="Copy order number" onClick={copyOrderNumber}><LuCopy aria-hidden="true" /> Copy</button></div>
          <p className="receipt-copy-message" role="status">{copyMessage}</p>
          <div className="receipt-status" role="status"><LuClock aria-hidden="true" /><div><strong>{status[0]}</strong><p>{status[1]}</p></div></div>
          <h2>{count} {count === 1 ? 'item' : 'items'}</h2>
          <ul className="receipt-items">
            {items.map((item, index) => <li key={item._id || index}><div><strong>{item.quantity} &times; {item.name?.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()).replace(/\bBbq\b/g, 'BBQ')}</strong>{(item.modifiers || []).map((mod, i) => <small key={i}>{mod.modifierName}: {mod.selectedOption}</small>)}{(item.addons || []).map((addon, i) => <small key={i}>+ {addon.name}</small>)}</div>{item.itemTotal != null && <span>{currency(item.itemTotal)}</span>}</li>)}
          </ul>
          <dl className="receipt-details">
            {lastOrder.deliveryFee != null && <div><dt>Delivery fee</dt><dd>{currency(lastOrder.deliveryFee)}</dd></div>}
            <div className="receipt-total"><dt>Total</dt><dd>{lastOrder.totalAmount != null ? currency(lastOrder.totalAmount) : 'Unavailable'}</dd></div>
            <div><dt>Payment method</dt><dd>{paymentMethods[lastOrder.paymentMethod] || 'Not available'}</dd></div>
            <div><dt>Payment status</dt><dd>{paymentStatus}</dd></div>
            {lastOrder.customerAddress && <div className="receipt-address"><dt>Delivery address</dt><dd>{lastOrder.customerAddress}</dd></div>}
          </dl>
        </section>
        <div className="receipt-actions">{(lastOrder.trackingToken || isAuthenticated) && <button className="receipt-primary" onClick={() => navigate(lastOrder.trackingToken ? `/portal/track/${lastOrder.trackingToken}` : '/portal/orders')}>View order status</button>}<button className="receipt-secondary" onClick={() => navigate('/portal')}>Back to menu</button></div>
        {!isAuthenticated && <p className="receipt-guest-note">Create an account for saved addresses and future order history. <button onClick={() => navigate('/portal/login?mode=register')}>Create an account</button></p>}
      </main>
      <PortalFooter />
    </div>
  );
};

export default PortalConfirmation;
