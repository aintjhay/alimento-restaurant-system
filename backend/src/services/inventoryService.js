const Inventory = require('../models/Inventory');
const { initializeBatches } = require('./stockBatches');

async function restoreProductStock(deductions, session) {
  for (const entry of deductions) {
    if (!entry.batches?.length) throw new Error('This legacy stock deduction has no batch details. Reconcile inventory before restoring it.');
    const increments = { currentStock: entry.quantity, __v: 1 };
    const filters = [];
    (entry.batches || []).forEach((batch, index) => {
      increments[`batches.$[b${index}].quantity`] = batch.quantity;
      filters.push({ [`b${index}._id`]: batch.batchId });
    });
    const result = await Inventory.updateOne({ _id: entry.inventoryId }, { $inc: increments }, { session, ...(filters.length ? { arrayFilters: filters } : {}) });
    if (!result.matchedCount) throw new Error('Original inventory record is missing; reconcile stock before cancelling.');
  }
}
async function deductProductStock(items, session, orderId, actor = 'customer') {
  const deductions = [];
  try {
    for (const item of items) {
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) throw new Error('Invalid order quantity');
      const stock = await Inventory.findOne({ productId: item.menuItemId, isActive: true }).session(session);
      if (!stock) continue;
      initializeBatches(stock);
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
      const available = [...stock.batches].filter(batch => !batch.expiryDate || new Date(batch.expiryDate).toISOString().slice(0, 10) >= today)
        .sort((a, b) => (a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity) - (b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity));
      if (available.reduce((sum, batch) => sum + batch.quantity, 0) < item.quantity) throw new Error(`Insufficient unexpired stock for ${item.name}`);
      let remaining = item.quantity;
      const batches = [];
      for (const batch of available) {
        const quantity = Math.min(batch.quantity, remaining);
        if (quantity) batches.push({ batchId: batch._id, quantity });
        batch.quantity -= quantity;
        remaining -= quantity;
      }
      stock.currentStock -= item.quantity;
      await stock.save({ session });
      deductions.push({ inventoryId: stock._id, productId: item.menuItemId, quantity: item.quantity, batches });
      await require('../models/StockMovement').create([{ inventoryId: stock._id, orderId, quantity: -item.quantity, batches, kind: 'sale', actor }], { session });
    }
    return deductions;
  } catch (error) {
    if (!session) await restoreProductStock(deductions);
    throw error;
  }
}
module.exports = { deductProductStock, restoreProductStock };
