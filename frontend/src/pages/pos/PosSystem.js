import React, { useState, useEffect } from 'react';
import './PosSystem.css';

function PosSystem() {
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [tableNumber, setTableNumber] = useState('1');
    const [customerName, setCustomerName] = useState('');
    const [orderType, setOrderType] = useState('Dine-in');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState(['All']);
    const [activeCategory, setActiveCategory] = useState('All');

    // Sample data - will be replaced with API call
    const sampleMenu = [
        { id: 1, code: "PAS-001", name: "CHORIZO JALAPENO", price: 200, category: "Pasta", is_available: true },
        { id: 2, code: "PAS-002", name: "CLASSIC CARBONARA", price: 220, category: "Pasta", is_available: true },
        { id: 3, code: "SAN-001", name: "THICK CUT BACON", price: 180, category: "Sandwich", is_available: true },
        { id: 4, code: "COC-001", name: "TEQUILA SUNRISE", price: 120, category: "Cocktail", is_available: true },
        { id: 5, code: "COC-002", name: "MOJITO", price: 120, category: "Cocktail", is_available: true },
        { id: 6, code: "SID-001", name: "NACHORIZO", price: 190, category: "Side", is_available: true }
    ];

useEffect(() => {
    const fetchMenu = async () => {
        setLoading(true);
        try {
            // Fetch from your real backend
            const response = await fetch('http://localhost:5000/api/menu');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setMenuItems(data);
            
            // Extract unique categories from the data
            const uniqueCategories = ['All', ...new Set(data.map(item => item.category))];
            setCategories(uniqueCategories);
            
            console.log('✅ Menu loaded from backend:', data.length, 'items');
        } catch (error) {
            console.error('❌ Backend connection failed:', error);
            console.log('Using fallback sample data instead...');
            
            // Fallback to sample data if backend fails
            setMenuItems(sampleMenu);
            setCategories(['All', 'Pasta', 'Sandwich', 'Cocktail', 'Side']);
        } finally {
            setLoading(false);
        }
    };
    
    fetchMenu();
}, []);

    const addToCart = (item) => {
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
            setCart(cart.map(cartItem =>
                cartItem.id === item.id
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            ));
        } else {
            setCart([...cart, {
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                specialInstructions: ''
            }]);
        }
    };

    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(itemId);
            return;
        }
        
        setCart(cart.map(item =>
            item.id === itemId
                ? { ...item, quantity: newQuantity }
                : item
        ));
    };

    const removeFromCart = (itemId) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    const clearCart = () => {
        if (window.confirm('Clear all items from cart?')) {
            setCart([]);
        }
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const calculateTax = () => {
        return calculateSubtotal() * 0.12;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const handleSubmitOrder = async () => {
    if (cart.length === 0) {
        alert('Please add items to the cart');
        return;
    }

    if (!window.confirm(`Confirm order for Table ${tableNumber}?`)) {
        return;
    }

    try {
        setLoading(true);
        
        const orderData = {
            tableNumber: tableNumber,
            orderType: orderType,
            customerName: customerName || '',
            items: cart.map(item => ({
                menuItemId: item.id.toString(),
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions || ''
            })),
            subtotal: calculateSubtotal(),
            taxAmount: calculateTax(),
            totalAmount: calculateTotal(),
            notes: notes
        };

        console.log('📦 Submitting order:', orderData);

        const response = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(`✅ Order #${result.order.orderNumber} submitted successfully!\nTotal: ₱${calculateTotal().toFixed(2)}`);
            
            // Reset form
            setCart([]);
            setCustomerName('');
            setNotes('');
            
            console.log('✅ Order saved to database:', result.order);
            
            // Optional: Trigger dashboard refresh
            if (window.dashboardRefresh) {
                window.dashboardRefresh();
            }
        } else {
            throw new Error(result.message || 'Order submission failed');
        }
        
    } catch (error) {
        console.error('❌ Order submission error:', error);
        alert(`Order submission failed: ${error.message}\n\nOrder data saved locally for retry.`);
        
        // Fallback: Save to localStorage for recovery
        const failedOrder = {
            ...orderData,
            timestamp: new Date().toISOString(),
            error: error.message
        };
        
        const failedOrders = JSON.parse(localStorage.getItem('failedOrders') || '[]');
        failedOrders.push(failedOrder);
        localStorage.setItem('failedOrders', JSON.stringify(failedOrders));
    } finally {
        setLoading(false);
    }
};

    const filteredItems = activeCategory === 'All' 
        ? menuItems 
        : menuItems.filter(item => item.category === activeCategory);

    return (
        <div className="pos-container">
            <div className="pos-header">
                <h1>🍽️ Alimento POS System</h1>
                <div className="header-controls">
                    <div className="control-group">
                        <label>Table:</label>
                        <select value={tableNumber} onChange={(e) => setTableNumber(e.target.value)}>
                            {[1,2,3,4,5,6,7,8].map(num => (
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
                        <label>Customer Name:</label>
                        <input
                            type="text"
                            placeholder="Optional"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="pos-main">
                {/* Menu Section */}
                <div className="menu-section">
                    <div className="category-tabs">
                        {categories.map(category => (
                            <button
                                key={category}
                                className={`category-tab ${activeCategory === category ? 'active' : ''}`}
                                onClick={() => setActiveCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    <div className="menu-items-grid">
                        {filteredItems.map(item => (
                            <div key={item.id} className="menu-item-card" onClick={() => addToCart(item)}>
                                <div className="item-image">
                                    <div className="image-placeholder">
                                        {item.name.charAt(0)}
                                    </div>
                                </div>
                                <div className="item-details">
                                    <h3 className="item-name">{item.name}</h3>
                                    <p className="item-code">{item.code}</p>
                                    <div className="item-footer">
                                        <span className="item-price">₱{item.price.toFixed(2)}</span>
                                        <span className="item-category">{item.category}</span>
                                    </div>
                                </div>
                                <button className="add-to-cart-btn">+ Add</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cart Section */}
                <div className="cart-section">
                    <h2>🛒 Order Cart ({cart.length} items)</h2>
                    
                    <div className="cart-items-container">
                        {cart.length === 0 ? (
                            <div className="empty-cart">
                                <p>Cart is empty</p>
                                <p>Click menu items to add to order</p>
                            </div>
                        ) : (
                            <div className="cart-items-list">
                                {cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <div className="cart-item-info">
                                            <h4>{item.name}</h4>
                                            <p>₱{item.price.toFixed(2)} each</p>
                                        </div>
                                        <div className="cart-item-controls">
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="qty-btn"
                                            >
                                                -
                                            </button>
                                            <span className="item-quantity">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="qty-btn"
                                            >
                                                +
                                            </button>
                                            <button 
                                                onClick={() => removeFromCart(item.id)}
                                                className="remove-btn"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="cart-item-total">
                                            ₱{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

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
                            <span>Total:</span>
                            <span>₱{calculateTotal().toFixed(2)}</span>
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
                            onClick={clearCart}
                            className="action-btn clear-btn"
                            disabled={cart.length === 0}
                        >
                            Clear Cart
                        </button>
                        
                        <button 
                            onClick={handleSubmitOrder}
                            className="action-btn submit-btn"
                            disabled={cart.length === 0}
                        >
                            Submit Order (Table {tableNumber})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PosSystem;
