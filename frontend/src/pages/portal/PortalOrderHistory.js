import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import ReviewModal from '../../components/portal/ReviewModal';
import CheckCircleIcon from '../../components/icons/CheckIcon';
import './Portal.css';

const PortalOrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled
  const [reviewModal, setReviewModal] = useState(null); // { itemId, itemName, orderId }

  useEffect(() => {
    const portalUser = localStorage.getItem('portalUser');
    if (!portalUser) {
      navigate('/portal/login');
      return;
    }

    try {
      setUser(JSON.parse(portalUser));
      loadOrderHistory();
    } catch (err) {
      console.error('Error loading user:', err);
      navigate('/portal/login');
    }
  }, [navigate]);

  const loadOrderHistory = async () => {
    setLoading(true);
    try {
      // Get orders from localStorage (simulated) or from backend API
      const savedOrders = localStorage.getItem('portalOrders');
      if (savedOrders) {
        try {
          const parsedOrders = JSON.parse(savedOrders);
          setOrders(Array.isArray(parsedOrders) ? parsedOrders : []);
        } catch {
          setOrders([]);
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ff9800',
      'confirmed': '#2196f3',
      'preparing': '#2196f3',
      'completed': '#4caf50',
      'cancelled': '#f44336'
    };
    return colors[status] || '#999';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Pending Payment',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return texts[status] || status;
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (!user) {
    return <div className="portal-page"><PortalHeader /><PortalFooter /></div>;
  }

  return (
    <div className="portal-page">
      <PortalHeader />
      
      <main className="portal-main">
        <div className="portal-section">
          <div className="portal-section-header">
            <h1>Your Orders</h1>
            <p>Track and view your order history</p>
          </div>

          {/* Filter Buttons */}
          <div className="order-filters">
            {['all', 'pending', 'confirmed', 'preparing', 'completed'].map(status => (
              <button
                key={status}
                className={`filter-btn ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="orders-list">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <p>No orders found</p>
                <button 
                  className="primary-btn"
                  onClick={() => navigate('/portal')}
                >
                  Start Ordering
                </button>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <h3>Order #{order.orderNumber}</h3>
                      <p className="order-date">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="order-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className="order-items">
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <div className="item-info">
                          <p className="item-name">{item.name} x {item.quantity}</p>
                          {item.specialInstructions && (
                            <p className="item-instructions">"{item.specialInstructions}"</p>
                          )}
                        </div>
                        <div className="item-actions">
                          <p className="item-price">₱{(item.itemTotal || 0).toFixed(2)}</p>
                          {order.status === 'completed' && (
                            <button
                              className="btn-review-small"
                              onClick={() => {
                                setReviewModal({
                                  itemId: item.menuItemId || item.id,
                                  itemName: item.name,
                                  orderId: order.id
                                });
                              }}
                            >
                              ⭐ Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-totals">
                      <div className="total-line">
                        <span>Subtotal:</span>
                        <span>₱{(order.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="total-line">
                        <span>Tax (12%):</span>
                        <span>₱{(order.tax || 0).toFixed(2)}</span>
                      </div>
                      <div className="total-line">
                        <span>Delivery:</span>
                        <span>₱{(order.deliveryFee || 0).toFixed(2)}</span>
                      </div>
                      <div className="total-line total">
                        <span>Total:</span>
                        <strong>₱{(order.total || 0).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>

                  <button 
                    className="order-action-btn"
                    onClick={() => navigate('/portal')}
                  >
                    Order Again
                  </button>

                  {reviewModal && (
                    <ReviewModal
                      itemId={reviewModal.itemId}
                      itemName={reviewModal.itemName}
                      orderId={reviewModal.orderId}
                      onClose={() => setReviewModal(null)}
                      onSuccess={() => {
                        setReviewModal(null);
                        loadOrderHistory();
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <PortalFooter />
    </div>
  );
};

export default PortalOrderHistory;
