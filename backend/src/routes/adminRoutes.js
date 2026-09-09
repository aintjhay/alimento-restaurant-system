const express = require('express');
const MenuItem = require('../models/MenuItem');
const ProductCategory = require('../models/ProductCategory');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware, requireRole('admin'));

const pageDetails = (page, totalItems, pageSize = 8) => ({
  page,
  pageSize,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  hasPreviousPage: page > 1,
  hasNextPage: page * pageSize < totalItems
});

router.get('/products', async (req, res) => {
  try {
    const pageSize = 8;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.search?.trim()) query.name = { $regex: req.query.search.trim(), $options: 'i' };
    const totalItems = await MenuItem.countDocuments(query);
    const products = await MenuItem.find(query).sort({ displayOrder: 1, name: 1 })
      .skip((page - 1) * pageSize).limit(pageSize).lean();
    const stocks = await Inventory.find({ productId: { $in: products.map(product => product._id) } }).lean();
    const stockByProduct = new Map(stocks.map(stock => [String(stock.productId), stock]));
    res.json({ success: true, data: products.map(product => ({ ...product, stock: stockByProduct.get(String(product._id)) || null })), pagination: pageDetails(page, totalItems) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const product = await MenuItem.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/product-options', async (_req, res) => {
  const products = await MenuItem.find().select('name category').sort({ name: 1 }).lean();
  res.json({ success: true, data: products });
});

router.put('/products/:id', async (req, res) => {
  try {
    const product = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await MenuItem.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await Inventory.deleteMany({ productId: product._id });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/categories', async (_req, res) => {
  const categories = await ProductCategory.find().sort({ displayOrder: 1, name: 1 });
  res.json({ success: true, data: categories });
});

router.post('/categories', async (req, res) => {
  try {
    const category = await ProductCategory.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const existing = await ProductCategory.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Category not found' });
    const oldName = existing.name;
    Object.assign(existing, req.body);
    await existing.save();
    if (req.body.name && req.body.name !== oldName) {
      await MenuItem.updateMany({ category: oldName }, { $set: { category: existing.name, categoryId: existing._id } });
    }
    res.json({ success: true, data: existing });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  const category = await ProductCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  const productCount = await MenuItem.countDocuments({ $or: [{ categoryId: category._id }, { category: category.name }] });
  if (productCount) return res.status(409).json({ success: false, message: 'Move or delete products in this category first' });
  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});

router.get('/sales', async (req, res) => {
  const { salesRange, summarizeSales } = require('../services/salesReportService');
  let range;
  try { range = salesRange(req.query); }
  catch (error) { return res.status(400).json({ success: false, message: error.message }); }
  try {
    const match = { status: { $ne: 'cancelled' }, createdAt: { $lte: range.end } };
    if (range.start) match.createdAt.$gte = range.start;
    const orders = await Order.find(match).sort({ createdAt: -1 }).lean();
    const filter = order => {
      const status = req.query.paymentStatus;
      const statusMatches = !status || status === 'all' || (status === 'paid' ? ['paid', 'payment_verified'].includes(order.paymentStatus) : order.paymentStatus === status);
      const search = String(req.query.search || '').trim().toLowerCase();
      return statusMatches && `${order.orderNumber} ${order.customerName || 'Walk-in'}`.toLowerCase().includes(search);
    };
    const data = orders.filter(filter);
    let comparison = null;
    if (range.start && ['weekly', 'monthly'].includes(req.query.view)) {
      const previousStart = new Date(range.start);
      if (req.query.view === 'weekly') previousStart.setUTCDate(previousStart.getUTCDate() - 7);
      else {
        const localStart = new Date(previousStart.getTime() + 8 * 3600000);
        localStart.setUTCMonth(localStart.getUTCMonth() - 1);
        previousStart.setTime(localStart.getTime() - 8 * 3600000);
      }
      const previousEnd = new Date(Math.min(previousStart.getTime() + range.end.getTime() - range.start.getTime(), range.start.getTime() - 1));
      const previous = await Order.find({ status: { $ne: 'cancelled' }, createdAt: { $gte: previousStart, $lte: previousEnd } }).lean();
      comparison = { totalSales: summarizeSales(previous.filter(filter)).summary.totalSales, start: previousStart, end: previousEnd };
    }
    res.json({ success: true, data, ...summarizeSales(data), range, comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
