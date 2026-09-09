import { phPhoneInputProps, isValidPhPhone, PH_PHONE_MESSAGE } from '../../utils/phoneUtils';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalHeader from '../../components/portal/PortalHeader';
import AccountSidebar from '../../components/portal/AccountSidebar';
import PortalFooter from '../../components/portal/PortalFooter';
import EditProfileModal from '../../components/portal/EditProfileModal';
import PencilIcon from '../../components/icons/PencilIcon';
import MapPinIcon from '../../components/icons/MapPinIcon';
import UserIcon from '../../components/icons/UserIcon';
import HomeIcon from '../../components/icons/HomeIcon';
import { LuX, LuHouse, LuBriefcaseBusiness, LuMapPin } from 'react-icons/lu';
import TrashIcon from '../../components/icons/TrashIcon';
import './Portal.css';
import './PortalUserProfile.css';
import API_BASE_URL from '../../config/api';

const PortalUserProfile = () => {
  const navigate = useNavigate();
  const addressDialogRef = useRef(null);
  const { user: authUser, token, isAuthenticated, fetchCurrentUser } = useAuth();
  
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (!showAddAddress) return;
    const dialog = addressDialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [showAddAddress]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    street: '',
    city: '',
    postal: '',
    phone: '',
    isDefault: false
  });

  const API_BASE = `${API_BASE_URL}/api`;

  // Fetch user data on mount
  useEffect(() => {
    if (isAuthenticated && authUser && token) {
      // Set user data from auth context
      setUser(authUser);
      setFormData({
        firstName: authUser.firstName || '',
        lastName: authUser.lastName || '',
        phone: authUser.phone || '',
        email: authUser.email || ''
      });
      setAddresses(authUser.addresses || []);
      setLoading(false);
    } else if (!isAuthenticated) {
      setError('Please log in first');
      setLoading(false);
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/portal/login');
      }, 2000);
    }
  }, [isAuthenticated, authUser, token, navigate]);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!isValidPhPhone(formData.phone)) { setError(PH_PHONE_MESSAGE); return; }
    setIsLoadingSave(true);
    try {
      const response = await axios.put(`${API_BASE}/users/${authUser.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUser(response.data.user);
        setIsEditing(false);
        await fetchCurrentUser();
        showSuccess('Profile updated successfully!');
      }
    } catch (err) {
      setError('Error updating profile: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (savingAddress) return;
    if (!isValidPhPhone(newAddress.phone)) { setError(PH_PHONE_MESSAGE); return; }
    setSavingAddress(true);
    try {
      const response = await axios[editingAddressId ? 'put' : 'post'](`${API_BASE}/users/${authUser.id}/addresses${editingAddressId ? `/${editingAddressId}` : ''}`, newAddress, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAddresses(response.data.addresses);
        setNewAddress({
          label: 'Home',
          street: '',
          city: '',
          postal: '',
          phone: '',
          isDefault: false
        });
        setShowAddAddress(false);
        // Refresh auth context so checkout gets updated addresses
        await fetchCurrentUser();
        showSuccess(editingAddressId ? 'Address updated successfully!' : 'Address added successfully!');
        setEditingAddressId(null);
      }
    } catch (err) {
      setError('Error saving address: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 4000);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    setConfirmDeleteId(null);
    try {
      const response = await axios.delete(`${API_BASE}/users/${authUser.id}/addresses/${addressId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAddresses(response.data.addresses);
        // Refresh auth context so checkout gets updated addresses
        await fetchCurrentUser();
        showSuccess('Address removed.');
      }
    } catch (err) {
      setError('Error deleting address: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 4000);
    }
  };

  const openAddressForm = (address) => {
    setEditingAddressId(address?._id || null);
    setNewAddress({ label: address?.label || 'Home', street: address?.street || '', city: address?.city || '', postal: address?.postal || '', phone: address?.phone || '', isDefault: address?.isDefault || false });
    setShowAddAddress(true);
  };

  if (loading) {
    return (
      <div className="portal-container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="portal-container" style={{ padding: '40px 20px', color: 'red' }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="portal-page profile-page">
      <PortalHeader />
      
      <main className="portal-main">
        <div className="portal-container profile-container" style={{ animation: 'fadeIn 0.5s ease-in' }}>
          <div className="account-page-heading"><p>YOUR ACCOUNT</p><h1>My profile</h1><span>Manage your details and the places we deliver to.</span></div>
          <div className="account-layout">
          <AccountSidebar user={user} active="profile" />
          <div className="account-content">
          {successMessage && (
            <div style={{ background: '#d1fae5', color: '#065f46', padding: '0.75rem 1.25rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '500', fontSize: '0.95rem' }}>
              ✓ {successMessage}
            </div>
          )}
          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1.25rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '500', fontSize: '0.95rem' }}>
              {error}
            </div>
          )}

          <div className="profile-cards">
          {/* Personal information Section */}
          <div className="profile-section profile-section-personal">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon"><UserIcon size={22} color="#2f6f6a" /></span>
                <div><h2>Personal information</h2><p className="account-section-description">Your contact details for orders and deliveries.</p></div>
              </div>
              {!isEditing && (
                <button 
                  className="btn-edit-profile"
                  onClick={() => setIsEditing(true)}
                >
                  <PencilIcon size={15} color="currentColor" /> Edit details
                </button>
              )}
            </div>

            <div className="profile-info">
              <div className="info-row">
                <span className="label">Name</span>
                <span className="value">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="info-row">
                <span className="label">Email</span>
                <span className="value">{user?.email}</span>
              </div>
              <div className="info-row">
                <span className="label">Phone</span>
                <span className="value">
                  {user?.phone
                    ? user.phone
                    : (
                      <>
                        <span style={{ color: '#9ca3af' }}>Not provided</span>
                        <button
                          onClick={() => setIsEditing(true)}
                          style={{ marginLeft: '0.6rem', background: 'none', border: 'none', color: '#2f6f6a', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: '2px' }}
                        >
                          Add phone number
                        </button>
                      </>
                    )
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Modal */}
          <EditProfileModal 
            isOpen={isEditing}
            formData={formData}
            onFormChange={handleFormChange}
            onSubmit={handleProfileUpdate}
            onCancel={() => setIsEditing(false)}
            isLoading={isLoadingSave}
          />

          {/* Delivery Addresses Section */}
          <div className="profile-section profile-section-addresses">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon"><MapPinIcon size={22} color="#2f6f6a" /></span>
                <div><h2>Delivery addresses <span className="account-address-count">{addresses.length}</span></h2><p className="account-section-description">Keep your favorite delivery locations in one place.</p></div>
              </div>
              {!showAddAddress && addresses.length > 0 && (
                <button 
                  className="btn-add-address"
                  onClick={() => openAddressForm()}
                >
                  + Add address
                </button>
              )}
            </div>

            {showAddAddress && (
              <dialog ref={addressDialogRef} className="profile-address-dialog" aria-labelledby="address-dialog-title" onCancel={(event) => { event.preventDefault(); if (!savingAddress) setShowAddAddress(false); }}>
                <div className="profile-dialog-header">
                  <div className="address-dialog-intro"><span className="address-dialog-icon"><LuMapPin aria-hidden="true" /></span><div><h2 id="address-dialog-title">{editingAddressId ? 'Edit address' : 'Add delivery address'}</h2><p>A saved address makes your next checkout easier.</p></div></div>
                  <button type="button" aria-label="Close address form" disabled={savingAddress} onClick={() => setShowAddAddress(false)}><LuX aria-hidden="true" /></button>
                </div>
                {error && <p role="alert" className="error-message">{error}</p>}
              <form onSubmit={handleAddAddress} className="address-form add-address-form">
                <fieldset className="address-label-options" disabled={savingAddress}>
                  <legend>Save address as</legend>
                  <div>{[['Home', LuHouse], ['Work', LuBriefcaseBusiness], ['Other', LuMapPin]].map(([label, Icon]) => (
                    <label key={label} className={newAddress.label === label ? 'is-selected' : ''}>
                      <input type="radio" name="address-label" value={label} checked={newAddress.label === label} onChange={() => setNewAddress({ ...newAddress, label })} />
                      <Icon aria-hidden="true" /><span>{label}</span>
                    </label>
                  ))}</div>
                </fieldset>
                <p className="address-required-note">Fields marked * are required.</p>
                <div className="form-group">
                  <label htmlFor="address-street">House / unit, street & barangay *</label>
                  <input
                    type="text"
                    id="address-street"
                      value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    placeholder="e.g. Unit 2, 15 Mabini St., Brgy. San Jose"
                    autoComplete="street-address"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="address-city">City *</label>
                    <input
                      type="text"
                      id="address-city"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="e.g. Manila"
                      autoComplete="address-level2"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address-postal">Postal code *</label>
                    <input
                      type="text"
                      id="address-postal"
                      value={newAddress.postal}
                      onChange={(e) => setNewAddress({ ...newAddress, postal: e.target.value })}
                      placeholder="e.g. 1000"
                      autoComplete="postal-code"
                      required
                    />
                  </div>
                </div>

                <div className="form-group address-contact-field">
                  <label htmlFor="address-phone">Contact number *</label>
                  <input {...phPhoneInputProps} id="address-phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} aria-describedby="address-phone-help" />
                  <small id="address-phone-help">Use an 11-digit mobile number so we can contact you about delivery.</small>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newAddress.isDefault}
                      onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                    />
                    <span>Use as my default address<small>Automatically selected at checkout.</small></span>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={savingAddress}>
                    {savingAddress ? 'Saving...' : 'Save address'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={savingAddress}
                    onClick={() => setShowAddAddress(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
              </dialog>
            )}

            <div className="addresses-list">
              {addresses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><HomeIcon size={28} color="#2f6f6a" /></div>
                  <p className="empty-title">No saved addresses yet</p>
                  <p className="empty-text">Save an address for faster checkout.</p>
                  <button className="btn-add-address" onClick={() => openAddressForm()}>+ Add address</button>
                </div>
              ) : (
                addresses.map((address) => (
                  <div 
                    key={address._id} 
                    className={`address-card ${address.isDefault ? 'is-default' : ''}`}
                  >
                    <div className="address-body">
                      <div className="address-header">
                        <h3>{address.label}</h3>
                        {address.isDefault && <span className="badge-default">Default address</span>}
                      </div>
                      <div className="address-content">
                        <p>{address.street}</p>
                        <p>{address.city}, {address.postal}</p>
                        {address.phone && <p>{address.phone}</p>}
                      </div>
                    </div>
                    <div className="profile-address-actions">
                    <button type="button" onClick={() => openAddressForm(address)} className="profile-address-edit"><PencilIcon size={16} color="currentColor" /> Edit</button>
                    <button
                      className="btn-delete-address"
                      onClick={() => setConfirmDeleteId(address._id)}
                      title="Delete address"
                    >
                      <TrashIcon size={16} color="currentColor" /> Remove
                    </button>
                    </div>
                    {confirmDeleteId === address._id && (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e', fontWeight: '500' }}>Remove this address?</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleDeleteAddress(address._id)}
                            style={{ padding: '0.35rem 0.9rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                          >
                            Yes, remove
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            style={{ padding: '0.35rem 0.9rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
          </div>
          </div>
        </div>
      </main>

      <PortalFooter />
    </div>
  );
};

export default PortalUserProfile;
