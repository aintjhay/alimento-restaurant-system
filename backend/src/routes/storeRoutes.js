const router = require('express').Router();
const Settings = require('../models/StoreSettings');
const MenuItem = require('../models/MenuItem');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { isOpen, priceItems, validImage } = require('../services/storeService');
router.get('/', async (_req, res) => {
  try { const settings = await Settings.current(); res.set('Cache-Control', 'no-store').json({ ...settings, isOpen: isOpen(settings) }); }
  catch { res.status(503).json({ message: 'Store settings unavailable. Please try again.' }); }
});
router.put('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const data = Object.fromEntries(['title', 'subtitle', 'coverImage', 'gcashQr', 'announcement', 'closed', 'closedDays', 'openingTime', 'closingTime', 'promotions'].filter(k => req.body[k] !== undefined).map(k => [k, req.body[k]]));
    for (const key of ['coverImage', 'gcashQr']) if (data[key] && !validImage(data[key])) throw new Error('Upload a PNG, JPEG or WebP image under 3 MB.');
    const merged = { ...await Settings.current(), ...data };
    if (merged.openingTime >= merged.closingTime) throw new Error('Closing time must be after opening time.');
    if (data.closedDays && (!Array.isArray(data.closedDays) || data.closedDays.some(d => !Number.isInteger(d) || d < 0 || d > 6))) throw new Error('Invalid closed days.');
    if (data.promotions?.length > 30) throw new Error('Use at most 30 promotions.');
    for (const p of data.promotions || []) if (p.startsAt && p.endsAt && new Date(p.startsAt) >= new Date(p.endsAt)) throw new Error('Promotion end must be after its start.');
    const scheduleChanged = ['closed', 'closedDays', 'openingTime', 'closingTime'].some(key => data[key] !== undefined);
    const update = { $set: data };
    if (scheduleChanged) update.$push = { scheduleHistory: { effectiveAt: new Date(), closed: merged.closed, closedDays: merged.closedDays, openingTime: merged.openingTime, closingTime: merged.closingTime } };
    const settings = await Settings.findOneAndUpdate({ key: 'store' }, update, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    res.json({ ...settings.toObject(), isOpen: isOpen(settings) });
  } catch (error) { res.status(400).json({ message: error.message }); }
});
router.post('/quote', async (req, res) => {
  try {
    const settings = await Settings.current();
    const items = req.body.items;
    if (!Array.isArray(items)) throw new Error('Invalid items.');
    const products = await MenuItem.find({ _id: { $in: items.map(i => i.menuItemId) } }).lean();
    res.json(priceItems(items, products, settings, req.body.channel === 'pos' ? 'pos' : 'portal'));
  } catch (error) { res.status(400).json({ message: error.message }); }
});
module.exports = router;
