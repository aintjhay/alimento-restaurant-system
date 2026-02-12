import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuAPI } from '../../services/api';
import { getCategoryIcon, getFoodImage, getItemColor } from '../../utils/imageUtils';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import CartModal from '../../components/portal/CartModal';
import { FaSearch, FaTimes } from 'react-icons/fa';
import './Portal.css';

const CART_KEY = 'portalCart';

const PortalHome = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [selectedAddons, setSelectedAddons] = useState({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem(CART_KEY);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        setCart([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const data = await menuAPI.getAll();
        setMenuItems(Array.isArray(data) ? data : []);
      } catch (error) {
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(menuItems.map(item => item.category));
    return ['All', ...Array.from(unique)];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = !searchTerm.trim() ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchTerm]);

  const openModal = (item) => {
    const initialModifiers = {};
    (item.modifiers || []).forEach(mod => {
      if (mod.required && mod.options && mod.options.length > 0) {
        initialModifiers[mod.name] = mod.options[0];
      }
    });

    setModalItem(item);
    setSelectedModifiers(initialModifiers);
    setSelectedAddons({});
    setSpecialInstructions('');
  };

  const closeModal = () => {
    setModalItem(null);
    setSelectedModifiers({});
    setSelectedAddons({});
    setSpecialInstructions('');
  };

  const handleAddClick = (item) => {
    if ((item.modifiers && item.modifiers.length > 0) || (item.addons && item.addons.length > 0)) {
      openModal(item);
      return;
    }

    addToCart(buildCartItem(item, [], []));
  };

  const buildCartItem = (item, modifiers, addons) => {
    const extrasTotal = modifiers.reduce((sum, mod) => sum + (mod.extraPrice || 0), 0) +
      addons.reduce((sum, addon) => sum + (addon.price || 0), 0);

    const itemPrice = item.price + extrasTotal;

    return {
      id: item._id || item.id,
      menuItemId: item._id || item.id,
      name: item.name,
      basePrice: item.price,
      itemPrice: itemPrice,
      quantity: 1,
      modifiers: modifiers,
      addons: addons,
      specialInstructions: specialInstructions.trim(),
      image: item.image || '',
      category: item.category
    };
  };

  const addToCart = (cartItem) => {
    const existingIndex = cart.findIndex(item =>
      item.id === cartItem.id &&
      JSON.stringify(item.modifiers) === JSON.stringify(cartItem.modifiers) &&
      JSON.stringify(item.addons) === JSON.stringify(cartItem.addons) &&
      item.specialInstructions === cartItem.specialInstructions
    );

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, cartItem]);
    }
  };

  const updateQuantity = (index, delta) => {
    const updated = [...cart];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) {
      updated.splice(index, 1);
    }
    setCart(updated);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
  const taxAmount = cartSubtotal * 0.12;
  const deliveryFee = 50;
  const cartTotal = cartSubtotal + taxAmount + deliveryFee;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    navigate('/portal/checkout-choice');
  };

  const handleConfirmModal = () => {
    if (!modalItem) return;

    const modifiers = (modalItem.modifiers || []).map(mod => {
      const selected = selectedModifiers[mod.name];
      if (!selected) return null;
      return {
        modifierName: mod.name,
        selectedOption: selected.name,
        extraPrice: selected.price || 0
      };
    }).filter(Boolean);

    const addons = (modalItem.addons || [])
      .filter(addon => selectedAddons[addon.name])
      .map(addon => ({ name: addon.name, price: addon.price || 0 }));

    addToCart(buildCartItem(modalItem, modifiers, addons));
    closeModal();
  };

  if (loading) {
    return (
      <div className="portal-page">
        <div className="portal-loading">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <PortalHeader onCartClick={() => setShowCartModal(true)} cartCount={cart.length} />
      
      <header className="portal-hero">
        <div className="portal-hero-content">
          <p className="portal-kicker">Alimento Resto</p>
          <h1>Order online for delivery</h1>
          <p className="portal-subtitle">Choose from our bestsellers and pay via GCash. We will verify and prepare right away.</p>
          <div className="portal-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search menu items..."
            />
            {searchTerm && (
              <button 
                className="search-clear" 
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="portal-content">
        <aside className="portal-categories">
          <h2>Categories</h2>
          <div className="category-list">
            {categories.map(category => (
              <button
                key={category}
                className={`category-chip ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="chip-icon">{category === 'All' ? '▦' : getCategoryIcon(category)}</span>
                {category}
              </button>
            ))}
          </div>
        </aside>

        <main className="portal-menu">
          <div className="menu-grid">
            {filteredItems.map(item => (
              <div key={item._id || item.name} className="menu-card">
                <div
                  className="menu-image"
                  style={{ 
                    backgroundColor: getItemColor(item.category),
                    backgroundImage: item.image ? `url(${getFoodImage(item.image)})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!item.image && (
                    <span className="image-fallback">
                      {item.name.charAt(0)}
                    </span>
                  )}
                  {(item.modifiers && item.modifiers.length > 0) && (
                    <div className="menu-modifier-badge">
                      ⚙️ Options
                    </div>
                  )}
                </div>
                <div className="menu-card-body">
                  <div className="menu-card-header">
                    <span className="menu-category">{item.category}</span>
                    <span className="menu-price">₱{item.price}</span>
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <button className="menu-add" onClick={() => handleAddClick(item)}>
                    Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        <aside className="portal-cart">
          <div className="cart-header">
            <h2>Your order</h2>
            <span>{cart.length} items</span>
          </div>
          {cart.length === 0 ? (
            <div className="cart-empty">Add items to start your order.</div>
          ) : (
            <div className="cart-list">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="cart-item">
                  <div className="cart-item-content">
                    <div className="cart-item-left">
                      <h4>{item.name}</h4>
                      <p className="cart-item-price">₱{(item.itemPrice * item.quantity).toFixed(0)}</p>
                    </div>
                    <div className="cart-qty">
                      <button onClick={() => updateQuantity(index, -1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(index, 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="cart-summary">
                <span>Subtotal</span>
                <strong>₱{cartSubtotal.toFixed(0)}</strong>
              </div>
              <div className="cart-breakdown">
                <div className="breakdown-row">
                  <span>Tax (12%)</span>
                  <span>₱{taxAmount.toFixed(0)}</span>
                </div>
                <div className="breakdown-row">
                  <span>Delivery Fee</span>
                  <span>₱{deliveryFee.toFixed(0)}</span>
                </div>
                <div className="breakdown-row total">
                  <span>Total</span>
                  <span>₱{cartTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}
          <button className="checkout-btn" onClick={handleCheckout} disabled={cart.length === 0}>
            Proceed to checkout
          </button>
        </aside>
      </div>

      {modalItem && (
        <div className="portal-modal">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{modalItem.name}</h3>
              <button className="modal-close" onClick={closeModal}>x</button>
            </div>

            <div className="modal-content-wrapper">
            {(modalItem.modifiers || []).map(mod => (
              <div key={mod.name} className="modal-section">
                <h4>{mod.name}</h4>
                <div className="modal-options">
                  {(mod.options || []).map(option => (
                    <label key={option.name} className="option-row">
                      <input
                        type="radio"
                        name={mod.name}
                        checked={selectedModifiers[mod.name]?.name === option.name}
                        onChange={() => setSelectedModifiers({
                          ...selectedModifiers,
                          [mod.name]: option
                        })}
                      />
                      <span>{option.name}</span>
                    {option.price > 0 && <span className="option-price">+₱{option.price}</span>}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {(modalItem.addons || []).length > 0 && (
              <div className="modal-section">
                <h4>Add-ons</h4>
                <div className="modal-options">
                  {modalItem.addons.map(addon => (
                    <label key={addon.name} className="option-row">
                      <input
                        type="checkbox"
                        checked={!!selectedAddons[addon.name]}
                        onChange={() => setSelectedAddons({
                          ...selectedAddons,
                          [addon.name]: !selectedAddons[addon.name]
                        })}
                      />
                      <span>{addon.name}</span>
                    <span className="option-price">+₱{addon.price}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-section">
              <label className="instructions-label">Special instructions (optional)</label>
              <textarea
                value={specialInstructions}
                onChange={(event) => setSpecialInstructions(event.target.value)}
                placeholder="Less ice, extra sauce, etc."
              />
            </div>
            </div>

            <div className="modal-actions">
              <button className="secondary-btn" onClick={closeModal}>Cancel</button>
              <button className="primary-btn" onClick={handleConfirmModal}>Add to cart</button>
            </div>
          </div>
        </div>
      )}

      {showCartModal && (
        <CartModal 
          cart={cart}
          onClose={() => setShowCartModal(false)}
          onUpdateQuantity={updateQuantity}
          onCheckout={handleCheckout}
        />
      )}

      <PortalFooter />
    </div>
  );
};

export default PortalHome;
