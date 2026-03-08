import React, { useState, useEffect } from 'react';
import ModifierModal from '../../components/pos/ModifierModal';
import API_BASE_URL from '../../config/api';
import './PosSystem.css';
import { getFoodImage, getItemColor, getCategoryIcon } from '../../utils/imageUtils';
import { 
  FaSearch,
  FaShoppingCart, FaTrash, FaPlus, FaMinus, FaPrint, FaCheck
} from 'react-icons/fa';

// Import logo
import logoImg from '../../assets/images/logo/alimentologo.png';

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
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // Categories
  const categories = [
    { id: 'Rice Meals', name: 'Rice Meals', icon: getCategoryIcon('Rice Meals') },
    { id: 'Pasta', name: 'Pasta', icon: getCategoryIcon('Pasta') },
    { id: 'Sandwiches', name: 'Sandwiches', icon: getCategoryIcon('Sandwiches') },
    { id: 'Sides', name: 'Sides', icon: getCategoryIcon('Sides') },
    { id: 'Cocktails', name: 'Cocktails', icon: getCategoryIcon('Cocktails') },
    { id: 'Coolers', name: 'Coolers', icon: getCategoryIcon('Coolers') },
    { id: 'Coffee', name: 'Coffee', icon: getCategoryIcon('Coffee') },
    { id: 'Yogurt Milkshakes', name: 'Milkshakes', icon: getCategoryIcon('Yogurt Milkshakes') }
  ];
  
  const [activeCategory, setActiveCategory] = useState('Rice Meals');
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);

  // Sample menu data (fallback if API fails) - Synced from backend completeMenu.js
  const sampleMenu = [
    // ================ COCKTAILS ================
    { name: "TEQUILA SUNRISE", description: "Vibrant tequila cocktail with orange juice and grenadine", price: 120, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic", "popular"], modifiers: [], addons: [] },
    { name: "MOJITO", description: "Refreshing Cuban cocktail with mint, lime, and rum", price: 120, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic", "refreshing"], modifiers: [], addons: [] },
    { name: "AMARETTO SOUR", description: "Sweet and sour cocktail with amaretto liqueur", price: 120, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic"], modifiers: [], addons: [] },
    { name: "WHISKY-RETTO", description: "Classic whisky cocktail with a twist", price: 120, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic"], modifiers: [], addons: [] },
    { name: "FROZEN BLUEBERRY DAIQUIRI", description: "Frozen rum cocktail with fresh blueberries", price: 120, category: "Cocktails", image: "", preparationTime: 10, tags: ["alcoholic", "frozen", "sweet"], modifiers: [], addons: [] },
    { name: "BLUE LAGOON", description: "Vibrant blue vodka cocktail with lemonade", price: 120, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic", "colorful"], modifiers: [], addons: [] },
    { name: "MARGARITA", description: "Classic tequila cocktail with lime and salt rim", price: 110, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic", "classic"], modifiers: [], addons: [] },
    { name: "PURPLE HEARTS", description: "Violet-colored cocktail with berry flavors", price: 100, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic"], modifiers: [], addons: [] },
    { name: "WHISKY SOUR", description: "Classic whisky cocktail with lemon and sugar", price: 90, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic"], modifiers: [], addons: [] },
    { name: "WHISKY COKE", description: "Simple whisky mixed with Coca-Cola", price: 90, category: "Cocktails", image: "", preparationTime: 5, tags: ["alcoholic"], modifiers: [], addons: [] },
    { name: "GIN TONIC", description: "Classic gin and tonic with lime", price: 90, category: "Cocktails", image: "", preparationTime: 5, tags: ["alcoholic"], modifiers: [], addons: [] },
    { name: "TEQUILA SHOT", description: "Straight tequila shot with lime and salt", price: 50, category: "Cocktails", image: "", preparationTime: 2, tags: ["alcoholic"], modifiers: [], addons: [] },
    
    // ================ PASTA ================
    { name: "CHORIZO JALAPENO", description: "Spicy pasta with chorizo and jalapeño peppers", price: 200, category: "Pasta", image: "Chorizojalapeno.jpg", preparationTime: 15, tags: ["spicy", "popular"], modifiers: [], addons: [] },
    { name: "CLASSIC CARBONARA", description: "Creamy pasta with bacon, egg, and parmesan", price: 220, category: "Pasta", image: "Classiccarbonara.jpg", preparationTime: 15, tags: ["creamy", "classic"], modifiers: [], addons: [] },
    { name: "SPANISH STYLE", description: "Spanish-inspired pasta with chorizo and paprika", price: 190, category: "Pasta", image: "SpanishStyle.jpg", preparationTime: 15, tags: ["spicy"], modifiers: [], addons: [] },
    { name: "FILIPINO STYLE", description: "Local Filipino-style pasta with a sweet twist", price: 190, category: "Pasta", image: "Pinoystyle.jpg", preparationTime: 15, tags: ["sweet", "local"], modifiers: [], addons: [] },
    { name: "SEAFOOD PASTA", description: "Pasta with mixed seafood in white wine sauce", price: 220, category: "Pasta", image: "", preparationTime: 20, tags: ["seafood"], modifiers: [], addons: [] },
    
    // ================ SANDWICHES ================
    { name: "THICK CUT BACON", description: "Sandwich with thick-cut bacon and fresh vegetables", price: 180, category: "Sandwiches", image: "ThickCutBacon.JPG", preparationTime: 12, tags: ["bacon", "popular"], modifiers: [], addons: [{ name: "Add Cajun Fries", price: 50 }] },
    { name: "CRISPY CHIX", description: "Crispy chicken sandwich with your choice of sauce", price: 170, category: "Sandwiches", image: "CrispyChix.JPG", preparationTime: 15, tags: ["chicken", "popular"], modifiers: [{ name: "Flavor", required: true, options: [{ name: "Buffalo", price: 0 }, { name: "BBQ", price: 0 }] }], addons: [{ name: "Add Cajun Fries", price: 50 }] },
    { name: "CHORI CHEESEBURGER", description: "Burger with chorizo patty and melted cheese", price: 180, category: "Sandwiches", image: "Choricheeseburger.JPG", preparationTime: 15, tags: ["chorizo", "burger"], modifiers: [], addons: [{ name: "Add Cajun Fries", price: 50 }] },
    { name: "BBQ CHEESEBURGER", description: "Classic cheeseburger with BBQ sauce", price: 190, category: "Sandwiches", image: "", preparationTime: 15, tags: ["burger", "bbq"], modifiers: [], addons: [{ name: "Add Cajun Fries", price: 50 }] },
    
    // ================ SIDES ================
    { name: "NACHORIZO", description: "Nachos with chorizo, cheese, and toppings", price: 190, category: "Sides", image: "Nachorizo.jpg", preparationTime: 10, tags: ["chorizo", "snack"], modifiers: [], addons: [] },
    { name: "CAJUN FRIES", description: "Crispy fries with cajun seasoning", price: 130, category: "Sides", image: "", preparationTime: 8, tags: ["fries", "snack"], modifiers: [], addons: [] },
    { name: "CHICKEN WINGS", description: "Crispy chicken wings with your choice of flavor", price: 260, category: "Sides", image: "BuffaloWings12s_2.jpg", preparationTime: 20, tags: ["chicken", "popular"], modifiers: [{ name: "Size", required: true, options: [{ name: "8pcs", price: 260 }, { name: "12pcs", price: 350 }] }, { name: "Flavor", required: true, options: [{ name: "Buffalo", price: 0 }, { name: "BBQ", price: 0 }, { name: "Parmesan", price: 0 }] }], addons: [] },
    
    // ================ RICE MEALS ================
    { name: "CHICKEN WINGS RICE MEAL", description: "Chicken wings served with rice", price: 160, category: "Rice Meals", image: "Buffalowingsricemeal.jpg", preparationTime: 15, tags: ["chicken", "rice"], modifiers: [], addons: [] },
    { name: "BURGER STEAK RICE MEAL", description: "Burger patty with mushroom gravy and rice", price: 170, category: "Rice Meals", image: "", preparationTime: 15, tags: ["beef", "rice"], modifiers: [], addons: [] },
    { name: "HOMEMADE CHORIZO WITH EGG", description: "Homemade chorizo with sunny-side-up egg and rice", price: 160, category: "Rice Meals", image: "Homemadechorizo.jpg", preparationTime: 12, tags: ["chorizo", "egg"], modifiers: [], addons: [] },
    { name: "CHICKEN TOCINO WITH EGG", description: "Sweet chicken tocino with egg and rice", price: 170, category: "Rice Meals", image: "Chickentocino.jpg", preparationTime: 12, tags: ["chicken", "sweet", "egg"], modifiers: [], addons: [] },
    { name: "BACON STEAK WITH EGG", description: "Bacon steak with sunny-side-up egg and rice", price: 180, category: "Rice Meals", image: "Baconsteak.jpg", preparationTime: 12, tags: ["bacon", "egg"], modifiers: [], addons: [] },
    
    // ================ YOGURT MILKSHAKES ================
    { name: "MANGO YOGURT MILKSHAKE", description: "Creamy yogurt milkshake with mango flavor", price: 120, category: "Yogurt Milkshakes", image: "Coffee.jpg", preparationTime: 8, tags: ["dessert", "refreshing"], modifiers: [], addons: [] },
    { name: "STRAWBERRY YOGURT MILKSHAKE", description: "Creamy yogurt milkshake with strawberry flavor", price: 120, category: "Yogurt Milkshakes", image: "Coffee.jpg", preparationTime: 8, tags: ["dessert", "refreshing"], modifiers: [], addons: [] },
    { name: "BLUEBERRY YOGURT MILKSHAKE", description: "Creamy yogurt milkshake with blueberry flavor", price: 120, category: "Yogurt Milkshakes", image: "Coffee.jpg", preparationTime: 8, tags: ["dessert", "refreshing"], modifiers: [], addons: [] },
    
    // ================ COFFEE ================
    { name: "AMERICANO", description: "Classic black coffee", price: 70, category: "Coffee", image: "", preparationTime: 5, tags: ["coffee", "classic"], modifiers: [{ name: "Temperature", required: true, options: [{ name: "Hot", price: 60 }, { name: "Cold", price: 70 }] }], addons: [{ name: "Add Double Shot", price: 25 }] },
    { name: "CAFE LATTE", description: "Espresso with steamed milk", price: 100, category: "Coffee", image: "", preparationTime: 7, tags: ["coffee", "milk"], modifiers: [{ name: "Temperature", required: true, options: [{ name: "Hot", price: 90 }, { name: "Cold", price: 100 }] }], addons: [{ name: "Add Double Shot", price: 25 }] },
    { name: "CAFE MOCHA", description: "Chocolate-flavored latte", price: 100, category: "Coffee", image: "", preparationTime: 7, tags: ["coffee", "chocolate"], modifiers: [], addons: [{ name: "Add Double Shot", price: 25 }] },
    { name: "VANILLA LATTE", description: "Latte with vanilla flavor", price: 105, category: "Coffee", image: "", preparationTime: 7, tags: ["coffee", "vanilla"], modifiers: [], addons: [{ name: "Add Double Shot", price: 25 }] },
    { name: "SPANISH LATTE", description: "Latte with condensed milk", price: 105, category: "Coffee", image: "spanishlatte.jpg", preparationTime: 7, tags: ["coffee", "sweet"], modifiers: [], addons: [{ name: "Add Double Shot", price: 25 }] },
    { name: "CARAMEL LATTE", description: "Latte with caramel flavor", price: 105, category: "Coffee", image: "", preparationTime: 7, tags: ["coffee", "caramel"], modifiers: [], addons: [{ name: "Add Double Shot", price: 25 }] },
    { name: "HAZELNUT LATTE", description: "Latte with hazelnut flavor", price: 105, category: "Coffee", image: "", preparationTime: 7, tags: ["coffee", "nutty"], modifiers: [], addons: [{ name: "Add Double Shot", price: 25 }] },
    { name: "SALTED LATTE", description: "Latte with a hint of salt", price: 105, category: "Coffee", image: "", preparationTime: 7, tags: ["coffee", "salted"], modifiers: [], addons: [{ name: "Add Double Shot", price: 25 }] },
    { name: "SALTED CARAMEL LATTE", description: "Latte with salted caramel flavor", price: 110, category: "Coffee", image: "", preparationTime: 7, tags: ["coffee", "caramel", "salted"], modifiers: [], addons: [{ name: "Add Double Shot", price: 25 }] },
    { name: "COCO-FREE (COCONUT MILK LATTE)", description: "Latte made with coconut milk", price: 110, category: "Coffee", image: "", preparationTime: 7, tags: ["coffee", "dairy-free", "coconut"], modifiers: [], addons: [{ name: "Add Double Shot", price: 25 }] },
    
    // ================ COOLERS ================
    { name: "ALIMENTO SUNRISE", description: "Refreshing sunrise cooler", price: 140, category: "Coolers", image: "", preparationTime: 5, tags: ["refreshing", "non-alcoholic"], modifiers: [{ name: "Temperature", required: true, options: [{ name: "Hot", price: 75 }, { name: "Cold", price: 140 }] }], addons: [] },
    { name: "ALIMENTO CUCUMBER LEMONADE", description: "Refreshing cucumber lemonade", price: 140, category: "Coolers", image: "", preparationTime: 5, tags: ["refreshing", "non-alcoholic"], modifiers: [{ name: "Temperature", required: true, options: [{ name: "Hot", price: 75 }, { name: "Cold", price: 140 }] }], addons: [] },
    { name: "ALIMENTO ICED TEA", description: "Refreshing iced tea", price: 140, category: "Coolers", image: "", preparationTime: 5, tags: ["refreshing", "non-alcoholic"], modifiers: [{ name: "Temperature", required: true, options: [{ name: "Hot", price: 75 }, { name: "Cold", price: 140 }] }], addons: [] },
    { name: "COKE", description: "Regular Coca-Cola", price: 65, category: "Coolers", image: "", preparationTime: 2, tags: ["soda"], modifiers: [], addons: [] },
    { name: "COKE ZERO", description: "Coca-Cola Zero Sugar", price: 65, category: "Coolers", image: "", preparationTime: 2, tags: ["soda", "zero-sugar"], modifiers: [], addons: [] },
    { name: "SPRITE", description: "Lemon-lime soda", price: 65, category: "Coolers", image: "", preparationTime: 2, tags: ["soda", "lemon-lime"], modifiers: [], addons: [] },
    { name: "RITE N LITE", description: "Light and refreshing drink", price: 60, category: "Coolers", image: "", preparationTime: 2, tags: ["light", "refreshing"], modifiers: [], addons: [] }
  ];

  // Fetch menu from backend
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      setIsUsingFallbackData(false);
      try {
        const response = await fetch(`${API_BASE_URL}/api/menu`);
        
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
        setIsUsingFallbackData(true);
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
    filtered = filtered.filter(item => item.category === activeCategory);
    
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
    // Check if item has modifiers or addons
    if ((item.modifiers && item.modifiers.length > 0) || (item.addons && item.addons.length > 0)) {
      setSelectedItemForModal(item);
      setIsModifierModalOpen(true);
    } else {
      addToCartDirect(item);
    }
  };

  // Handle options button click - separate from card click
  const handleOptionsClick = (e, item) => {
    e.stopPropagation(); // Prevent card click from triggering
    setSelectedItemForModal(item);
    setIsModifierModalOpen(true);
  };

  // Handle modal close
  const handleCloseModifierModal = () => {
    setIsModifierModalOpen(false);
    setSelectedItemForModal(null);
  };

  // Handle modal add to cart
  const handleModalAddToCart = (cartItem) => {
    addToCart(cartItem);
  };

  // Get modifier and addon names for preview
  const getCustomizationPreview = (item) => {
    const preview = [];
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach(mod => {
        preview.push(`+${mod.name}`);
      });
    }
    if (item.addons && item.addons.length > 0) {
      item.addons.forEach(addon => {
        preview.push(`+${addon.name}`);
      });
    }
    return preview;
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

  // Get item quantity in cart (for card controls)
  const getItemQuantityInCart = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId || item._id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Handle quantity change directly on card
  const handleCardQuantityChange = (item, change) => {
    const currentQty = getItemQuantityInCart(item._id || item.id);
    const newQty = currentQty + change;
    
    if (newQty > 0) {
      // Find and update the item
      const updatedCart = cart.map(cartItem => 
        (cartItem.id === item._id || cartItem.id === item.id) 
          ? { ...cartItem, quantity: newQty }
          : cartItem
      );
      setCart(updatedCart);
      localStorage.setItem('portalCart', JSON.stringify(updatedCart));
    } else if (newQty === 0) {
      // Remove from cart
      const updatedCart = cart.filter(cartItem => 
        cartItem.id !== item._id && cartItem.id !== item.id
      );
      setCart(updatedCart);
      localStorage.setItem('portalCart', JSON.stringify(updatedCart));
    }
  };

  // Handle direct add to cart from card
  const handleCardAddToCart = (item, e) => {
    e.stopPropagation();
    const currentQty = getItemQuantityInCart(item._id || item.id);
    
    if (currentQty === 0) {
      // First time adding - add with quantity 1
      const newItem = {
        id: item._id || item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: 1,
        modifiers: [],
        addons: [],
        specialInstructions: ''
      };
      const updatedCart = [...cart, newItem];
      setCart(updatedCart);
      localStorage.setItem('portalCart', JSON.stringify(updatedCart));
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

  const calculateTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to the cart');
      return;
    }

    // Check if using fallback data (items without valid IDs)
    const hasInvalidItems = cart.some(item => !item.id);
    if (hasInvalidItems) {
      alert('❌ Cannot submit order: Menu data not loaded from server.\n\nPlease ensure the backend server is running:\n- Backend should be running on http://localhost:5000\n- Try refreshing the page and waiting for the menu to load');
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
      paymentMethod: paymentMethod,
      status: 'pending',
      paymentStatus: 'unpaid'
    };

    console.log('📤 Sending order to backend:', orderData);

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
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

  // Print receipt
  const handlePrintReceipt = () => {
    if (cart.length === 0) {
      alert('Cannot print receipt: Cart is empty');
      return;
    }
    
    // Generate and print receipt directly
    const currentDate = new Date();
    const orderNumber = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const formattedDate = currentDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const itemsHTML = cart.map((item) => {
      const itemTotal = ((item.price || 0) * item.quantity).toFixed(2);
      return `
        <div class="receipt-item">
          <div class="receipt-item-info">
            <div class="receipt-item-name">${item.quantity} x ${item.name}</div>
            <div class="receipt-item-meta">₱${(item.price || 0).toFixed(2)} each</div>
          </div>
          <div class="receipt-item-total">₱${itemTotal}</div>
        </div>
      `;
    }).join('');

    const logoUrl = require('../../assets/images/logo/alimentologo.png');
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: white;
            padding: 20px;
          }
          .receipt-container {
            width: 4in;
            margin: 0 auto;
            background: white;
            padding: 25px;
            border: 1px solid #ddd;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 15px;
          }
          .receipt-logo {
            width: 70px;
            height: 70px;
            margin: 0 auto 10px;
          }
          .receipt-logo img {
            width: 100%;
            height: auto;
          }
          .receipt-restaurant-name {
            font-size: 22px;
            font-weight: 700;
            color: #333;
            margin-bottom: 5px;
          }
          .receipt-address {
            font-size: 11px;
            color: #666;
            line-height: 1.5;
          }
          .receipt-order-info {
            background: #f9f9f9;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 12px;
          }
          .receipt-info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
          }
          .receipt-info-row:last-child {
            margin-bottom: 0;
          }
          .receipt-info-label {
            font-weight: 600;
            color: #333;
          }
          .receipt-info-value {
            color: #666;
          }
          .receipt-items {
            margin: 20px 0;
          }
          .receipt-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
            font-size: 12px;
          }
          .receipt-item:last-child {
            border-bottom: none;
          }
          .receipt-item-info {
            flex: 1;
          }
          .receipt-item-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 3px;
          }
          .receipt-item-meta {
            font-size: 11px;
            color: #999;
          }
          .receipt-item-total {
            font-weight: 600;
            color: #333;
            min-width: 60px;
            text-align: right;
          }
          .receipt-summary {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #ddd;
          }
          .receipt-summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
          }
          .receipt-summary-row.total {
            font-size: 16px;
            font-weight: 700;
            color: #333;
            border-top: 1px solid #ddd;
            padding-top: 8px;
            margin-top: 8px;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 2px solid #f0f0f0;
            font-size: 11px;
            color: #999;
          }
          .receipt-thank-you {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
            font-size: 13px;
          }
          .receipt-timestamp {
            font-size: 10px;
            color: #ccc;
            margin-top: 10px;
          }
          @media print {
            body { width: 4in; margin: 0; padding: 0; }
            .receipt-container { width: 4in; margin: 0; padding: 20px; border: none; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <div class="receipt-logo">
              <img src="${logoUrl}" alt="Alimento">
            </div>
            <div class="receipt-restaurant-name">ALIMENTO</div>
            <div class="receipt-address">
              GF, JYC Bldg., CL Ledesma Ave.<br>
              National Highway, San Carlos City
            </div>
          </div>

          <div class="receipt-order-info">
            <div class="receipt-info-row">
              <span class="receipt-info-label">Order #</span>
              <span class="receipt-info-value">${orderNumber}</span>
            </div>
            <div class="receipt-info-row">
              <span class="receipt-info-label">Date</span>
              <span class="receipt-info-value">${formattedDate}</span>
            </div>
            <div class="receipt-info-row">
              <span class="receipt-info-label">Time</span>
              <span class="receipt-info-value">${formattedTime}</span>
            </div>
            <div class="receipt-info-row">
              <span class="receipt-info-label">Type</span>
              <span class="receipt-info-value">${orderType}${tableNumber ? ` - Table #${tableNumber}` : ''}</span>
            </div>
            ${customerName ? `
            <div class="receipt-info-row">
              <span class="receipt-info-label">Customer</span>
              <span class="receipt-info-value">${customerName}</span>
            </div>
            ` : ''}
          </div>

          <div class="receipt-items">
            ${itemsHTML}
          </div>

          <div class="receipt-summary">
            <div class="receipt-summary-row">
              <span>Subtotal</span>
              <span>₱${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div class="receipt-summary-row">
              <span>Tax (12%)</span>
              <span>₱${calculateTax().toFixed(2)}</span>
            </div>
            <div class="receipt-summary-row total">
              <span>Total</span>
              <span>₱${calculateTotal().toFixed(2)}</span>
            </div>
            <div class="receipt-summary-row">
              <span>Payment</span>
              <span>${paymentMethod.toUpperCase()}</span>
            </div>
          </div>

          <div class="receipt-footer">
            <div class="receipt-thank-you">Thank You!</div>
            <div>Come back soon</div>
            <div class="receipt-timestamp">${currentDate.toLocaleString()}</div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '', 'height=900,width=500');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  // Place order (calls handleSubmitOrder)
  const handlePlaceOrder = () => {
    handleSubmitOrder();
  };

  // Get image source
  // Use the utility function for all image lookups
  const getImageSource = (imageName) => {
    const source = getFoodImage(imageName);
    if (imageName) {
      console.log(`Image: ${imageName} -> ${source}`);
    }
    return source;
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
      {/* Warning banner if using fallback data */}
      {isUsingFallbackData && (
        <div style={{
          backgroundColor: '#FF6B6B',
          color: 'white',
          padding: '12px',
          textAlign: 'center',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          ⚠️ Backend server not connected! Using demo data. Orders cannot be submitted. Please ensure the backend server is running on http://localhost:5000
        </div>
      )}
      
      {/* Header */}
      <div className="pos-header">
        <div className="header-left">
          <h1>
            <img src={logoImg} alt="Alimento" className="header-logo" style={{ height: '40px', marginRight: '10px' }} />
            Alimento POS
          </h1>
          <div className="header-stats">
            <span className="stat-item">
              ₱{calculateTotal().toFixed(2)}
            </span>
          </div>
        </div>

        {/* Search Bar in Center */}
        <div className="header-search">
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
            // Show items in grid for selected category
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
                        backgroundImage: item.image ? `url(${getImageSource(item.image)})` : 'none',
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
                  </div>
                  
                  <div className="item-details">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description}</p>
                    
                    <div className="item-footer">
                      <span className="item-price">₱{item.price.toFixed(2)}</span>
                      
                      {getItemQuantityInCart(item._id || item.id) > 0 ? (
                        <div className="quantity-control-card" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="qty-btn-card"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardQuantityChange(item, -1);
                            }}
                          >
                            −
                          </button>
                          <span className="qty-display-card">
                            {getItemQuantityInCart(item._id || item.id)}
                          </span>
                          <button 
                            className="qty-btn-card"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardQuantityChange(item, 1);
                            }}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="add-to-cart-btn"
                          onClick={(e) => handleCardAddToCart(item, e)}
                        >
                          <FaPlus /> Add
                        </button>
                      )}
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

              <div className="cart-actions">
                <div className="payment-method-selector">
                  <button
                    type="button"
                    className={`payment-tab ${paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    className={`payment-tab ${paymentMethod === 'online' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('online')}
                  >
                    GCash
                  </button>
                </div>
                <button 
                  onClick={handlePrintReceipt}
                  className="print-receipt-btn"
                >
                  <FaPrint /> Print Receipt
                </button>
                <button 
                  onClick={handlePlaceOrder}
                  className="place-order-btn"
                >
                  <FaCheck /> Place Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ModifierModal 
        item={selectedItemForModal}
        isOpen={isModifierModalOpen}
        onClose={handleCloseModifierModal}
        onAddToCart={handleModalAddToCart}
      />
    </div>
  );
}

export default PosSystem;
