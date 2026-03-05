import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import EditProfileModal from '../../components/portal/EditProfileModal';
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
        alert('Profile updated successfully!');
      }
    } catch (err) {
      alert('Error updating profile: ' + err.message);
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
        alert('Address added successfully!');
      }
    } catch (err) {
      alert('Error adding address: ' + err.message);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
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
          alert('Address deleted successfully!');
        }
      } catch (err) {
        alert('Error deleting address: ' + err.message);
      }
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

          {/* Personal Information Section */}
          <div className="profile-section profile-section-personal">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon">👤</span>
                <h2>Personal Information</h2>
              </div>
              {!isEditing && (
                <button 
                  className="btn-edit-profile"
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ Edit
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
                <span className="value">{user?.phone || 'Not provided'}</span>
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
                <span className="section-icon">📍</span>
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
                    ✅ Add Address
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
                  <div className="empty-icon">🏡</div>
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
                      onClick={() => handleDeleteAddress(address._id)}
                      title="Delete address"
                    >
                      🗑️
                    </button>
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
