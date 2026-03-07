import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI } from '../../services/api';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import CartIcon from '../../components/icons/CartIcon';
import PhoneIcon from '../../components/icons/PhoneIcon';
import MapPinIcon from '../../components/icons/MapPinIcon';
import EmailIcon from '../../components/icons/EmailIcon';
import ClockIcon from '../../components/icons/ClockIcon';
import UserIcon from '../../components/icons/UserIcon';
import SaveIcon from '../../components/icons/SaveIcon';
import XIcon from '../../components/icons/XIcon';
import './Portal.css';

const CART_KEY = 'portalCart';

const PortalCheckout = () => {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated, fetchCurrentUser } = useAuth();
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
  const [paymentProof, setPaymentProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editableCart, setEditableCart] = useState(cart);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [saveAddress, setSaveAddress] = useState(false);
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
        const primaryAddress = authUser.addresses.find(addr => addr.isDefault);
        if (primaryAddress) {
          setSelectedAddressId(primaryAddress._id);
          setCustomerAddress(`${primaryAddress.street}, ${primaryAddress.city} ${primaryAddress.postal}`);
          if (primaryAddress.phone) setCustomerContact(primaryAddress.phone);
        }
      }
    } else {
      // No authenticated user, check localStorage for guest checkout
      const portalUser = localStorage.getItem('portalUser');
      if (portalUser) {
        try {
          const userData = JSON.parse(portalUser);
          setUser(userData);
          setCustomerName(userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}` 
            : userData.name || '');
          setCustomerEmail(userData.email || '');
          setCheckoutType('registered');
          // Load addresses from localStorage
          if (userData.addresses) {
            setSavedAddresses(userData.addresses);
            const primaryAddress = userData.addresses.find(addr => addr.isDefault);
            if (primaryAddress) {
              setSelectedAddressId(primaryAddress._id);
              setCustomerAddress(`${primaryAddress.street}, ${primaryAddress.city} ${primaryAddress.postal}`);
              if (primaryAddress.phone) setCustomerContact(primaryAddress.phone);
            }
          }
        } catch (err) {
          console.error('Error loading user:', err);
          setCheckoutType('guest');
        }
      } else {
        // No user logged in, use stored checkout type or default to guest
        const storedType = localStorage.getItem('portalCheckoutType') || 'guest';
        setCheckoutType(storedType);
      }
    }
  }, [cart, navigate, isAuthenticated, authUser]);

  // Handle cart item quantity change
  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity <= 0) return;
    const updatedCart = [...editableCart];
    updatedCart[index].quantity = newQuantity;
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
    return editableCart.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
  }, [editableCart]);

  const taxAmount = subtotal * 0.12;
  const deliveryFee = 50;
  const totalAmount = subtotal + taxAmount + deliveryFee;

  // Calculate estimated delivery time (30-45 minutes)
  const getEstimatedDelivery = () => {
    const now = new Date();
    const estimatedTime = new Date(now.getTime() + 35 * 60000); // 35 minutes from now
    return estimatedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleProofUpload = (file) => {
    if (!file) {
      setPaymentProof('');
      setErrorMessage('');
      return;
    }

    // Check file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum limit of 10MB. Please upload a smaller image.`);
      setPaymentProof('');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, GIF, etc.)');
      setPaymentProof('');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = () => setPaymentProof(reader.result || '');
    reader.readAsDataURL(file);
  };

  const buildOrderItems = () => {
    return editableCart.map(item => ({
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
        specialInstructions: specialInstructions.trim(),
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

      // Add userId for registered customers
      console.log('\n=== CHECKOUT SUBMISSION DEBUG ===');
      console.log('checkoutType:', checkoutType);
      console.log('user object:', user);
      console.log('user._id:', user?._id);
      console.log('user.id:', user?.id);
      
      if (checkoutType === 'registered' && user && (user._id || user.id)) {
        orderPayload.userId = user._id || user.id;
        console.log('✅ REGISTERED CHECKOUT - userId being sent:', orderPayload.userId);
      } else {
        console.log('❌ GUEST CHECKOUT - No userId will be attached');
        console.log('   checkoutType matches registered?', checkoutType === 'registered');
        console.log('   user exists?', !!user);
        console.log('   user has _id or id?', !!(user?._id || user?.id));
      }

      console.log('Final Order Payload userId:', orderPayload.userId || 'UNDEFINED');
      console.log('================================\n');

      const result = await ordersAPI.create(orderPayload);
      if (!result.success) {
        throw new Error(result.message || 'Order failed');
      }

      // Save address if user is registered and checkbox is checked
      if (checkoutType === 'registered' && saveAddress && user) {
        try {
          const addressParts = customerAddress.split(',').map(part => part.trim());
          const newAddressData = {
            label: 'Recent Order',
            street: addressParts[0] || customerAddress,
            city: addressParts[1] || '',
            postal: addressParts[2] || '',
            phone: customerContact,
            isDefault: false
          };
          
          // Save address to user profile (requires backend endpoint)
          // This is optional - you can comment out if endpoint doesn't exist yet
          // await axios.post(`http://localhost:5000/api/users/${user.id}/addresses`, newAddressData);
        } catch (addrError) {
          console.warn('Could not save address:', addrError);
          // Don't fail the order if address save fails
        }
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
      
      {/* Checkout Type Header */}
      {checkoutType === 'guest' && (
        <div className="checkout-guest-banner">
          <span>👤 Checkout as Guest</span>
          <button
            type="button"
            onClick={() => navigate('/portal/login')}
            className="guest-login-btn"
          >
            Already have an account? Login
          </button>
        </div>
      )}
      
      <div className="portal-checkout">
        <div className="checkout-summary">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CartIcon size={24} color="#2f6f6a" />
            <h2 style={{ margin: 0 }}>Order summary</h2>
          </div>
          {editableCart.map((item, index) => (
            <div key={`${item.id}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
              <div style={{ flex: 1 }}>
                <strong>{item.name}</strong>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>₱{item.basePrice}/unit</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  type="button"
                  onClick={() => handleQuantityChange(index, item.quantity - 1)}
                  style={{ padding: '0.25rem 0.5rem', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                >
                  −
                </button>
                <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: '500' }}>{item.quantity}</span>
                <button 
                  type="button"
                  onClick={() => handleQuantityChange(index, item.quantity + 1)}
                  style={{ padding: '0.25rem 0.5rem', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                >
                  +
                </button>
                <span style={{ minWidth: '3.5rem', textAlign: 'right', fontWeight: '500' }}>₱{(item.basePrice * item.quantity).toFixed(0)}</span>
                <button 
                  type="button"
                  onClick={() => handleDeleteItem(index)}
                  style={{ padding: '0.25rem', background: '#ffebee', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Remove item"
                >
                  <XIcon size={16} color="#d32f2f" />
                </button>
              </div>
            </div>
          ))}
          <div className="summary-total">
            <div>
              <span>Subtotal</span>
              <span>₱{subtotal.toFixed(0)}</span>
            </div>
            <div>
              <span>Tax (12%)</span>
              <span>₱{taxAmount.toFixed(2)}</span>
            </div>
            <div>
              <span>Delivery fee</span>
              <span>₱{deliveryFee}</span>
            </div>
            <div className="summary-grand">
              <span>Total</span>
              <strong>₱{totalAmount.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPinIcon size={24} color="#2f6f6a" />
            Delivery details
          </h2>

          {checkoutType === 'registered' && savedAddresses.length > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <MapPinIcon size={20} color="#2f6f6a" />
                <label style={{ fontWeight: '600', color: '#333', fontSize: '0.95rem', margin: 0 }}>
                  Use saved address
                </label>
              </div>
              <select
                value={selectedAddressId || ''}
                onChange={(e) => {
                  handleSelectAddress(e.target.value);
                  setUseDifferentAddress(false); // Auto-hide manual fields
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Select from saved addresses --</option>
                {savedAddresses.map(addr => (
                  <option key={addr._id} value={addr._id}>
                    {addr.label}: {addr.street}, {addr.city} {addr.isDefault ? '(Primary)' : ''}
                  </option>
                ))}
              </select>
              
              {selectedAddressId && !useDifferentAddress && (
                <button
                  type="button"
                  onClick={() => setUseDifferentAddress(true)}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    color: '#2f6f6a',
                    border: '1px solid #2f6f6a',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    width: '100%'
                  }}
                >
                  Use a different address
                </button>
              )}
            </div>
          )}

          {!selectedAddressId || useDifferentAddress ? (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <UserIcon size={20} color="#2f6f6a" />
                  <label style={{ margin: 0, fontWeight: '500', color: '#333', fontSize: '0.95rem' }}>Full name</label>
                </div>
                <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <PhoneIcon size={20} color="#2f6f6a" />
                  <label style={{ margin: 0, fontWeight: '500', color: '#333', fontSize: '0.95rem' }}>Contact number</label>
                </div>
                <input value={customerContact} onChange={(event) => setCustomerContact(event.target.value)} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <MapPinIcon size={20} color="#2f6f6a" />
                  <label style={{ margin: 0, fontWeight: '500', color: '#333', fontSize: '0.95rem' }}>Delivery address</label>
                </div>
                <textarea value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box', minHeight: '100px' }} />
              </div>
            </>
          ) : (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0f9f7', borderRadius: '8px', border: '2px solid #2f6f6a' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Delivery Address</p>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: '#1f2937', lineHeight: '1.5' }}>
                  {customerAddress}
                </p>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Contact</p>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#1f2937' }}>{customerContact}</p>
              </div>
              {useDifferentAddress && (
                <button
                  type="button"
                  onClick={() => setUseDifferentAddress(false)}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 1rem',
                    background: '#2f6f6a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    width: '100%'
                  }}
                >
                  Use saved address
                </button>
              )}
            </div>
          )}

          {checkoutType === 'registered' && (!selectedAddressId || useDifferentAddress) && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="checkbox"
                id="saveAddress"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <SaveIcon size={20} color="#2f6f6a" />
              <label htmlFor="saveAddress" style={{ margin: 0, cursor: 'pointer', fontSize: '0.95rem', color: '#333', fontWeight: '500' }}>
                Save this address for future orders
              </label>
            </div>
          )}

          {checkoutType === 'registered' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <EmailIcon size={20} color="#2f6f6a" />
                <label style={{ margin: 0, fontWeight: '500', color: '#333', fontSize: '0.95rem' }}>Email</label>
              </div>
              <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ClockIcon size={20} color="#2f6f6a" />
              <label style={{ margin: 0, fontWeight: '500', color: '#333', fontSize: '0.95rem' }}>Special instructions <span style={{ color: '#999', fontWeight: '400' }}>(optional)</span></label>
            </div>
            <textarea
              value={specialInstructions}
              onChange={(event) => setSpecialInstructions(event.target.value)}
              placeholder="e.g. No onions, extra sauce, ring the doorbell..."
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.95rem' }}
            />
          </div>

          <div className="payment-section">
            <h3>Payment method</h3>
            
            <div className="payment-options">
              <button
                type="button"
                className={`payment-method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <div className="payment-btn-icon">💰</div>
                <div className="payment-btn-content">
                  <span className="payment-btn-title">Cash on Delivery</span>
                  <small>Pay when order arrives</small>
                </div>
              </button>

              <button
                type="button"
                className={`payment-method-btn ${paymentMethod === 'gcash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('gcash')}
              >
                <div className="payment-btn-icon">💳</div>
                <div className="payment-btn-content">
                  <span className="payment-btn-title">GCash Payment</span>
                  <small>Upload proof of payment</small>
                </div>
              </button>
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
