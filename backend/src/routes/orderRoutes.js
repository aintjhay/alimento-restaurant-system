const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { createHash } = require('crypto');
const { isValidPhPhone, PH_PHONE_MESSAGE } = require('../utils/phoneUtils');
const { deductProductStock } = require('../services/inventoryService');
const { authMiddleware, optionalAuthMiddleware, requireRole } = require('../middleware/authMiddleware');
const adminOnly = [authMiddleware, requireRole('admin', 'staff', 'cashier', 'kitchen')];
const Counter = require('../models/Counter');
const { updateOrder } = require('../services/orderLifecycle');
const publicOrder = order => { const result = order.toObject ? order.toObject() : { ...order }; for (const key of ['paymentProof', 'trackingTokenHash', 'idempotencyKey', 'requestHash', 'stockDeductions']) delete result[key]; return result; };
const hash = value => createHash('sha256').update(value).digest('hex');
const StoreSettings = require('../models/StoreSettings');
const MenuItem = require('../models/MenuItem');
const { isOpen, priceItems, validImage } = require('../services/storeService');

// POST - Create new order
router.post('/', optionalAuthMiddleware, async (req, res) => {
    try {
        if (req.user?.role === 'kitchen') return res.status(403).json({ message: 'Kitchen accounts cannot create orders.' });
        const key = req.get('Idempotency-Key');
        if (!key || !/^[a-zA-Z0-9-]{16,100}$/.test(key)) return res.status(400).json({ message: 'A valid Idempotency-Key is required.' });
        const idempotencyKey = hash(`${req.user?.userId || 'guest'}:${key}`);
        const requestHash = hash(JSON.stringify(req.body));
        // Domain-separated from the stored idempotency digest; stable across session-secret rotation.
        const trackingToken = hash(`tracking:${req.user?.userId || 'guest'}:${key}`);
        const replay = await Order.findOne({ idempotencyKey }).select('+requestHash');
        if (replay) {
            if (replay.requestHash !== requestHash) return res.status(409).json({ message: 'This checkout key was used for a different order.' });
            return res.json({ success: true, order: { ...publicOrder(replay), trackingToken } });
        }
        const portal = !['admin', 'cashier', 'staff'].includes(req.user?.role);
        if (portal && req.body.orderType !== 'Delivery') return res.status(403).json({ success: false, message: 'Please use delivery checkout.' });
        const settings = await StoreSettings.current();
        if (portal && !isOpen(settings)) return res.status(409).json({ success: false, message: 'The store is closed. Please order during opening hours.' });
        if (portal && (req.body.paymentMethod !== 'gcash' || !validImage(req.body.paymentProof))) return res.status(400).json({ success: false, message: 'Pay with GCash and upload a payment receipt (PNG, JPEG or WebP, up to 3 MB).' });
        if (portal && !settings.gcashQr) return res.status(409).json({ success: false, message: 'GCash payment is not yet configured.' });
        let quote;
        try {
            if (!Array.isArray(req.body.items)) throw new Error('Invalid items.');
            const products = await MenuItem.find({ _id: { $in: req.body.items.map(i => i.menuItemId) } }).lean();
            quote = priceItems(req.body.items, products, settings, portal ? 'portal' : 'pos');
            if (Math.abs(Number(req.body.totalAmount) - quote.totalAmount) > 0.01 || !Number.isFinite(Number(req.body.totalAmount))) return res.status(409).json({ success: false, message: 'Prices or promotions changed. Refresh your order total before paying.', quote });
        } catch (error) { return res.status(400).json({ success: false, message: error.message }); }
        if (req.body.orderType === 'Delivery' && !isValidPhPhone(req.body.customerContact)) {
            return res.status(400).json({ success: false, message: PH_PHONE_MESSAGE });
        }
        const resolvedPaymentStatus = portal || req.body.paymentMethod === 'qrph' ? 'payment_pending_verification' : req.body.paymentStatus ||
            (req.body.paymentMethod === 'gcash' ? 'payment_pending_verification' : 'unpaid');

        if (!['unpaid', 'paid', 'payment_verified', 'payment_pending_verification'].includes(resolvedPaymentStatus)) return res.status(400).json({ message: 'New orders cannot start partially paid or refunded.' });
        const orderData = {
            ...Object.fromEntries(['orderType', 'tableNumber', 'customerName', 'customerEmail', 'customerContact', 'customerAddress', 'paymentMethod', 'paymentProof'].filter(k => req.body[k] !== undefined).map(k => [k, req.body[k]])),
            ...quote,
            rating: undefined,
            ratedAt: undefined,
            paymentVerifiedAt: undefined,
            statusTimeline: [],
            notes: String(req.body.specialInstructions || req.body.notes || '').slice(0, 1000),
            idempotencyKey, requestHash,
            status: 'pending',
            paymentStatus: resolvedPaymentStatus,
            trackingTokenHash: createHash('sha256').update(trackingToken).digest('hex')
        };
        // Customer identity comes from the verified session, never a browser-generated ID.
        if (req.body.orderType === 'Delivery') {
            orderData.userId = req.user?.role === 'customer' ? req.user.userId : undefined;
            orderData.deliveryType = orderData.userId ? 'registered' : 'guest';
        }

        if (resolvedPaymentStatus === 'payment_verified') {
            orderData.paymentVerifiedAt = new Date();
        }

        const order = await require('../services/transaction')(async session => {
            const sequence = await Counter.findOneAndUpdate({ _id: 'orders-v2' }, { $inc: { value: 1 } }, { new: true, upsert: true, session });
            const order = new Order({ ...orderData, orderNumber: `ORD-V2-${String(sequence.value).padStart(8, '0')}` });
            if (['paid', 'payment_verified'].includes(order.paymentStatus)) { order.amountPaid = order.totalAmount; order.paymentTimeline.push({ amount: order.totalAmount, kind: 'payment', by: String(req.user.userId), at: new Date() }); }
            await order.validate();
            order.stockDeductions = await deductProductStock(order.items, session, order._id, String(req.user?.userId || 'guest'));
            order.stockDeductedAt = order.stockDeductions.length ? new Date() : null;
            await order.save({ session });
            return order;
        });
        res.status(201).json({ success: true, message: 'Order placed successfully!', order: { ...publicOrder(order), trackingToken } });
    } catch (error) {
        console.error('Order creation failed:', error.name);
        res.status(error.code === 11000 || error.name === 'VersionError' ? 409 : 400).json({
            success: false,
            message: error.code === 11000 ? 'Checkout already submitted. Retry with the same key.' : 'Failed to create order',
            error: error.message
        });
    }
});

