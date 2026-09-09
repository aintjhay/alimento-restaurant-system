import { phPhoneInputProps, isValidPhPhone, PH_PHONE_MESSAGE } from '../../utils/phoneUtils';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_URL, ordersAPI } from '../../services/api';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import CartIcon from '../../components/icons/CartIcon';
import MapPinIcon from '../../components/icons/MapPinIcon';
import { LuMinus, LuArrowLeft, LuBanknote, LuQrCode, LuTrash2 } from 'react-icons/lu';
import './Portal.css';
import './PortalCheckout.css';

const CART_KEY = 'portalCart';

const PortalCheckout = () => {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuth();
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
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const paymentProof = '';
  const pageRef = useRef(null);
  useEffect(() => {
    const page = pageRef.current;
    const header = page?.querySelector('.portal-header');
    if (!header) return;
    const observer = new ResizeObserver(() => page.style.setProperty('--checkout-header-height', `${header.getBoundingClientRect().height}px`));
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editableCart, setEditableCart] = useState(cart);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useDifferentAddress, setUseDifferentAddress] = useState(false);

  // Load checkout type and user info on mount
  useEffect(() => {
    // If cart is empty, redirect to menu
    if (cart.length === 0) {
      navigate('/portal');
    }
    setEditableCart(cart);

    // If user is authenticated, use auth context data
    if (isAuthenticated && authUser) {
      setUser(authUser);
      setCustomerName(authUser.firstName && authUser.lastName 
        ? `${authUser.firstName} ${authUser.lastName}` 
        : authUser.name || '');
      setCustomerEmail(authUser.email || '');
      if (authUser.phone) setCustomerContact(authUser.phone);
      setCheckoutType('registered');
      
      // Load saved addresses from authenticated user
      if (authUser.addresses && authUser.addresses.length > 0) {
        setSavedAddresses(authUser.addresses);
        // Pre-select primary address if available
        const primaryAddress = authUser.addresses.find(addr => addr.isDefault) || authUser.addresses[0];
        if (primaryAddress) {
          setSelectedAddressId(primaryAddress._id);
          setCustomerAddress(`${primaryAddress.street}, ${primaryAddress.city} ${primaryAddress.postal}`);
          if (primaryAddress.phone) setCustomerContact(primaryAddress.phone);
        }
      }
    } else {
      setUser(null);
      setCheckoutType('guest');
    }
    // Restore only a draft explicitly saved before visiting login.
    try {
      const draft = JSON.parse(sessionStorage.getItem('portalCheckoutDraft') || 'null');
      if (draft) {
        if (draft.customerName) setCustomerName(draft.customerName);
        if (draft.customerContact) setCustomerContact(draft.customerContact);
        if (draft.customerEmail) setCustomerEmail(draft.customerEmail);
        setSpecialInstructions(draft.specialInstructions || '');
        setPaymentMethod(draft.paymentMethod === 'qrph' ? 'qrph' : 'cash');
        if (draft.customerAddress) {
          setCustomerAddress(draft.customerAddress);
          setSelectedAddressId(null);
          setUseDifferentAddress(true);
        }
      }
    } catch { sessionStorage.removeItem('portalCheckoutDraft'); }
  }, [cart, navigate, isAuthenticated, authUser]);

  const loginForCheckout = (mode = 'login') => {
    sessionStorage.setItem('portalCheckoutDraft', JSON.stringify({
      customerName, customerContact, customerAddress, customerEmail, specialInstructions, paymentMethod
    }));
    navigate(mode === 'register' ? '/portal/login?mode=register' : '/portal/login', { state: { returnTo: '/portal/checkout' } });
  };

  // Handle cart item quantity change
  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity <= 0) return;
    const updatedCart = [...editableCart];
    updatedCart[index] = { ...updatedCart[index], quantity: newQuantity };
    setEditableCart(updatedCart);
    localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
  };

  // Handle cart item deletion
  const handleDeleteItem = (index) => {
    const updatedCart = editableCart.filter((_, i) => i !== index);
    setEditableCart(updatedCart);
    localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
  };

  // Handle address selection
  const handleSelectAddress = (addressId) => {
    setSelectedAddressId(addressId);
    const selected = savedAddresses.find(addr => addr._id === addressId);
    if (selected) {
      setCustomerAddress(`${selected.street}, ${selected.city} ${selected.postal}`);
      if (selected.phone) setCustomerContact(selected.phone);
    }
  };

  const subtotal = useMemo(() => {
    return editableCart.reduce((sum, item) => sum + ((item.itemPrice ?? item.basePrice) * item.quantity), 0);
  }, [editableCart]);

  const deliveryFee = 50;
  const totalAmount = subtotal + deliveryFee;

  const currency = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
  const productName = (name) => name.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()).replace(/\bBbq\b/g, 'BBQ');

  const buildOrderItems = () => {
    return editableCart.map(item => ({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.basePrice,
      quantity: item.quantity,
      image: item.image || '',
      category: item.category || '',
      modifiers: item.modifiers || [],
      addons: item.addons || [],
      specialInstructions: item.specialInstructions || '',
      itemTotal: (item.itemPrice ?? item.basePrice) * item.quantity
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !editableCart.length) return;
    setErrorMessage('');

    if (!customerName || !customerContact || !customerAddress) {
      setErrorMessage('Please fill out all required fields.');
      return;
    }

    if (!isValidPhPhone(customerContact)) { setErrorMessage(PH_PHONE_MESSAGE); return; }
    setSubmitting(true);

    try {
      const orderPayload = {
        tableNumber: null,
        orderType: 'Delivery',
        deliveryType: checkoutType === 'guest' ? 'guest' : 'registered',
        customerName,
        customerContact,
        customerAddress,
        customerEmail: customerEmail || '',
        specialInstructions: specialInstructions.trim(),
        items: buildOrderItems(),
        subtotal,
        taxAmount: 0,
        discount: 0,
        deliveryFee,
        totalAmount,
        paymentMethod,
        paymentProof,
        paymentStatus: paymentMethod === 'cash' ? 'unpaid' : 'payment_pending_verification',
        status: 'pending'
      };

      if (isAuthenticated && checkoutType === 'registered' && user && (user._id || user.id)) {
        orderPayload.userId = user._id || user.id;
      }

      const result = await ordersAPI.create(orderPayload);
      if (!result.success) {
        throw new Error(result.message || 'Order failed');
      }

      localStorage.removeItem(CART_KEY);
      sessionStorage.removeItem('portalCheckoutDraft');
      localStorage.setItem('portalLastOrder', JSON.stringify(result.order || {}));
      if (paymentMethod === 'qrph') {
        const paymentResponse = await fetch(`${API_URL}/payments/qrph/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: result.order._id })
        });
        const paymentResult = await paymentResponse.json();
        if (!paymentResponse.ok) throw new Error(paymentResult.message || 'Unable to start QR Ph payment');
        window.location.assign(paymentResult.data.checkoutUrl);
        return;
      }
      navigate('/portal/confirmation');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (editableCart.length === 0) {
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
    <div className="portal-page checkout-page" ref={pageRef}>
      <PortalHeader onLogin={loginForCheckout} cartCount={editableCart.reduce((count, item) => count + item.quantity, 0)} />
      <main className="checkout-shell">
        <div className="checkout-heading">
          <button type="button" className="checkout-back" onClick={() => navigate('/portal')}><LuArrowLeft aria-hidden="true" /> Back to menu</button>
          <h1>Checkout</h1>
          <p>Review your details and order before placing it.</p>
        </div>
        {checkoutType === 'guest' && (
          <div className="checkout-guest-note">Checking out as a guest. <button type="button" onClick={loginForCheckout}>Log in to use saved details</button></div>
        )}
        <div className="checkout-layout">
          <form id="checkout-details" className="checkout-details" onSubmit={handleSubmit}>
            <fieldset disabled={submitting} className="checkout-panel">
              <legend>Contact details</legend>
              <div className="checkout-field-grid">
                <label htmlFor="checkout-name">Full name *<input id="checkout-name" autoComplete="name" value={customerName} onChange={event => setCustomerName(event.target.value)} required /></label>
                <label htmlFor="checkout-phone">Contact number *<input id="checkout-phone" {...phPhoneInputProps} value={customerContact} onChange={event => setCustomerContact(event.target.value)} required /></label>
                <label className="checkout-field-wide" htmlFor="checkout-email">Email <span>(optional)</span><input id="checkout-email" type="email" autoComplete="email" value={customerEmail} onChange={event => setCustomerEmail(event.target.value)} /></label>
              </div>
            </fieldset>
            <fieldset disabled={submitting} className="checkout-panel">
              <legend>Delivery address</legend>
              {savedAddresses.length > 0 && (
                <div className="checkout-saved-addresses">
                  <label htmlFor="checkout-saved">Saved address</label>
                  <select id="checkout-saved" value={useDifferentAddress ? '' : selectedAddressId || ''} onChange={event => {
                    if (!event.target.value) { setUseDifferentAddress(true); setCustomerAddress(''); return; }
                    handleSelectAddress(event.target.value); setUseDifferentAddress(false);
                  }}>
                    <option value="">Use a different address</option>
                    {savedAddresses.map(address => <option key={address._id} value={address._id}>{address.label}{address.isDefault ? ' (Default)' : ''} - {address.street}, {address.city}</option>)}
                  </select>
                </div>
              )}
              {selectedAddressId && !useDifferentAddress ? (
                <div className="checkout-address-preview"><MapPinIcon size={20} color="#2f6f6a" /><p>{customerAddress}</p></div>
              ) : (
                <label htmlFor="checkout-address">Complete address *<textarea id="checkout-address" rows={3} autoComplete="street-address" placeholder="House / unit number, street, barangay, city and postal code" value={customerAddress} onChange={event => setCustomerAddress(event.target.value)} required /></label>
              )}
              {checkoutType === 'registered' && <button className="checkout-text-button" type="button" onClick={() => navigate('/portal/profile')}>Manage saved addresses</button>}
              <label htmlFor="checkout-instructions" className="checkout-instructions">Delivery instructions <span>(optional)</span><textarea id="checkout-instructions" rows={2} placeholder="Landmark, gate number, or instructions for the rider" value={specialInstructions} onChange={event => setSpecialInstructions(event.target.value)} /></label>
            </fieldset>
            <fieldset disabled={submitting} className="checkout-panel">
              <legend>Payment method</legend>
              <div className="checkout-payment-options">
                <label className={`checkout-payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                  <LuBanknote aria-hidden="true" /><span><strong>Cash on delivery</strong><small>Pay when your order arrives.</small></span>
                </label>
                <label className={`checkout-payment-option ${paymentMethod === 'qrph' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" value="qrph" checked={paymentMethod === 'qrph'} onChange={() => setPaymentMethod('qrph')} />
                  <LuQrCode aria-hidden="true" /><span><strong>QR Ph</strong><small>Pay through your bank or wallet app via PayMongo.</small></span>
                </label>
              </div>
            </fieldset>
          </form>
          <aside className="checkout-order-panel" aria-label="Order summary">
            <h2><CartIcon size={22} color="#2f6f6a" /> Order summary</h2>
            <div className="checkout-order-items">
              {editableCart.map((item, index) => (
                <div className="checkout-order-item" key={`${item.id}-${index}`}>
                  <div className="checkout-item-heading"><strong>{productName(item.name)}</strong><span>{currency((item.itemPrice ?? item.basePrice) * item.quantity)}</span></div>
                  <p className="checkout-unit-price">{currency(item.itemPrice ?? item.basePrice)} each</p>
                  {(item.modifiers || []).map((modifier, i) => <p className="checkout-item-option" key={`modifier-${i}`}>{modifier.modifierName}: {modifier.selectedOption}</p>)}
                  {(item.addons || []).map((addon, i) => <p className="checkout-item-option" key={`addon-${i}`}>+ {addon.name}</p>)}
                  {item.specialInstructions && <p className="checkout-item-option">Note: {item.specialInstructions}</p>}
                  <div className="checkout-item-controls">
                    <div className="checkout-quantity" role="group" aria-label={`Quantity for ${item.name}`}>
                      <button type="button" disabled={submitting || item.quantity <= 1} aria-label={`Decrease ${item.name} quantity`} onClick={() => handleQuantityChange(index, item.quantity - 1)}><LuMinus aria-hidden="true" /></button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button type="button" disabled={submitting} aria-label={`Increase ${item.name} quantity`} onClick={() => handleQuantityChange(index, item.quantity + 1)}>+</button>
                    </div>
                    <button type="button" className="checkout-remove" disabled={submitting} onClick={() => handleDeleteItem(index)} aria-label={`Remove ${item.name}`}><LuTrash2 aria-hidden="true" /> Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <dl className="checkout-totals">
              <div><dt>Subtotal</dt><dd>{currency(subtotal)}</dd></div>
              <div><dt>Delivery fee</dt><dd>{currency(deliveryFee)}</dd></div>
              <div className="checkout-grand-total"><dt>Total</dt><dd aria-live="polite">{currency(totalAmount)}</dd></div>
            </dl>
            {errorMessage && <p role="alert" className="form-error">{errorMessage}</p>}
            <button className="checkout-place-order" type="submit" form="checkout-details" disabled={submitting}>{submitting ? 'Placing order...' : `Place order \u00b7 ${currency(totalAmount)}`}</button>
            <p className="checkout-payment-note">{paymentMethod === 'cash' ? 'Payment is collected on delivery.' : "Next, you will open PayMongo to complete payment."}</p>
          </aside>
        </div>
      </main>
      <PortalFooter />
    </div>
  );
};

export default PortalCheckout;
