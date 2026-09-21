const router = require('express').Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');
const fields = 'userName itemName rating title comment photos verified helpful createdAt';
async function refreshRating(itemId, session) {
  const [stats] = await Review.aggregate([{ $match: { menuItemId: new mongoose.Types.ObjectId(String(itemId)) } }, { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }]).session(session);
  await MenuItem.updateOne({ _id: itemId }, { $set: { averageRating: stats?.average || 0, reviewCount: stats?.count || 0 } }, { session });
}
function content(body) {
  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) throw new Error('Choose an integer rating from 1 to 5.');
  return { rating: body.rating, title: String(body.title || '').slice(0, 120), comment: String(body.comment || '').slice(0, 3000) };
}
router.get('/item/:itemId', async (req, res) => {
  try {
    const itemId = new mongoose.Types.ObjectId(req.params.itemId);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const reviews = await Review.find({ menuItemId: itemId }).select(fields).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit);
    const [stats] = await Review.aggregate([{ $match: { menuItemId: itemId } }, { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }]);
    res.json({ success: true, reviews, stats: stats || { averageRating: 0, totalReviews: 0 }, pagination: { currentPage: page, total: stats?.totalReviews || 0, pages: Math.ceil((stats?.totalReviews || 0) / limit) } });
  } catch (error) { res.status(400).json({ message: error.message }); }
});
router.get('/user/:userId', authMiddleware, async (req, res) => {
  if (String(req.user.userId) !== req.params.userId) return res.sendStatus(403);
  try { res.json({ success: true, reviews: await Review.find({ userId: req.user.userId }).select(fields).limit(100).sort({ createdAt: -1 }) }); }
  catch { res.sendStatus(400); }
});
router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = content(req.body);
    const review = await require('../services/transaction')(async session => {
      const order = await Order.findOne({ _id: req.body.orderId, userId: req.user.userId, status: 'completed', 'items.menuItemId': req.body.menuItemId }).session(session);
      if (!order) throw new Error('Only your completed purchases can be reviewed.');
      if (await Review.exists({ userId: req.user.userId, menuItemId: req.body.menuItemId }).session(session)) throw new Error('You already reviewed this item.');
      const user = await User.findById(req.user.userId).session(session);
      const item = order.items.find(i => String(i.menuItemId) === req.body.menuItemId);
      const [review] = await Review.create([{ ...data, userId: req.user.userId, userName: `${user.firstName} ${user.lastName}`, orderId: order._id, menuItemId: item.menuItemId, itemName: item.name, verified: true, reviewKey: `${req.user.userId}:${item.menuItemId}` }], { session });
      await refreshRating(item.menuItemId, session); return review;
    });
    res.status(201).json({ success: true, review });
  } catch (error) { res.status(400).json({ message: error.message }); }
});
for (const method of ['put', 'delete']) router[method]('/:reviewId', authMiddleware, async (req, res) => {
  try {
    await mongoose.connection.transaction(async session => {
      const review = await Review.findOne({ _id: req.params.reviewId, userId: req.user.userId }).session(session);
      if (!review) throw new Error('Review not found or not owned by you.');
      if (method === 'delete') await review.deleteOne({ session });
      else { Object.assign(review, content(req.body), { updatedAt: new Date() }); await review.save({ session }); }
      await refreshRating(review.menuItemId, session);
    });
    res.json({ success: true });
  } catch (error) { res.status(400).json({ message: error.message }); }
});
router.post('/:reviewId/helpful', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate({ _id: req.params.reviewId, helpfulVoters: { $ne: req.user.userId } }, { $addToSet: { helpfulVoters: req.user.userId }, $inc: { helpful: 1 } }, { new: true });
    if (!review) return res.status(409).json({ message: 'Already voted or review not found.' });
    res.json({ success: true, helpful: review.helpful });
  } catch { res.sendStatus(400); }
});
module.exports = router;
