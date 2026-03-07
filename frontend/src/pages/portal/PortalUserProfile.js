import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import EditProfileModal from '../../components/portal/EditProfileModal';
import PencilIcon from '../../components/icons/PencilIcon';
import MapPinIcon from '../../components/icons/MapPinIcon';
import UserIcon from '../../components/icons/UserIcon';
import HomeIcon from '../../components/icons/HomeIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import './Portal.css';

const PortalUserProfile = () => {
  const navigate = useNavigate();
  const { user: authUser, token, isAuthenticated, logout, fetchCurrentUser } = useAuth();
  
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
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

  const API_BASE = 'http://localhost:5000/api';

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
    try {
      const response = await axios.post(`${API_BASE}/users/${authUser.id}/addresses`, newAddress, {
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
        showSuccess('Address added successfully!');
      }
    } catch (err) {
      setError('Error adding address: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 4000);
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

  if (loading) {
    return (
      <div className="portal-container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portal-container" style={{ padding: '40px 20px', color: 'red' }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <PortalHeader />
      
      <main className="portal-main">
        <div className="portal-container profile-container" style={{ animation: 'fadeIn 0.5s ease-in' }}>
          <div className="profile-header">
            <h1>My Profile</h1>
            <p className="profile-email">{user?.email}</p>
          </div>

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

          {/* Personal Information Section */}
          <div className="profile-section profile-section-personal">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon"><UserIcon size={22} color="#2f6f6a" /></span>
                <h2>Personal Information</h2>
              </div>
              {!isEditing && (
                <button 
                  className="btn-edit-profile"
                  onClick={() => setIsEditing(true)}
                >
                  <PencilIcon size={15} color="white" /> Edit
                </button>
              )}
            </div>

            <div className="profile-info">
              <div className="info-row">
                <span className="label">Name:</span>
                <span className="value">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{user?.email}</span>
              </div>
              <div className="info-row">
                <span className="label">Phone:</span>
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
                          + Add
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
                <h2>Saved Delivery Addresses</h2>
              </div>
              {!showAddAddress && (
                <button 
                  className="btn-add-address"
                  onClick={() => setShowAddAddress(true)}
                >
                  + Add Address
                </button>
              )}
            </div>

            {showAddAddress && (
              <form onSubmit={handleAddAddress} className="address-form add-address-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Label</label>
                    <select
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    >
                      <option>Home</option>
                      <option>Work</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Street Address *</label>
                  <input
                    type="text"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    placeholder="Street address"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Postal Code *</label>
                    <input
                      type="text"
                      value={newAddress.postal}
                      onChange={(e) => setNewAddress({ ...newAddress, postal: e.target.value })}
                      placeholder="Postal code"
                      required
                    />
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newAddress.isDefault}
                      onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                    />
                    <span>Set as default address</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    Add Address
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAddAddress(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="addresses-list">
              {addresses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><HomeIcon size={48} color="#d1d5db" /></div>
                  <p className="empty-title">No saved addresses yet</p>
                  <p className="empty-text">Add your first delivery address to get started</p>
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
                        {address.isDefault && <span className="badge-default">DEFAULT</span>}
                      </div>
                      <div className="address-content">
                        <p>{address.street}</p>
                        <p>{address.city}, {address.postal}</p>
                        {address.phone && <p>{address.phone}</p>}
                      </div>
                    </div>
                    <button
                      className="btn-delete-address"
                      onClick={() => setConfirmDeleteId(address._id)}
                      title="Delete address"
                    >
                      <TrashIcon size={16} color="currentColor" />
                    </button>
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
      </main>

      <PortalFooter />
    </div>
  );
};

export default PortalUserProfile;
