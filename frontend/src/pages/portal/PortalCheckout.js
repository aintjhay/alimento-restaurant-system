import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import './Portal.css';

const CART_KEY = 'portalCart';

const PortalCheckout = () => {
  const navigate = useNavigate();
  const [cart] = useState(() => {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [checkoutType, setCheckoutType] = useState('guest');
  const [user, setUser] = useState(null);

  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentProof, setPaymentProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load checkout type and user info on mount
  useEffect(() => {
    const type = localStorage.getItem('portalCheckoutType') || 'guest';
    setCheckoutType(type);

    const portalUser = localStorage.getItem('portalUser');
    if (portalUser) {
      try {
        const userData = JSON.parse(portalUser);
        setUser(userData);
        setCustomerName(userData.name || '');
        setCustomerEmail(userData.email || '');
      } catch (err) {
        console.error('Error loading user:', err);
      }
    }

    // If cart is empty, redirect to menu
    if (cart.length === 0) {
      navigate('/portal');
    }
  }, [cart, navigate]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
  }, [cart]);

  const taxAmount = subtotal * 0.12;
  const deliveryFee = 50;
  const totalAmount = subtotal + taxAmount + deliveryFee;

  const handleProofUpload = (file) => {
    if (!file) {
      setPaymentProof('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPaymentProof(reader.result || '');
    reader.readAsDataURL(file);
  };

  const buildOrderItems = () => {
    return cart.map(item => ({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.basePrice,
      quantity: item.quantity,
      image: item.image || '',
      modifiers: item.modifiers || [],
      addons: item.addons || [],
      specialInstructions: item.specialInstructions || '',
      itemTotal: item.itemPrice * item.quantity
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!customerName || !customerContact || !customerAddress) {
      setErrorMessage('Please fill out all required fields.');
      return;
    }

    if (paymentMethod === 'gcash' && !paymentProof) {
      setErrorMessage('Please upload your GCash payment proof.');
      return;
    }

    setSubmitting(true);

    try {
      const orderPayload = {
        tableNumber: 'Delivery',
        orderType: 'Delivery',
        deliveryType: checkoutType === 'guest' ? 'guest' : 'registered',
        customerName,
        customerContact,
        customerAddress,
        customerEmail: customerEmail || '',
        items: buildOrderItems(),
        subtotal,
        taxAmount,
        discount: 0,
        deliveryFee,
        totalAmount,
        paymentMethod,
        paymentProof,
        paymentStatus: paymentMethod === 'cash' ? 'unpaid' : 'pending_verification',
        status: 'pending'
      };

      const result = await ordersAPI.create(orderPayload);
      if (!result.success) {
        throw new Error(result.message || 'Order failed');
      }

      localStorage.removeItem(CART_KEY);
      localStorage.setItem('portalLastOrder', JSON.stringify(result.order || {}));
      navigate('/portal/confirmation');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="portal-page">
        <PortalHeader />
        <div className="portal-empty">
          <h2>Your cart is empty</h2>
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
      
      <div className="portal-checkout">
        <div className="checkout-summary">
          <h2>Order summary</h2>
          {cart.map((item, index) => (
            <div key={`${item.id}-${index}`} className="summary-row">
              <div>
                <strong>{item.name}</strong>
                <p>{item.quantity} x ₱{item.itemPrice}</p>
              </div>
              <span>₱{(item.itemPrice * item.quantity).toFixed(0)}</span>
            </div>
          ))}
          <div className="summary-total">
            <div>
              <span>Subtotal</span>
              <span>₱{subtotal.toFixed(0)}</span>
            </div>
            <div>
              <span>Tax (12%)</span>
              <span>₱{taxAmount.toFixed(0)}</span>
            </div>
            <div>
              <span>Delivery fee</span>
              <span>₱{deliveryFee}</span>
            </div>
            <div className="summary-grand">
              <span>Total</span>
              <strong>₱{totalAmount.toFixed(0)}</strong>
            </div>
          </div>
        </div>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Delivery details</h2>

          <label>
            Full name
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
          </label>

          <label>
            Contact number
            <input value={customerContact} onChange={(event) => setCustomerContact(event.target.value)} required />
          </label>

          <label>
            Delivery address
            <textarea value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} required />
          </label>

          {checkoutType === 'registered' && (
            <label>
              Email
              <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} disabled />
            </label>
          )}

          <div className="payment-section">
            <h3>Payment method</h3>
            
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Cash on Delivery</span>
                <small>Pay when order arrives</small>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="gcash"
                  checked={paymentMethod === 'gcash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>GCash Payment</span>
                <small>Upload proof of payment</small>
              </label>
            </div>

            {paymentMethod === 'gcash' && (
              <div className="upload-proof">
                <label className="upload-label">
                  Upload GCash receipt (required)
                  <input type="file" accept="image/*" onChange={(event) => handleProofUpload(event.target.files[0])} required />
                </label>
                {paymentProof && <p className="upload-note">✓ Proof uploaded.</p>}
              </div>
            )}
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <button className="primary-btn" type="submit" disabled={submitting}>
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
        </form>
      </div>
      
      <PortalFooter />
    </div>
  );
};

export default PortalCheckout;