// A private tracking link exposes status only, without contact or address details.
router.get('/track/:token', async (req, res) => {
    if (!/^[a-f0-9]{64}$/.test(req.params.token)) {
        return res.status(404).json({ success: false, message: 'Tracking link not found' });
    }
    try {
        const order = await Order.findOne({
            trackingTokenHash: createHash('sha256').update(req.params.token).digest('hex')
        }).select('orderNumber orderType status paymentStatus paymentMethod estimatedCompletionTime updatedAt rating').lean();
        res.set('Cache-Control', 'no-store');
        if (!order) return res.status(404).json({ success: false, message: 'Tracking link not found' });
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Unable to load order status' });
    }
});

router.post('/track/:token/rating', async (req, res) => {
    if (!/^[a-f0-9]{64}$/.test(req.params.token) || !Number.isInteger(req.body.rating) || req.body.rating < 1 || req.body.rating > 5) return res.status(400).json({ message: 'Choose 1 to 5 stars.' });
    try {
        const order = await Order.findOneAndUpdate({ trackingTokenHash: createHash('sha256').update(req.params.token).digest('hex'), status: 'completed', rating: { $exists: false } }, { $set: { rating: req.body.rating, ratedAt: new Date() } }, { new: true });
        if (!order) return res.status(409).json({ message: 'Only completed, unrated orders can be rated.' });
        res.json({ rating: order.rating });
    } catch { res.status(500).json({ message: 'Unable to save rating. Please retry.' }); }
});

router.get('/summary', authMiddleware, requireRole('admin', 'staff', 'cashier'), async (req, res) => {
  try { res.json(await require('../services/dashboardService').dashboardSummary(req.query.period)); }
  catch (error) { res.status(400).json({ message: error.message }); }
});

// GET - All orders (for dashboard)
router.post('/:id/rating', authMiddleware, async (req, res) => {
    if (!Number.isInteger(req.body.rating) || req.body.rating < 1 || req.body.rating > 5) return res.status(400).json({ message: 'Choose 1 to 5 stars.' });
    try {
        const order = await Order.findOneAndUpdate({ _id: req.params.id, userId: req.user.userId, status: 'completed', rating: { $exists: false } }, { $set: { rating: req.body.rating, ratedAt: new Date() } }, { new: true });
        if (!order) return res.status(409).json({ message: 'Only your completed, unrated orders can be rated.' });
        res.json({ rating: order.rating });
    } catch { res.status(400).json({ message: 'Unable to save rating. Please retry.' }); }
});

