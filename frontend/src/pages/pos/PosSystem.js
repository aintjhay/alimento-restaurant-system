import React, { useState, useEffect } from 'react';
import ModifierModal from '../../components/pos/ModifierModal';
import './PosSystem.css';

// Import icons
import { 
  FaCoffee, FaHamburger, FaPizzaSlice, FaGlassMartiniAlt, 
  FaUtensils, FaIceCream, FaWineBottle, FaSearch,
  FaShoppingCart, FaTrash, FaPlus, FaMinus
} from 'react-icons/fa';

function PosSystem() {
  // States
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('Dine-in');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  
  // Categories
  const categories = [
    { id: 'all', name: 'All', icon: <FaUtensils /> },
    { id: 'Cocktails', name: 'Cocktails', icon: <FaGlassMartiniAlt /> },
    { id: 'Pasta', name: 'Pasta', icon: <FaUtensils /> },
    { id: 'Sandwiches', name: 'Sandwiches', icon: <FaHamburger /> },
    { id: 'Sides', name: 'Sides', icon: <FaPizzaSlice /> },
    { id: 'Rice Meals', name: 'Rice Meals', icon: <FaUtensils /> },
    { id: 'Yogurt Milkshakes', name: 'Milkshakes', icon: <FaIceCream /> },
    { id: 'Coffee', name: 'Coffee', icon: <FaCoffee /> },
    { id: 'Coolers', name: 'Coolers', icon: <FaWineBottle /> }
  ];
  
  const [activeCategory, setActiveCategory] = useState('all');

  // Sample menu data (fallback if API fails)
  const sampleMenu = [
    {
      _id: '1',
      name: "CHORIZO JALAPENO",
      description: "Spicy pasta with chorizo and jalapeño peppers",
      price: 200,
      category: "Pasta",
      image: "Chorizojalapeno.jpg",
      preparationTime: 15,
      tags: ["spicy", "popular"],
      modifiers: [],
      addons: []
    },
    {
      _id: '2',
      name: "CLASSIC CARBONARA",
      description: "Creamy pasta with bacon, egg, and parmesan",
      price: 220,
      category: "Pasta",
      image: "Classiccarbonara.jpg",
      preparationTime: 15,
      tags: ["creamy", "classic"],
      modifiers: [],
      addons: []
    },
    {
      _id: '3',
      name: "THICK CUT BACON SANDWICH",
      description: "Sandwich with thick-cut bacon and fresh vegetables",
      price: 180,
      category: "Sandwiches",
      image: "ThickCutBacon.jpg",
      preparationTime: 12,
      tags: ["bacon", "popular"],
      modifiers: [],
      addons: [
        { name: "Add Cajun Fries", price: 50 }
      ]
    },
    {
      _id: '4',
      name: "CHICKEN WINGS",
      description: "Crispy chicken wings with your choice of flavor",
      price: 260,
      category: "Sides",
      image: "BuffaloWings12(2).jpg",
      preparationTime: 20,
      tags: ["chicken", "popular"],
      modifiers: [
        {
          name: "Size",
          required: true,
          options: [
            { name: "8pcs", price: 260 },
            { name: "12pcs", price: 350 }
          ]
        },
        {
          name: "Flavor",
          required: true,
          options: [
            { name: "Buffalo", price: 0 },
            { name: "BBQ", price: 0 },
            { name: "Parmesan", price: 0 }
          ]
        }
      ],
      addons: []
    },
    {
      _id: '5',
      name: "AMERICANO",
      description: "Classic black coffee",
      price: 70,
      category: "Coffee",
      image: "Coffee.jpg",
      preparationTime: 5,
      tags: ["coffee", "classic"],
      modifiers: [
        {
          name: "Temperature",
          required: true,
          options: [
            { name: "Hot", price: 60 },
            { name: "Cold", price: 70 }
          ]
        }
      ],
      addons: [
        { name: "Add Double Shot", price: 25 }
      ]
    },
    {
      _id: '6',
      name: "TEQUILA SUNRISE",
      description: "Vibrant tequila cocktail with orange juice and grenadine",
      price: 120,
      category: "Cocktails",
      image: "",
      preparationTime: 8,
      tags: ["alcoholic", "popular"],
      modifiers: [],
      addons: []
    }
  ];

  // Fetch menu from backend
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/menu');
        
        if (response.ok) {
          const data = await response.json();
          setMenuItems(data);
          setFilteredItems(data);
          console.log('✅ Menu loaded from backend:', data.length, 'items');
        } else {
          throw new Error('Backend not responding');
        }
      } catch (error) {
        console.error('❌ Backend connection failed:', error);
        console.log('Using fallback sample data instead...');
        setMenuItems(sampleMenu);
        setFilteredItems(sampleMenu);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenu();
  }, []);

  // Filter items based on category and search
  useEffect(() => {
    let filtered = menuItems;
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory);
    }
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    setFilteredItems(filtered);
  }, [activeCategory, searchTerm, menuItems]);

  // Handle item click
  const handleItemClick = (item) => {
    if (item.modifiers && item.modifiers.length > 0) {
      setSelectedItem(item);
      setIsModifierModalOpen(true);
    } else if (item.addons && item.addons.length > 0) {
      setSelectedItem(item);
      setIsModifierModalOpen(true);
    } else {
      // Add directly to cart if no modifiers/addons
      addToCartDirect(item);
    }
  };

  // Add item directly to cart (no modifiers)
  const addToCartDirect = (item) => {
    const cartItem = {
      id: item._id || item.id,
      name: item.name,
      basePrice: item.price,
      price: item.price,
      quantity: 1,
      modifiers: [],
      addons: [],
      specialInstructions: '',
      image: item.image,
      category: item.category
    };
    
    addToCart(cartItem);
  };

  // Add item to cart (with modifiers)
  const addToCart = (cartItem) => {
    const existingIndex = cart.findIndex(item => 
      item.id === cartItem.id &&
      JSON.stringify(item.modifiers) === JSON.stringify(cartItem.modifiers) &&
      JSON.stringify(item.addons) === JSON.stringify(cartItem.addons) &&
      item.specialInstructions === cartItem.specialInstructions
    );
    
    if (existingIndex >= 0) {
      // Update quantity if same item with same modifiers
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += cartItem.quantity;
      updatedCart[existingIndex].price = cartItem.price;
      setCart(updatedCart);
    } else {
      // Add new item
      setCart([...cart, cartItem]);
    }
  };

  // Update quantity in cart
  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(index);
      return;
    }
    
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    setCart(updatedCart);
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
  };

  // Clear cart
  const clearCart = () => {
    if (cart.length > 0 && window.confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.12;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to the cart');
      return;
    }

    if (!window.confirm(`Confirm order for Table ${tableNumber}?`)) {
      return;
    }

    const orderData = {
      tableNumber,
      customerName,
      orderType,
      items: cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        modifiers: item.modifiers,
        addons: item.addons,
        specialInstructions: item.specialInstructions,
        image: item.image,
        itemTotal: item.price * item.quantity
      })),
      subtotal: calculateSubtotal(),
      taxAmount: calculateTax(),
      totalAmount: calculateTotal(),
      notes,
      status: 'pending',
      paymentStatus: 'unpaid'
    };

    console.log('📤 Sending order to backend:', orderData);

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📥 Backend response:', result);

      if (result.success) {
        alert(`✅ Order #${result.order?.orderNumber || 'N/A'} submitted successfully!\nTotal: ₱${calculateTotal().toFixed(2)}`);
        setCart([]);
        setCustomerName('');
        setNotes('');
      } else {
        throw new Error(result.error || 'Failed to save order');
      }
    } catch (error) {
      console.error('❌ Order submission error:', error);
      alert(`Order submission failed: ${error.message}`);
      
      // Fallback to localStorage
      const failedOrders = JSON.parse(localStorage.getItem('failedOrders') || '[]');
      failedOrders.push({ ...orderData, error: error.message, timestamp: new Date().toISOString() });
      localStorage.setItem('failedOrders', JSON.stringify(failedOrders));
      alert('Order saved locally. Check failed orders in localStorage.');
    }
  };

  // Get image source
