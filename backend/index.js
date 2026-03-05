const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-memory storage for orders (temporary - replace with database later)
let orders = [];

// Check if src/routes/menuRoutes exists, otherwise use inline routes
let menuRoutes;
try {
    menuRoutes = require('./src/routes/menuRoutes');
    app.use('/api/menu', menuRoutes);
    console.log('✅ Using external menu routes');
} catch (error) {
    console.log('⚠️  Using inline menu routes (src/routes/menuRoutes not found)');
    
    // Inline menu routes
    app.get('/api/menu', (req, res) => {
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
}

// ==================== ORDER ROUTES ====================

// GET all orders with summaries (for dashboard)
app.get('/api/orders', (req, res) => {
    try {
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const today = new Date().toISOString().split('T')[0];
        
        const todayOrders = orders.filter(order => 
            order.timestamp && order.timestamp.includes(today)
        );
        const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        // Get top items
        const itemCounts = {};
        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    const key = item.name || `Item-${item.id}`;
                    itemCounts[key] = (itemCounts[key] || 0) + (item.quantity || 1);
                });
            }
        });

        const topItems = Object.entries(itemCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                orders: orders,
                summary: {
                    totalOrders: orders.length,
                    totalRevenue: totalRevenue,
                    todayOrders: todayOrders.length,
                    todayRevenue: todayRevenue,
                    averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
                },
                topItems: topItems
            }
        });
    } catch (error) {
        console.error('❌ Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
});

// POST create new order (from POS)
app.post('/api/orders', (req, res) => {
    try {
        const orderData = req.body;
        
        // Validate required fields
        if (!orderData.items || orderData.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Order must contain items'
            });
        }

        // Validate total calculation
        if (!orderData.total || orderData.total <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order total'
            });
        }

        // Generate order ID and timestamp
        const orderId = Date.now();
        const timestamp = new Date().toISOString();
        
        const completeOrder = {
            id: orderId,
            ...orderData,
            timestamp: timestamp,
            status: 'completed',
            orderNumber: `ORD-${orderId.toString().slice(-6)}`
        };

        // Save order to memory
        orders.push(completeOrder);

        console.log(`📦 Order #${completeOrder.orderNumber} saved:`);
        console.log(`   Table: ${completeOrder.tableNumber || 'N/A'}`);
        console.log(`   Total: ₱${completeOrder.total?.toFixed(2)}`);
        console.log(`   Items: ${completeOrder.items?.length || 0}`);
        
        res.status(201).json({
            success: true,
            message: 'Order saved successfully',
            data: {
                orderId: orderId,
                orderNumber: completeOrder.orderNumber,
                total: completeOrder.total,
                timestamp: timestamp
            }
        });

    } catch (error) {
        console.error('❌ Order save error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save order'
        });
    }
});

// GET today's orders for dashboard
app.get('/api/orders/today', (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(order => 
            order.timestamp && order.timestamp.includes(today)
        );

        const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        // Get top items for today
        const itemCounts = {};
        todayOrders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    const key = item.name || `Item-${item.id}`;
                    itemCounts[key] = (itemCounts[key] || 0) + (item.quantity || 1);
                });
            }
        });

        const topItems = Object.entries(itemCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                orders: todayOrders,
                summary: {
                    count: todayOrders.length,
                    revenue: todayRevenue,
                    averageOrder: todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0
                },
                topItems: topItems
            }
        });
    } catch (error) {
        console.error('❌ Error fetching today\'s orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch today\'s orders'
        });
    }
});

// GET order analytics with date range
app.get('/api/orders/analytics', (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let filteredOrders = [...orders];

        if (startDate && endDate) {
            filteredOrders = orders.filter(order => {
                const orderDate = order.timestamp?.split('T')[0];
                return orderDate >= startDate && orderDate <= endDate;
            });
        }

        // Calculate revenue by day
        const revenueByDay = {};
        const ordersByDay = {};
        
        filteredOrders.forEach(order => {
            const date = order.timestamp?.split('T')[0];
            if (date) {
                revenueByDay[date] = (revenueByDay[date] || 0) + (order.total || 0);
                ordersByDay[date] = (ordersByDay[date] || 0) + 1;
            }
        });

        // Sort dates chronologically
        const sortedDates = Object.keys(revenueByDay).sort();
        const orderTrend = sortedDates.map(date => ({
            date,
            revenue: revenueByDay[date],
            orders: ordersByDay[date] || 0
        }));

        res.json({
            success: true,
            data: {
                totalOrders: filteredOrders.length,
                totalRevenue: filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0),
                revenueByDay: revenueByDay,
                orderTrend: orderTrend
            }
        });
    } catch (error) {
        console.error('❌ Analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics'
        });
    }
});

// DELETE an order (optional - for testing)
app.delete('/api/orders/:id', (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const initialLength = orders.length;
        
        orders = orders.filter(order => order.id !== orderId);
        
        if (orders.length < initialLength) {
            res.json({
                success: true,
                message: `Order ${orderId} deleted`
            });
        } else {
            res.status(404).json({
                success: false,
                error: `Order ${orderId} not found`
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete order'
        });
    }
});

// GET single order by ID
app.get('/api/orders/:id', (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const order = orders.find(o => o.id === orderId);
        
        if (order) {
            res.json({
                success: true,
                data: order
            });
        } else {
            res.status(404).json({
                success: false,
                error: `Order ${orderId} not found`
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order'
        });
    }
});

// Basic route for testing
app.get('/', (req, res) => {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(order => order.timestamp && order.timestamp.includes(today));
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    res.json({ 
        message: 'Alimento Resto API is running!',
        status: 'OK',
        timestamp: new Date().toISOString(),
        stats: {
            totalOrders: orders.length,
            totalRevenue: totalRevenue,
            todayOrders: todayOrders.length,
            todayRevenue: todayRevenue
        },
        endpoints: {
            home: 'GET /',
            menu: 'GET /api/menu',
            orders: {
                all: 'GET /api/orders',
                create: 'POST /api/orders',
                today: 'GET /api/orders/today',
                analytics: 'GET /api/orders/analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD',
                single: 'GET /api/orders/:id',
                delete: 'DELETE /api/orders/:id'
            },
            sample: 'GET /api/menu/sample'
        }
    });
});

// Sample menu data endpoint (fallback)
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n=======================================`);
    console.log(`🚀 Alimento Resto API Server Started`);
    console.log(`=======================================`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📦 Order Storage: In-memory (${orders.length} orders)`);
    console.log(`\n🔗 Available Endpoints:`);
    console.log(`   • Home: http://localhost:${PORT}/`);
    console.log(`   • Health: http://localhost:${PORT}/health`);
    console.log(`   • Menu: http://localhost:${PORT}/api/menu`);
    console.log(`   • Orders: http://localhost:${PORT}/api/orders`);
    console.log(`   • Today's Orders: http://localhost:${PORT}/api/orders/today`);
    console.log(`   • Sample Menu: http://localhost:${PORT}/api/menu/sample`);
    console.log(`\n💡 Tip: Use POST /api/orders from your POS to save orders`);
    console.log(`=======================================\n`);
});