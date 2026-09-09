import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuAPI } from '../../services/api';
import { getFoodImage, getItemColor } from '../../utils/imageUtils';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import CartModal from '../../components/portal/CartModal';
import CartIcon from '../../components/icons/CartIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import forkSpoonFallback from '../../assets/images/fork-spoon-fallback.png';
import { FaSearch, FaSlidersH, FaTimes } from 'react-icons/fa';
import { LuLayoutGrid, LuSoup, LuUtensils, LuSandwich, LuCookingPot, LuWine, LuCupSoda, LuCoffee, LuIceCreamBowl } from 'react-icons/lu';
import './Portal.css';

const CART_KEY = 'portalCart';
const CATEGORY_ICONS = { All: LuLayoutGrid, 'Rice Meals': LuSoup, Pasta: LuUtensils, Sandwiches: LuSandwich, Sides: LuCookingPot, Cocktails: LuWine, Coolers: LuCupSoda, Coffee: LuCoffee, 'Yogurt Milkshakes': LuIceCreamBowl };

const PortalHome = () => {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const [hasLoadedMenu, setHasLoadedMenu] = useState(false);

  useEffect(() => {
    const page = pageRef.current;
    const header = page?.querySelector(".portal-header");
    if (!header) return;
    const observer = new ResizeObserver(() => {
      page.style.setProperty("--portal-header-height", `${header.getBoundingClientRect().height}px`);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, [hasLoadedMenu]);
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
    if (!modalItem) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [modalItem]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 8, totalItems: 0, totalPages: 1 });

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
    menuAPI.getCategories().then(setCategoryOptions).catch(() => setCategoryOptions([]));
  }, []);

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        console.log('🔄 Fetching menu from API...');
        const data = await menuAPI.getPage({ page: currentPage, category: activeCategory, search: searchTerm });
        console.log('✅ Menu data received:', data);
        
        if (Array.isArray(data.items)) {
          setMenuItems(data.items);
          setPagination(data.pagination);
          if (data.pagination.page !== currentPage) setCurrentPage(data.pagination.page);
        } else if (data && data.data && Array.isArray(data.data)) {
          setMenuItems(data.data);
        } else {
          console.warn('⚠️ Menu data is empty or invalid');
          setMenuItems([]);
        }
      } catch (error) {
        console.error('❌ Menu fetch error:', error);
        setMenuItems([]);
      } finally {
        setLoading(false);
        setHasLoadedMenu(true);
      }
    };

    const timeoutId = setTimeout(fetchMenu, searchTerm ? 300 : 0);
    return () => clearTimeout(timeoutId);
  }, [activeCategory, currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchTerm]);

  const categories = useMemo(() => {
    const ORDER = ['Rice Meals', 'Pasta', 'Sandwiches', 'Sides', 'Cocktails', 'Coolers', 'Coffee', 'Yogurt Milkshakes'];
    const unique = new Set(categoryOptions);
    const sorted = ORDER.filter(c => unique.has(c));
    // Append any unlisted categories at the end
    unique.forEach(c => { if (!ORDER.includes(c)) sorted.push(c); });
    return ['All', ...sorted];
  }, [categoryOptions]);

  const filteredItems = useMemo(() => {
    const ORDER = ['Rice Meals', 'Pasta', 'Sandwiches', 'Sides', 'Cocktails', 'Coolers', 'Coffee', 'Yogurt Milkshakes'];
    const filtered = [...menuItems];
    if (activeCategory === 'All') {
      filtered.sort((a, b) => {
        const ai = ORDER.indexOf(a.category);
        const bi = ORDER.indexOf(b.category);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    }
    return filtered;
  }, [menuItems, activeCategory]);

  const openModal = (item) => {
    const initialModifiers = {};
    (item.modifiers || []).forEach(mod => {
      if (mod.required && mod.options && mod.options.length > 0) {
        initialModifiers[mod.name] = (mod.name === 'Temperature'
          ? mod.options.find(option => option.price === item.price)
          : null) || mod.options[0];
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

  const removeCartItem = (index) => {
    setCart(currentCart => currentCart.filter((_, itemIndex) => itemIndex !== index));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
  const deliveryFee = 50;
  const cartTotal = cartSubtotal + deliveryFee;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const formatCurrency = (amount) => `₱${amount.toFixed(2)}`;
  const formatProductName = (name = '') => name
    .toLocaleLowerCase()
    .replace(/\b\w/g, letter => letter.toLocaleUpperCase())
    .replace(/\bBbq\b/g, 'BBQ');

  // Get recommended items (featured or most popular)
  const recommendedItems = useMemo(() => {
    return menuItems
      .filter(item => item.featured || item.isPopular)
      .slice(0, 4);
  }, [menuItems]);

  const handleCheckout = () => {
    if (cart.length === 0 || isCheckingOut) return;
    setIsCheckingOut(true);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    
    // Go directly to checkout (skip choice page for better UX)
    navigate('/portal/checkout');
  };

  const handleConfirmModal = () => {
    if (!modalItem) return;

    const modifiers = (modalItem.modifiers || []).map(mod => {
      const selected = selectedModifiers[mod.name];
      if (!selected) return null;
      return {
        modifierName: mod.name,
        selectedOption: selected.name,
        // Temperature options are full prices; orders store adjustments to the base.
        extraPrice: mod.name === 'Temperature'
          ? (selected.price ?? modalItem.price) - modalItem.price
          : selected.price || 0
      };
    }).filter(Boolean);

    const addons = (modalItem.addons || [])
      .filter(addon => selectedAddons[addon.name])
      .map(addon => ({ name: addon.name, price: addon.price || 0 }));

    addToCart(buildCartItem(modalItem, modifiers, addons));
    closeModal();
  };

  if (loading && !hasLoadedMenu) {
    return (
      <div className="portal-page" ref={pageRef}>
        <PortalHeader onCartClick={() => setShowCartModal(true)} cartCount={cartItemCount} />
        <div className="portal-loading" style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <p>Loading menu...</p>
            <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '10px' }}>If this takes too long, please ensure the backend server is running.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!menuItems.length && !loading && activeCategory === 'All' && !searchTerm.trim()) {
    return (
      <div className="portal-page" ref={pageRef}>
        <PortalHeader onCartClick={() => setShowCartModal(true)} cartCount={cartItemCount} />
        <div className="portal-loading" style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Menu is currently unavailable</p>
            <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'left', fontSize: '0.9rem', color: '#664d03', lineHeight: '1.6' }}>
              <p style={{ fontWeight: '600', marginTop: 0 }}>Troubleshooting:</p>
              <ul style={{ marginLeft: '1.5rem', marginBottom: 0 }}>
                <li>Make sure the backend server is running on port 5000</li>
                <li>Check that MongoDB is connected</li>
                <li>Try refreshing the page</li>
                <li>Check browser console (F12) for detailed error messages</li>
              </ul>
            </div>
            <button onClick={() => window.location.reload()} style={{
              padding: '0.75rem 1.5rem',
              background: '#2f6f6a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page" ref={pageRef}>
      <PortalHeader onCartClick={() => setShowCartModal(true)} cartCount={cartItemCount} />
      
      <header className="portal-hero">
        <div className="portal-hero-content">
          <p className="portal-kicker">Alimento Resto</p>
          <h1>Your Alimento favorites, delivered.</h1>
          <p className="portal-subtitle">Browse the menu and pay with GCash.</p>
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

      <div className="portal-category-bar">
        <div className="category-bar-inner" role="group" aria-label="Filter menu by category">
          {categories.map(category => {
            const Icon = CATEGORY_ICONS[category] || LuUtensils;
            return (
            <button
              key={category}
              type="button"
              aria-pressed={activeCategory === category}
              className={`category-chip ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              <span className="chip-icon"><Icon aria-hidden="true" focusable="false" /></span>
              {category === 'Yogurt Milkshakes' ? 'Yogurt Shakes' : category}
            </button>
            );
          })}
        </div>
      </div>

      {recommendedItems.length > 0 && activeCategory === 'All' && !searchTerm && (
        <section className="recommended-section">
          <div className="recommended-container">
            <h2>⭐ Recommended for you</h2>
            <div className="recommended-grid">
              {recommendedItems.map(item => (
                <div key={item._id || item.name} className="recommended-card">
                  <div
                    className="recommended-image"
                    style={{ 
                      backgroundColor: item.image ? getItemColor(item.category) : '#dde5e4',
                      backgroundImage: item.image ? `url(${getFoodImage(item.image)})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {!item.image && (
                      <span className="image-fallback">
                        <img src={forkSpoonFallback} alt="" className="fallback-utensils" />
                      </span>
                    )}
                    {item.featured && <div className="featured-badge">⭐ Featured</div>}
                  </div>
                  <div className="recommended-body">
                    <h3>{item.name}</h3>
                    <p className="recommended-price">₱{item.price}</p>
                    <button className="recommended-btn" onClick={() => handleAddClick(item)}>
                      Quick add →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="portal-content">
        <main className="portal-menu" aria-busy={loading}>
          {loading && <p role="status">Loading menu...</p>}
          <div className="menu-grid">
            {filteredItems.map(item => (
              <div key={item._id || item.name} className="menu-card">
                <div
                  className="menu-image"
                  style={{ 
                    backgroundColor: item.image ? getItemColor(item.category) : '#dde5e4',
                    backgroundImage: item.image ? `url(${getFoodImage(item.image)})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!item.image && (
                    <span className="image-fallback">
                      <img src={forkSpoonFallback} alt="" className="fallback-utensils" />
                    </span>
                  )}
                  {(item.modifiers && item.modifiers.length > 0) && (
                    <div className="menu-modifier-badge">
                      <FaSlidersH aria-hidden="true" />
                      <span>Customize</span>
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
          {pagination.totalPages > 1 && (
            <nav className="product-pagination" aria-label="Product pages">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage || loading}
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                type="button"
                disabled={!pagination.hasNextPage || loading}
                onClick={() => setCurrentPage(page => page + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </main>

        <aside className="portal-cart">
          <div className="cart-header">
            <h2>Your order</h2>
            <span>{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</span>
          </div>
          {cart.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty-icon" aria-hidden="true"><CartIcon size={28} /></span>
              <strong>Your cart is empty</strong>
              <span>Add an item from the menu to get started.</span>
            </div>
          ) : (
            <div className="cart-list">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="cart-item">
                  <div className="cart-item-content">
                    <div className="cart-item-left">
                      <h4>{formatProductName(item.name)}</h4>
                      <p className="cart-item-price">{formatCurrency(item.itemPrice * item.quantity)}</p>
                    </div>
                    <div className="cart-item-actions">
                      <div className="cart-quantity-group">
                        <span className="cart-quantity-label">Quantity</span>
                        <div className="cart-qty" aria-label={`Quantity for ${item.name}`}>
                          <button onClick={() => updateQuantity(index, -1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
                          <span key={item.quantity} className="cart-quantity-value" aria-live="polite">{item.quantity}</span>
                          <button onClick={() => updateQuantity(index, 1)} aria-label={`Increase ${item.name} quantity`}>+</button>
                        </div>
                      </div>
                      <button
                        className="cart-remove-btn"
                        onClick={() => removeCartItem(index)}
                        aria-label={`Remove ${item.name} from order`}
                        title="Remove item"
                      >
                        <TrashIcon size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="cart-summary">
                <span>Subtotal</span>
                <strong>{formatCurrency(cartSubtotal)}</strong>
              </div>
              <div className="cart-breakdown">
                <div className="breakdown-row">
                  <span className="delivery-label">Delivery fee <small>Standard delivery</small></span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="breakdown-row total">
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            </div>
          )}
          <button className="checkout-btn" onClick={handleCheckout} disabled={cart.length === 0 || isCheckingOut}>
            {isCheckingOut ? 'Opening checkout…' : 'Proceed to checkout'}
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
                    {option.price > 0 && <span className="option-price">{mod.name === 'Temperature' ? '' : '+'}₱{option.price}</span>}
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

      {/* Floating cart button — visible on mobile only */}
      <button
        className="floating-cart-btn"
        onClick={() => setShowCartModal(true)}
      >
        🛒 View Cart
        {cart.length > 0 && (
          <span className="floating-cart-badge">{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>
        )}
      </button>

      <PortalFooter />
    </div>
  );
};

export default PortalHome;
