import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import HeartIcon from '../../components/icons/HeartIcon';
import './Portal.css';

const FAVORITES_KEY = 'portalFavorites';

const PortalFavorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const portalUser = localStorage.getItem('portalUser');
    if (!portalUser) {
      navigate('/portal/login');
      return;
    }

    try {
      setUser(JSON.parse(portalUser));
      loadFavorites();
    } catch (err) {
      console.error('Error loading user:', err);
      navigate('/portal/login');
    }
  }, [navigate]);

  const loadFavorites = () => {
    setLoading(true);
    try {
      const savedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (savedFavorites) {
        try {
          const parsed = JSON.parse(savedFavorites);
          setFavorites(Array.isArray(parsed) ? parsed : []);
        } catch {
          setFavorites([]);
        }
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = (itemId) => {
    const updated = favorites.filter(item => item.id !== itemId);
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  const addToCart = (item) => {
    const cartKey = 'portalCart';
    const savedCart = localStorage.getItem(cartKey);
    const cart = savedCart ? JSON.parse(savedCart) : [];
    
    const cartItem = {
      id: item.id || item._id,
      menuItemId: item.id || item._id,
      name: item.name,
      basePrice: item.price,
      itemPrice: item.price,
      quantity: 1,
      modifiers: [],
      addons: [],
      specialInstructions: '',
      image: item.image || '',
      category: item.category
    };

    const existingIndex = cart.findIndex(i => i.id === cartItem.id);
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    // Could show a toast here - "Added to cart!"
  };

  if (!user) {
    return <div className="portal-page"><PortalHeader /><PortalFooter /></div>;
  }

  return (
    <div className="portal-page">
      <PortalHeader />
      
      <main className="portal-main">
        <div className="portal-section">
          <div className="portal-section-header">
            <h1>❤️ Your Favorites</h1>
            <p>Quick access to your favorite menu items</p>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your favorites...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="empty-state">
              <p>No favorites yet</p>
              <p style={{ fontSize: '0.95rem', color: '#999', marginTop: '0.5rem' }}>
                Mark items as favorites while browsing the menu
              </p>
              <button 
                className="primary-btn"
                onClick={() => navigate('/portal')}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="favorites-grid">
              {favorites.map((item) => (
                <div key={item.id || item._id} className="favorite-card">
                  <div className="favorite-header">
                    <span className="favorite-category">{item.category}</span>
                    <button 
                      className="favorite-remove"
                      onClick={() => removeFavorite(item.id || item._id)}
                      title="Remove from favorites"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="favorite-image" style={{
                    backgroundColor: '#f0f0f0'
                  }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <span className="image-placeholder">{item.name.charAt(0)}</span>
                    )}
                  </div>

                  <div className="favorite-body">
                    <h3>{item.name}</h3>
                    <p className="favorite-description">{item.description}</p>
                    <div className="favorite-footer">
                      <span className="favorite-price">₱{item.price}</span>
                      <button 
                        className="favorite-add-btn"
                        onClick={() => addToCart(item)}
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <PortalFooter />
    </div>
  );
};

export default PortalFavorites;