const getImageSource = (imageName) => {
  if (!imageName) {
    return '/images/food/placeholder.jpg';
  }
  
  // For local development, use public folder
  // Your images should be in: frontend/public/images/food/
  return `/images/food/${imageName}`;
};

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      'Cocktails': '#4DB6AC',
      'Pasta': '#FF9800',
      'Sandwiches': '#795548',
      'Sides': '#8BC34A',
      'Rice Meals': '#FF5722',
      'Yogurt Milkshakes': '#E91E63',
      'Coffee': '#795548',
      'Coolers': '#2196F3'
    };
    return colors[category] || '#607D8B';
  };

  return (
    <div className="pos-container">
      {/* Header */}
      <div className="pos-header">
        <div className="header-left">
          <h1>
            <span className="logo-icon">🍽️</span>
            Alimento POS
          </h1>
          <div className="header-stats">
            <span className="stat-item">
              <FaShoppingCart /> {cart.length} items
            </span>
            <span className="stat-item">
              ₱{calculateTotal().toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="header-controls">
          <div className="control-group">
            <label>Table:</label>
            <select value={tableNumber} onChange={(e) => setTableNumber(e.target.value)}>
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <option key={num} value={num}>Table {num}</option>
              ))}
            </select>
          </div>
          
          <div className="control-group">
            <label>Order Type:</label>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
              <option value="Dine-in">Dine-in</option>
              <option value="Takeaway">Takeaway</option>
              <option value="Delivery">Delivery</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Customer:</label>
            <input
              type="text"
              placeholder="Optional"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pos-main">
        {/* Left Side - Menu */}
        <div className="menu-section">
          {/* Search Bar */}
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="clear-search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="category-tabs">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
                style={{
                  borderColor: activeCategory === category.id ? getCategoryColor(category.name) : 'transparent'
                }}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading menu...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-menu">
              <p>No items found</p>
              <p>Try a different search or category</p>
            </div>
          ) : (
            <div className="menu-items-grid">
              {filteredItems.map(item => (
                <div 
                  key={item._id || item.id} 
                  className="menu-item-card"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="item-image-container">
                    <div 
                      className="item-image"
                      style={{
                        backgroundImage: `url(${getImageSource(item.image)})`,
                        backgroundColor: getCategoryColor(item.category)
                      }}
                    >
                      {!item.image && (
                        <span className="image-fallback">
                          {item.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div 
                      className="item-category-badge"
                      style={{ backgroundColor: getCategoryColor(item.category) }}
                    >
                      {item.category}
                    </div>
                    {(item.modifiers && item.modifiers.length > 0) && (
                      <div className="item-modifier-indicator">
                        ⚙️ Options
                      </div>
                    )}
                  </div>
                  
                  <div className="item-details">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description}</p>
                    
                    <div className="item-footer">
                      <div className="item-price-tags">
                        <span className="item-price">₱{item.price.toFixed(2)}</span>
                        {item.tags && item.tags.length > 0 && (
                          <div className="item-tags">
                            {item.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="item-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <button className="add-to-cart-btn">
                        <FaPlus /> Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side - Cart */}
        <div className="cart-section">
          <div className="cart-header">
            <h2>
              <FaShoppingCart /> Order Cart
              <span className="cart-count">({cart.length})</span>
            </h2>
            {cart.length > 0 && (
              <button onClick={clearCart} className="clear-cart-btn">
                <FaTrash /> Clear All
              </button>
            )}
          </div>
          
          <div className="cart-items-container">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">🛒</div>
                <p>Cart is empty</p>
                <p>Click menu items to add to order</p>
              </div>
            ) : (
              <div className="cart-items-list">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="cart-item-header">
                      <div className="cart-item-name">
                        <strong>{item.name}</strong>
                        <span className="cart-item-category">{item.category}</span>
                      </div>
                      <button 
                        onClick={() => removeFromCart(index)}
                        className="remove-item-btn"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Modifiers Display */}
                    {item.modifiers.length > 0 && (
                      <div className="cart-item-modifiers">
                        {item.modifiers.map((mod, modIndex) => (
                          <div key={modIndex} className="modifier-display">
                            <span className="modifier-name">{mod.modifierName}:</span>
                            <span className="modifier-value">{mod.selectedOption}</span>
                            {mod.extraPrice > 0 && (
                              <span className="modifier-price">+₱{mod.extraPrice}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Addons Display */}
                    {item.addons.length > 0 && (
                      <div className="cart-item-addons">
                        {item.addons.map((addon, addonIndex) => (
                          <div key={addonIndex} className="addon-display">
                            <span className="addon-name">+ {addon.name}</span>
                            <span className="addon-price">+₱{addon.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Special Instructions */}
                    {item.specialInstructions && (
                      <div className="cart-item-instructions">
                        <small>Note: {item.specialInstructions}</small>
                      </div>
                    )}
                    
                    <div className="cart-item-footer">
                      <div className="quantity-control">
                        <button 
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="qty-btn"
                        >
                          <FaMinus />
                        </button>
                        <span className="item-quantity">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="qty-btn"
                        >
                          <FaPlus />
                        </button>
                      </div>
                      
                      <div className="cart-item-total">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cart.length > 0 && (
            <>
              <div className="order-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₱{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>VAT (12%):</span>
                  <span>₱{calculateTax().toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span className="total-amount">₱{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="order-notes">
                <label>Order Notes:</label>
                <textarea
                  placeholder="Special instructions, allergies, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="cart-actions">
                <button 
                  onClick={handleSubmitOrder}
                  className="submit-order-btn"
                >
                  <FaShoppingCart /> Submit Order - Table {tableNumber}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modifier Modal */}
      <ModifierModal
        item={selectedItem}
        isOpen={isModifierModalOpen}
        onClose={() => {
          setIsModifierModalOpen(false);
          setSelectedItem(null);
        }}
        onAddToCart={addToCart}
      />
    </div>
  );
}

export default PosSystem;