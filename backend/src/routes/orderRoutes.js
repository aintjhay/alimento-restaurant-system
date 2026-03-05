const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// POST - Create new order
router.post('/', async (req, res) => {
    try {
        // Generate orderNumber if not provided
        let orderNumber = req.body.orderNumber;
        if (!orderNumber) {
            const lastOrder = await Order.findOne().sort({ createdAt: -1 });
            const nextNumber = lastOrder ? parseInt(lastOrder.orderNumber?.replace(/\D/g, '') || 0) + 1 : 1;
            orderNumber = `ORD-${String(nextNumber).padStart(5, '0')}`;
        }

        const resolvedPaymentStatus = req.body.paymentStatus ||
            (req.body.paymentMethod === 'gcash' ? 'payment_pending_verification' : 'unpaid');

        const orderData = {
            ...req.body,
            orderNumber: orderNumber,
            status: 'pending',
            paymentStatus: resolvedPaymentStatus
        };

        if (resolvedPaymentStatus === 'payment_verified') {
            orderData.paymentVerifiedAt = new Date();
        }

        const order = new Order(orderData);
        
        // Debug logging
        console.log(`\n📝 ORDER CREATION DEBUG:`);
        console.log(`  Order Number: ${orderNumber}`);
        console.log(`  Customer Name: ${order.customerName}`);
        console.log(`  Customer Email: ${order.customerEmail}`);
        console.log(`  Delivery Type: ${order.deliveryType}`);
        console.log(`  Payload UserId Type: ${typeof req.body.userId}`);
        console.log(`  Payload UserId Value: ${req.body.userId || 'UNDEFINED/NULL'}`);
        console.log(`  Order.userId (before save): ${order.userId || 'UNDEFINED/NULL'}`);
        
        await order.save();
        
        console.log(`  Order.userId (after save): ${order.userId || 'UNDEFINED/NULL'}`);
        console.log(`✅ Order created: ${order.orderNumber} for Table ${order.tableNumber}${order.userId ? ` [UserId: ${order.userId}]` : ' [GUEST - NO USERID]'}\n`);
        
        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            order: order
        });
    } catch (error) {
        console.error('❌ Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
});

// GET - All orders (for dashboard)
router.get('/', async (req, res) => {
    try {
        const { status, startDate, endDate, limit = 50 } = req.query;
        
        let query = {};
        
        if (status) {
            query.status = status;
        }
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();
        
        // Calculate dashboard stats
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        
        res.json({
            success: true,
            orders: orders,
            stats: {
                totalRevenue,
                totalOrders,
                pendingOrders,
                averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
            }
        });
    } catch (error) {
        console.error('❌ Fetch orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

// GET - Orders for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false,
                error: 'User ID is required' 
            });
        }
        
        console.log(`\n🔍 FETCHING ORDERS FOR USER:`);
        console.log(`  Requested UserId: ${userId}`);
        console.log(`  UserId Type: ${typeof userId}`);
        
        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate('items.menuItemId', 'name price');
        
        console.log(`  Found: ${orders.length} orders`);
        if (orders.length > 0) {
            console.log(`  Sample order userId: ${orders[0].userId} (type: ${typeof orders[0].userId})`);
        }
        
        // Additional debug: check what's actually in DB
        const allOrdersCount = await Order.countDocuments();
        const ordersWithUserIdCount = await Order.countDocuments({ userId: { $exists: true, $ne: null } });
        console.log(`  Total orders in DB: ${allOrdersCount}, With userId: ${ordersWithUserIdCount}\n`);
        
        res.json({
            success: true,
            orders: orders
        });
    } catch (error) {
        console.error('❌ Fetch user orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user orders',
            error: error.message
        });
    }
});

// GET - Today's orders and revenue
router.get('/today', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysOrders = await Order.find({
            createdAt: { $gte: today, $lt: tomorrow }
        }).sort({ createdAt: -1 });

        const todaysRevenue = todaysOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const activeTables = [...new Set(todaysOrders.map(order => order.tableNumber))];

        res.json({
            success: true,
            todaysOrders: todaysOrders,
            todaysStats: {
                revenue: todaysRevenue,
                orderCount: todaysOrders.length,
                activeTables: activeTables.length,
                averageOrderValue: todaysOrders.length > 0 ? todaysRevenue / todaysOrders.length : 0
            }
        });
    } catch (error) {
        console.error('❌ Today orders error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET - Top selling items
router.get('/top-items', async (req, res) => {
    try {
        const orders = await Order.find({})
            .select('items')
            .lean();

        const itemSales = {};
        
        orders.forEach(order => {
            order.items.forEach(item => {
                const key = item.name;
                if (!itemSales[key]) {
                    itemSales[key] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                itemSales[key].quantity += item.quantity;
                itemSales[key].revenue += item.price * item.quantity;
            });
        });

        const topItems = Object.values(itemSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        res.json({
            success: true,
            topItems: topItems
        });
    } catch (error) {
        console.error('❌ Top items error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH - Update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentStatus } = req.body;

        const update = { updatedAt: new Date() };
        if (status) update.status = status;
        if (paymentStatus) {
            update.paymentStatus = paymentStatus;
            if (paymentStatus === 'payment_verified') {
                update.paymentVerifiedAt = new Date();
            }
        }

        const order = await Order.findByIdAndUpdate(
            id,
            update,
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            order: order
        });
    } catch (error) {
        console.error('❌ Update status error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT - Update order (alternative endpoint for updating status)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentStatus } = req.body;

        const update = { updatedAt: new Date() };
        if (status) update.status = status;
        if (paymentStatus) {
            update.paymentStatus = paymentStatus;
            if (paymentStatus === 'payment_verified') {
                update.paymentVerifiedAt = new Date();
            }
        }

        const order = await Order.findByIdAndUpdate(
            id,
            update,
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        console.log(`✅ Order ${id} status updated to ${status}`);

        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            order: order
        });
    } catch (error) {
        console.error('❌ Update order error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update order',
            error: error.message 
        });
    }
});

// ==================== EXPORT ROUTES ====================

// GET - Export orders to CSV
router.get('/export/csv', async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        
        let query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        if (status) query.status = status;
        
        const orders = await Order.find(query).sort({ createdAt: -1 });
        
        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No orders found for export'
            });
        }

        const { exportOrdersToCSV } = require('../utils/exportUtils');
        const csv = exportOrdersToCSV(orders);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('❌ CSV export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export orders to CSV',
            error: error.message
        });
    }
});