router.get('/', ...adminOnly, async (req, res) => {
    try {
        const { status, startDate, endDate, limit = 50, page = 1 } = req.query;
        
        let query = {};
        
        if (status) {
            query.status = status === 'active' ? { $in: ['pending', 'preparing', 'ready', 'out_for_delivery', 'served'] } : status;
        }
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        
        if (status === 'unpaid') { query.status = { $ne: 'cancelled' }; query.paymentStatus = { $in: ['unpaid', 'partially_paid', 'payment_pending_verification'] }; }
        if (req.query.period) {
            const days = { today: 0, week: 6, month: 29 }[req.query.period];
            if (days === undefined) return res.status(400).json({ message: 'Invalid period' });
            const today = require('../services/dashboardService').dayKey(new Date());
            query.createdAt = { $gte: new Date(new Date(`${today}T00:00:00+08:00`).getTime() - days * 86400000), $lte: new Date() };
        }
        if (req.user.role === 'kitchen') query.status = { $in: ['pending', 'preparing', 'ready', 'served', 'out_for_delivery'] };
        if (typeof req.query.search === 'string' && req.query.search.trim()) {
            const term = req.query.search.trim().slice(0, 100);
            const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { orderNumber: { $regex: escape(term), $options: 'i' } },
                { tableNumber: { $regex: escape(term.replace(/^table\s+/i, '')), $options: 'i' } }
            ];
        }
        const sort = req.query.sort === 'highest' ? { totalAmount: -1, _id: -1 } : { createdAt: req.query.sort === 'oldest' ? 1 : -1, _id: req.query.sort === 'oldest' ? 1 : -1 };
        const orders = await Order.find(query)
            .sort(sort)
            .select('-paymentProof -trackingTokenHash -stockDeductions -items.image')
            .skip((Math.max(1, parseInt(page) || 1) - 1) * Math.min(200, Math.max(1, parseInt(limit) || 50)))
            .limit(Math.min(200, Math.max(1, parseInt(limit) || 50)))
            .lean();
        
        // Calculate dashboard stats
        const totalRevenue = require('../services/salesReportService').summarizeSales(orders).summary.totalSales;
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        
        res.json({
            success: true,
            orders: req.user.role === 'kitchen' ? orders.map(o => ({ _id: o._id, orderNumber: o.orderNumber, orderType: o.orderType, tableNumber: o.tableNumber, items: o.items, status: o.status, createdAt: o.createdAt })) : orders,
            pagination: { page: Math.max(1, parseInt(page) || 1), total: await Order.countDocuments(query), pageSize: Math.min(200, Math.max(1, parseInt(limit) || 50)) },
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
router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        if (String(req.user.userId) !== userId) return res.status(403).json({ message: 'You can only access your own orders.' });
        
        if (!userId) {
            return res.status(400).json({ 
                success: false,
                error: 'User ID is required' 
            });
        }
        
        
        const orders = await Order.find({ userId }).select('-paymentProof -trackingTokenHash -idempotencyKey -requestHash -stockDeductions -items.image')
            .sort({ createdAt: -1 })
            .populate('items.menuItemId', 'name price');
        
        if (orders.length > 0) {
        }
        
        // Additional debug: check what's actually in DB
        const allOrdersCount = await Order.countDocuments();
        const ordersWithUserIdCount = await Order.countDocuments({ userId: { $exists: true, $ne: null } });
        
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
router.get('/today', authMiddleware, requireRole('admin', 'staff', 'cashier'), async (req, res) => {
    try {
        const today = new Date(`${require('../services/dashboardService').dayKey(new Date())}T00:00:00+08:00`);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysOrders = await Order.find({
            createdAt: { $gte: today, $lt: tomorrow }
        }).select('-paymentProof -trackingTokenHash -stockDeductions -items.image').sort({ createdAt: -1 });

        const todaysRevenue = require('../services/salesReportService').summarizeSales(todaysOrders).summary.totalSales;
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
router.get('/top-items', authMiddleware, requireRole('admin', 'staff', 'cashier'), async (req, res) => {
    try {
        const orders = await Order.find({ status: { $ne: 'cancelled' }, paymentStatus: { $in: ['paid', 'payment_verified'] } })
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

// Public, read-only status endpoint used by a customer who has the opaque order id.
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).select(
            'orderNumber status paymentStatus estimatedCompletionTime statusTimeline items.itemStatus items.itemStatusTimeline updatedAt'
        ).lean();
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(400).json({ success: false, message: 'Invalid order id' });
    }
});

const changeStatus = async (req, res) => {
    try {
      const order = await updateOrder(req.params.id, req.body, req.user);
      const result = req.user.role === 'kitchen' ? { _id: order._id, orderNumber: order.orderNumber, orderType: order.orderType, tableNumber: order.tableNumber, items: order.items, status: order.status, createdAt: order.createdAt } : publicOrder(order);
      res.json({ success: true, order: result });
    }
    catch (error) { res.status(error.status || 400).json({ success: false, message: error.message }); }
};
router.patch('/:id/status', ...adminOnly, changeStatus);
router.put('/:id', ...adminOnly, changeStatus);
router.get('/:id/receipt', authMiddleware, requireRole('admin', 'staff', 'cashier'), async (req, res) => {
    try { const order = await Order.findById(req.params.id).select('paymentProof');
      if (!order) return res.status(404).json({ message: 'Order not found' });
      res.set('Cache-Control', 'no-store').json({ paymentProof: order.paymentProof || null });
    } catch { res.status(400).json({ message: 'Invalid order' }); }
});

// ==================== EXPORT ROUTES ====================

// GET - Export orders to CSV
router.get('/export/csv', authMiddleware, requireRole('admin', 'staff', 'cashier'), async (req, res) => {
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
router.get('/export/pdf', authMiddleware, requireRole('admin', 'staff', 'cashier'), async (req, res) => {
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
router.get('/export/summary/csv', authMiddleware, requireRole('admin', 'staff', 'cashier'), async (req, res) => {
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

module.exports = router;
