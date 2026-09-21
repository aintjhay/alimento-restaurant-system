import { finishCheckout } from '../../services/checkoutKey';
import { phPhoneInputProps, isValidPhPhone, PH_PHONE_MESSAGE } from '../../utils/phoneUtils';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_URL, ordersAPI } from '../../services/api';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import CartIcon from '../../components/icons/CartIcon';
import MapPinIcon from '../../components/icons/MapPinIcon';
import { LuMinus, LuArrowLeft, LuQrCode, LuTrash2, LuUpload, LuDownload, LuCheck, LuInfo } from 'react-icons/lu';
import './Portal.css';
import './PortalCheckout.css';

import { getStore, quoteOrder, readImage } from '../../services/storeService';
import StoreHoursStatus from '../../components/portal/StoreHoursStatus';

const CART_KEY = 'portalCart';

const PortalCheckout = () => {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated, token, fetchCurrentUser } = useAuth();
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
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [paymentProof, setPaymentProof] = useState('');
  const [checkoutStep, setCheckoutStep] = useState('details');
  const stepHeadingRef = useRef(null);
  useEffect(() => { stepHeadingRef.current?.focus(); }, [checkoutStep]);
  const [showPaymentQr, setShowPaymentQr] = useState(false);
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
  const [saveDefaultAddress, setSaveDefaultAddress] = useState(false);
  const [addressCity, setAddressCity] = useState('');

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
          setCustomerAddress(`${primaryAddress.street}, ${primaryAddress.city} ${primaryAddress.postal || ''}`.trim());
          if (primaryAddress.phone) setCustomerContact(primaryAddress.phone);
        }
      }
    } else {
      setUser(null);
      setCheckoutType('guest');
      setSavedAddresses([]);
      setSelectedAddressId(null);
      setSaveDefaultAddress(false);
    }
    // Restore only a draft explicitly saved before visiting login.
    try {
      const draft = JSON.parse(sessionStorage.getItem('portalCheckoutDraft') || 'null');
      if (draft) {
        if (draft.customerName) setCustomerName(draft.customerName);
        if (draft.customerContact) setCustomerContact(draft.customerContact);
        if (draft.customerEmail) setCustomerEmail(draft.customerEmail);
        setSpecialInstructions(draft.specialInstructions || '');
        setPaymentMethod('gcash');
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
      setCustomerAddress(`${selected.street}, ${selected.city} ${selected.postal || ''}`.trim());
      if (selected.phone) setCustomerContact(selected.phone);
    }
  };

  const subtotal = useMemo(() => {
    return editableCart.reduce((sum, item) => sum + ((item.itemPrice ?? item.basePrice) * item.quantity), 0);
  }, [editableCart]);

  const [store, setStore] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteBusy, setQuoteBusy] = useState(true);
  useEffect(() => {
    const refresh = () => getStore().then(setStore).catch(e => setErrorMessage(e.message));
    refresh(); const timer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  useEffect(() => {
    let active = true;
    setQuoteBusy(true); setQuote(null);
    quoteOrder(editableCart).then(q => { if (active) setQuote(q); }).catch(e => { if (active) setErrorMessage(e.message); }).finally(() => { if (active) setQuoteBusy(false); });
    return () => { active = false; };
  }, [editableCart, store?.updatedAt]);
  const deliveryFee = quote?.deliveryFee ?? 50;
  const totalAmount = quote?.totalAmount ?? subtotal + deliveryFee;

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

    if (!store?.isOpen || !store?.gcashQr || !quote || quoteBusy) { setErrorMessage('Ordering is unavailable. Please refresh and check store hours.'); return; }
    if (!isValidPhPhone(customerContact)) { setErrorMessage(PH_PHONE_MESSAGE); return; }
    if (checkoutStep === 'details') {
      if (!event.currentTarget.reportValidity()) return;
      setCheckoutStep('payment');
      return;
    }
    if (!paymentProof) { setErrorMessage('Upload your payment receipt before placing your order.'); return; }
    setSubmitting(true);

    try {
      let deliveryAddress = customerAddress;
      if (isAuthenticated && checkoutType === 'registered' && saveDefaultAddress) {
        const existing = !useDifferentAddress && savedAddresses.find(address => address._id === selectedAddressId);
        if (!existing && (!addressCity.trim() || !customerAddress.trim())) {
          throw new Error('Please enter your address and city to save a default address.');
        }
        const response = await fetch(`${API_URL}/users/${user._id || user.id}/addresses${existing ? `/${existing._id}` : ''}`, {
          method: existing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ...(existing || { label: 'Home', street: customerAddress.trim(), city: addressCity.trim() }),
            phone: customerContact, isDefault: true
          })
        });
        const saved = await response.json();
        if (!response.ok || !saved.success) throw new Error(saved.message || 'Unable to save your default address. Please try again.');
        setSavedAddresses(saved.addresses);
        const defaultAddress = saved.addresses.find(address => address.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
          setUseDifferentAddress(false);
          deliveryAddress = `${defaultAddress.street}, ${defaultAddress.city} ${defaultAddress.postal || ''}`.trim();
          setCustomerAddress(deliveryAddress);
        }
        setSaveDefaultAddress(false);
        // Refresh account details without resetting the in-progress checkout form.
        localStorage.setItem('portalUser', JSON.stringify({ ...authUser, addresses: saved.addresses }));
      }
      const orderPayload = {
        tableNumber: null,
        orderType: 'Delivery',
        deliveryType: checkoutType === 'guest' ? 'guest' : 'registered',
        customerName,
        customerContact,
        customerAddress: deliveryAddress,
        customerEmail: customerEmail || '',
        specialInstructions: specialInstructions.trim(),
        items: buildOrderItems(),
        subtotal,
        taxAmount: 0,
        discount: quote.discount,
        deliveryFee,
        totalAmount,
        paymentMethod,
        paymentProof,
        paymentStatus: 'payment_pending_verification',
        status: 'pending'
      };

      if (isAuthenticated && checkoutType === 'registered' && user && (user._id || user.id)) {
        orderPayload.userId = user._id || user.id;
      }

      const result = await ordersAPI.create(orderPayload);
      if (result.success) finishCheckout('portal');
      if (!result.success) {
        throw new Error(result.message || 'Order failed');
      }

      localStorage.removeItem(CART_KEY);
      sessionStorage.removeItem('portalCheckoutDraft');
      localStorage.setItem('portalLastOrder', JSON.stringify(result.order || {}));
      if (isAuthenticated) await fetchCurrentUser();
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
          <h1 ref={stepHeadingRef} tabIndex={-1}>{checkoutStep === 'details' ? 'Checkout' : 'Payment'}</h1>
          <p>{checkoutStep === 'details' ? 'Step 1 of 2: Review your delivery details and order.' : 'Step 2 of 2: Pay with GCash and upload your receipt.'}</p>
          {checkoutStep === 'payment' && <button type="button" className="checkout-back" disabled={submitting} onClick={() => { setCheckoutStep('details'); setErrorMessage(''); }}><LuArrowLeft aria-hidden="true" /> Back to details</button>}
        </div>
        {checkoutType === 'guest' && checkoutStep === 'details' && (
          <div className="checkout-guest-note">Checking out as a guest. <button type="button" onClick={loginForCheckout}>Log in to use saved details</button></div>
        )}
        <div className="checkout-layout">
          <form id="checkout-details" className="checkout-details" onSubmit={handleSubmit}>
            <fieldset hidden={checkoutStep !== 'details'} disabled={submitting || checkoutStep !== 'details'} className="checkout-panel">
              <legend>Contact details</legend>
              <div className="checkout-field-grid">
                <label htmlFor="checkout-name">Full name *<input id="checkout-name" autoComplete="name" value={customerName} onChange={event => setCustomerName(event.target.value)} required /></label>
                <label htmlFor="checkout-phone">Contact number *<input id="checkout-phone" {...phPhoneInputProps} value={customerContact} onChange={event => setCustomerContact(event.target.value)} required /></label>
                <label className="checkout-field-wide" htmlFor="checkout-email">Email <span>(optional)</span><input id="checkout-email" type="email" autoComplete="email" value={customerEmail} onChange={event => setCustomerEmail(event.target.value)} /></label>
              </div>
            </fieldset>
            <fieldset hidden={checkoutStep !== 'details'} disabled={submitting || checkoutStep !== 'details'} className="checkout-panel">
              <legend>Delivery address</legend>
              {savedAddresses.length > 0 && (
                <div className="checkout-saved-addresses">
                  <label htmlFor="checkout-saved">Saved address</label>
                  <select id="checkout-saved" value={useDifferentAddress ? '' : selectedAddressId || ''} onChange={event => {
                    setSaveDefaultAddress(false);
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
                <label htmlFor="checkout-address">Complete address *<textarea id="checkout-address" rows={3} autoComplete="street-address" placeholder="House / unit number, street, barangay and city" value={customerAddress} onChange={event => setCustomerAddress(event.target.value)} required /></label>
              )}
              {checkoutType === 'registered' && <>
                <div className={`checkout-save-address${saveDefaultAddress ? ' is-selected' : ''}`}>
                <label className="checkout-default-address">
                  <input type="checkbox" checked={saveDefaultAddress} aria-describedby={saveDefaultAddress ? 'checkout-save-note' : undefined} onChange={event => setSaveDefaultAddress(event.target.checked)} />
                  <span>Use this as default address</span>
                </label>
                {saveDefaultAddress && <div className="checkout-save-address-details">
                <p id="checkout-save-note" className="checkout-save-note">Saved to your account when you place your order and selected automatically next time.</p>
                {saveDefaultAddress && (!selectedAddressId || useDifferentAddress) && (
                  <div className="checkout-save-address-city">
                    <label htmlFor="checkout-city">City *<input id="checkout-city" autoComplete="address-level2" placeholder="Enter your city" value={addressCity} onChange={event => setAddressCity(event.target.value)} required /></label>
                  </div>
                )}
                </div>}
                </div>
                <button className="checkout-text-button" type="button" onClick={() => navigate('/portal/profile')}>Manage saved addresses</button>
              </>}
              <label htmlFor="checkout-instructions" className="checkout-instructions">Delivery instructions <span>(optional)</span><textarea id="checkout-instructions" rows={2} placeholder="Landmark, gate number, or instructions for the rider" value={specialInstructions} onChange={event => setSpecialInstructions(event.target.value)} /></label>
            </fieldset>
            <fieldset hidden={checkoutStep !== 'payment'} disabled={submitting || checkoutStep !== 'payment'} className="checkout-panel">
              <legend>Complete your payment</legend>
              <div className="checkout-gcash-heading"><span className="checkout-payment-number">1</span><div><strong>Pay with GCash</strong><p>Scan the QR code or download it to pay on your phone.</p></div><span className="checkout-gcash-badge">GCash</span></div>
              {!store?.isOpen && <StoreHoursStatus store={store} />}
              {store?.gcashQr && store.isOpen && quote && !quoteBusy ? <>
                <div className="checkout-gcash-card">
                  <div className="checkout-gcash-total"><span>Total amount to pay</span><strong>{currency(totalAmount)}</strong><small>Includes delivery fee</small></div>
                  <div className="checkout-qr-actions">
                    <button type="button" className="checkout-qr-toggle" aria-expanded={showPaymentQr} aria-controls="checkout-payment-qr" onClick={() => setShowPaymentQr(shown => !shown)}><LuQrCode aria-hidden="true" />{showPaymentQr ? 'Hide QR code' : 'Show QR code'}</button>
                    <a href={store.gcashQr} download={`alimento-gcash-qr.${store.gcashQr.startsWith('data:image/jpeg') ? 'jpg' : store.gcashQr.startsWith('data:image/webp') ? 'webp' : 'png'}`}><LuDownload aria-hidden="true" />Download QR</a>
                  </div>
                  <div id="checkout-payment-qr" hidden={!showPaymentQr} className="checkout-qr-preview">
                    {showPaymentQr && <img src={store.gcashQr} alt="Store GCash payment QR" />}
                  </div>
                  <p className="checkout-gcash-help">On your phone? Download the QR, then open GCash and select it from your gallery to pay.</p>
                </div>
              </> : <p role="status">GCash payment is available once the store is open, its QR is configured, and your total has loaded.</p>}
              <div className="checkout-receipt-section">
              <div className="checkout-gcash-heading"><span className="checkout-payment-number">2</span><div><strong>Upload your receipt</strong><p>Add a screenshot of your successful GCash payment.</p></div></div>
              <label className={`checkout-receipt-picker${paymentProof ? ' has-receipt' : ''}`}>
                <input aria-label="Payment receipt *" type="file" accept="image/png,image/jpeg,image/webp" required onChange={async e => {
                if (!e.target.files[0]) return;
                setPaymentProof('');
                try { setPaymentProof(await readImage(e.target.files[0])); setErrorMessage(''); } catch (error) { setErrorMessage(error.message); }
              }} />
                <span className="checkout-upload-icon">{paymentProof ? <LuCheck aria-hidden="true" /> : <LuUpload aria-hidden="true" />}</span>
                <strong>{paymentProof ? 'Receipt attached' : 'Choose payment receipt'}</strong>
                <span>{paymentProof ? 'Click to replace your receipt' : 'PNG, JPG or WebP image'}</span>
                <span className="checkout-upload-action">{paymentProof ? 'Replace image' : 'Browse files'}</span>
              </label>
              {paymentProof && <div className="checkout-receipt-preview"><img src={paymentProof} alt="Your payment receipt" /></div>}
              <p className="checkout-verification-note"><LuInfo aria-hidden="true" /><span>Your payment will be reviewed by our team after you place your order.</span></p>
              </div>
            </fieldset>
          </form>
          <aside className="checkout-order-panel" aria-label="Order summary">
            <h2><CartIcon size={22} color="#2f6f6a" /> Order summary</h2>
            <div className="checkout-order-items">
              {editableCart.map((item, index) => (
                <div className="checkout-order-item" key={`${item.id}-${index}`}>
                  <div className="checkout-item-overview">
                    {item.image && <img className="checkout-item-thumbnail" src={item.image} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />}
                    <div className="checkout-item-details">
                  <div className="checkout-item-heading"><strong>{productName(item.name)}</strong><span>{currency((item.itemPrice ?? item.basePrice) * item.quantity)}</span></div>
                  <p className="checkout-unit-price">{currency(item.itemPrice ?? item.basePrice)} each</p>
                  {(item.modifiers || []).map((modifier, i) => <p className="checkout-item-option" key={`modifier-${i}`}>{modifier.modifierName}: {modifier.selectedOption}</p>)}
                  {(item.addons || []).map((addon, i) => <p className="checkout-item-option" key={`addon-${i}`}>+ {addon.name}</p>)}
                  {item.specialInstructions && <p className="checkout-item-option">Note: {item.specialInstructions}</p>}
                    </div>
                  </div>
                  <div className="checkout-item-controls">
                    <div className="checkout-quantity" role="group" aria-label={`Quantity for ${item.name}`}>
                      <button type="button" disabled={submitting || checkoutStep === 'payment' || item.quantity <= 1} aria-label={`Decrease ${item.name} quantity`} onClick={() => handleQuantityChange(index, item.quantity - 1)}><LuMinus aria-hidden="true" /></button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button type="button" disabled={submitting || checkoutStep === 'payment'} aria-label={`Increase ${item.name} quantity`} onClick={() => handleQuantityChange(index, item.quantity + 1)}>+</button>
                    </div>
                    <button type="button" className="checkout-remove" disabled={submitting || checkoutStep === 'payment'} onClick={() => handleDeleteItem(index)} aria-label={`Remove ${item.name}`}><LuTrash2 aria-hidden="true" /> Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <dl className="checkout-totals">
              <div><dt>Subtotal</dt><dd>{currency(quote?.subtotal ?? subtotal)}</dd></div>
              {quote?.discount > 0 && <div className="checkout-promotion-savings"><dt>Discount</dt><dd>-{currency(quote.discount)}</dd></div>}
              <div><dt>Delivery fee</dt><dd>{currency(deliveryFee)}</dd></div>
              <div className="checkout-grand-total"><dt>Total</dt><dd aria-live="polite">{currency(totalAmount)}</dd></div>
            </dl>
            {errorMessage && <p role="alert" className="form-error">{errorMessage}</p>}
            <button className="checkout-place-order" type="submit" form="checkout-details" disabled={submitting || quoteBusy || !quote || !store?.isOpen || !store?.gcashQr}>{submitting ? 'Placing order...' : checkoutStep === 'details' ? 'Continue to payment' : `Place order \u00b7 ${currency(totalAmount)}`}</button>
            <p className="checkout-payment-note">{checkoutStep === 'details' ? 'Next: pay with GCash and upload your receipt.' : 'Payment is subject to staff verification.'}</p>
          </aside>
        </div>
      </main>
      <PortalFooter />
    </div>
  );
};

export default PortalCheckout;
