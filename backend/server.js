const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes - Updated paths to src/routes/
app.use('/api/menu', require('./src/routes/menuRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ 
        message: 'Alimento Resto API is running!',
        status: 'OK',
        timestamp: new Date().toISOString(),
        endpoints: {
            menu: '/api/menu',
            orders: '/api/orders',
            sample: '/api/menu/sample'
        }
    });
});

// Sample menu data endpoint for initial setup
app.get('/api/menu/sample', (req, res) => {
    const sampleMenu = [
        { id: 1, code: "PAS-001", name: "CHORIZO JALAPENO", price: 200, category: "Pasta", is_available: true },
        { id: 2, code: "PAS-002", name: "CLASSIC CARBONARA", price: 220, category: "Pasta", is_available: true },
        { id: 3, code: "SAN-001", name: "THICK CUT BACON", price: 180, category: "Sandwich", is_available: true },
        { id: 4, code: "COC-001", name: "TEQUILA SUNRISE", price: 120, category: "Cocktail", is_available: true },
        { id: 5, code: "COC-002", name: "MOJITO", price: 120, category: "Cocktail", is_available: true },
        { id: 6, code: "SID-001", name: "NACHORIZO", price: 190, category: "Side", is_available: true }
    ];
    res.json(sampleMenu);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Sample data: http://localhost:${PORT}/api/menu/sample`);
});