// GET - Export orders to PDF
router.get('/export/pdf', async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        
        let query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        if (status) query.status = status;
        
        const orders = await Order.find(query).sort({ createdAt: -1 });
        
        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No orders found for export'
            });
        }

        const { exportOrdersToPDF } = require('../utils/exportUtils');
        const pdfBuffer = exportOrdersToPDF(orders);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error('❌ PDF export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export orders to PDF',
            error: error.message
        });
    }
});

// GET - Export sales summary to CSV
router.get('/export/summary/csv', async (req, res) => {
    try {
        const { period = 'day', startDate, endDate } = req.query;
        
        let query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        
        const orders = await Order.find(query).sort({ createdAt: -1 });
        
        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No orders found for summary export'
            });
        }

        const { exportSummaryToCSV } = require('../utils/exportUtils');
        const csv = exportSummaryToCSV(orders, period);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sales-summary-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('❌ Summary export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export sales summary',
            error: error.message
        });
    }
});

// GET - Debug: Check last orders and userId status
router.get('/debug/last-orders', async (req, res) => {
    try {
        const lastOrders = await Order.find().sort({ createdAt: -1 }).limit(10).lean();
        
        const report = lastOrders.map(order => ({
            orderNumber: order.orderNumber,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            userId: order.userId || 'NULL',
            deliveryType: order.deliveryType,
            status: order.status,
            createdAt: order.createdAt
        }));

        res.json({
            success: true,
            totalOrdersInDB: await Order.countDocuments(),
            ordersWithUserId: await Order.countDocuments({ userId: { $exists: true, $ne: null } }),
            ordersWithoutUserId: await Order.countDocuments({ userId: { $exists: false } }),
            lastOrders: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET - Debug: Check a specific user's orders
router.get('/debug/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const User = require('../models/User');
        
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.json({
                success: false,
                message: 'User not found',
                searchEmail: email.toLowerCase()
            });
        }

        // Find orders by userId
        const ordersByUserId = await Order.find({ userId: user._id }).lean();
        
        // Find orders by email
        const ordersByEmail = await Order.find({ customerEmail: email.toLowerCase() }).lean();

        res.json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            },
            ordersByUserId: ordersByUserId.length,
            ordersByEmail: ordersByEmail.length,
            ordersByUserIdDetails: ordersByUserId.map(o => ({
                orderNumber: o.orderNumber,
                userId: o.userId,
                customerEmail: o.customerEmail,
                createdAt: o.createdAt
            })),
            ordersByEmailDetails: ordersByEmail.map(o => ({
                orderNumber: o.orderNumber,
                userId: o.userId || 'NULL',
                customerEmail: o.customerEmail,
                createdAt: o.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST - Migrate old orders to link with registered users (Admin only)
router.post('/migrate/link-users', async (req, res) => {
    try {
        const User = require('../models/User');
        
        // Find all orders without userId
        const ordersWithoutUserId = await Order.find({ userId: { $exists: false } });
        
        if (ordersWithoutUserId.length === 0) {
            return res.json({
                success: true,
                message: 'No orders to migrate',
                stats: {
                    ordersProcessed: 0,
                    ordersLinked: 0,
                    ordersSkipped: 0
                }
            });
        }

        let linkedCount = 0;
        let skippedCount = 0;

        // Process each order
        for (const order of ordersWithoutUserId) {
            // Skip if no customerEmail
            if (!order.customerEmail) {
                skippedCount++;
                continue;
            }

            // Find user with matching email
            const user = await User.findOne({ email: order.customerEmail.toLowerCase() });
            
            if (user) {
                // Link the order to the user
                order.userId = user._id;
                await order.save();
                linkedCount++;
            } else {
                skippedCount++;
            }
        }

        res.json({
            success: true,
            message: `Migration complete! Linked ${linkedCount} orders to registered users.`,
            stats: {
                ordersProcessed: ordersWithoutUserId.length,
                ordersLinked: linkedCount,
                ordersSkipped: skippedCount
            }
        });
    } catch (error) {
        console.error('❌ Migration error:', error);
        res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: error.message
        });
    }
});

module.exports = router;

