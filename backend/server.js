const express = require('express');
const cors = require('cors');  // <-- ADD THIS LINE
const app = express();
const port = 5000;

app.use(cors());               // <-- ADD THIS LINE
app.use(express.json());

// 1. TEST ENDPOINT (Already works!)
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Alimento Restaurant Management System',
        status: 'API is fully operational',
        version: '1.0',
        time: new Date().toLocaleTimeString()
    });
});

// 2. MENU ENDPOINT (Critical for POS & Portal)
app.get('/api/menu', (req, res) => {
    const menuItems = [
        { id: 1, name: 'CHORIZO JALAPENO', price: 200, category: 'Pasta', available: true },
        { id: 2, name: 'CLASSIC CARBONARA', price: 220, category: 'Pasta', available: true },
        { id: 3, name: 'THICK CUT BACON', price: 180, category: 'Sandwich', available: true },
        { id: 4, name: 'TEQUILA SUNRISE', price: 120, category: 'Cocktail', available: true },
        { id: 5, name: 'MOJITO', price: 120, category: 'Cocktail', available: true },
        { id: 6, name: 'NACHORIZO', price: 190, category: 'Side', available: true }
    ];
    res.json(menuItems);
});

// 3. ORDER ENDPOINT (Simulates POS/Portal integration)
app.post('/api/orders', (req, res) => {
    const { customer_name, items } = req.body;
    
    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'No items in order' });
    }
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Simulate order creation
    const orderResponse = {
        message: 'Order successfully placed!',
        order_number: 'ORD' + Date.now(),
        customer_name: customer_name || 'Walk-in Customer',
        total: total,
        items: items,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    res.json(orderResponse);
});

// 4. ORDERS LIST (For Admin Dashboard)
app.get('/api/orders', (req, res) => {
    const sampleOrders = [
        { id: 1, order_number: 'ORD123', customer_name: 'Juan Dela Cruz', total: 420, status: 'completed', time: '2:30 PM' },
        { id: 2, order_number: 'ORD124', customer_name: 'Maria Santos', total: 340, status: 'preparing', time: '3:15 PM' },
        { id: 3, order_number: 'ORD125', customer_name: 'Online Order', total: 560, status: 'pending', time: '3:45 PM' }
    ];
    res.json(sampleOrders);
});

// 5. DEMO FORECAST DATA (For ML Dashboard)
app.get('/api/forecast', (req, res) => {
    const forecastData = {
        message: 'Machine Learning Demand Forecasting Preview',
        predicted_sales_tomorrow: 12540,
        top_items: [
            { name: 'CHORIZO JALAPENO', predicted_qty: 42 },
            { name: 'TEQUILA SUNRISE', predicted_qty: 38 },
            { name: 'CLASSIC CARBONARA', predicted_qty: 31 }
        ],
        note: 'Based on historical sales data using Linear Regression model'
    };
    res.json(forecastData);
});

app.listen(port, () => {
    console.log(`✅ Alimento Backend Server running at http://localhost:${port}`);
    console.log(`🔗 Available Endpoints:`);
    console.log(`   GET  http://localhost:${port}/api/test`);
    console.log(`   GET  http://localhost:${port}/api/menu`);
    console.log(`   POST http://localhost:${port}/api/orders`);
    console.log(`   GET  http://localhost:${port}/api/orders`);
    console.log(`   GET  http://localhost:${port}/api/forecast`);
});
