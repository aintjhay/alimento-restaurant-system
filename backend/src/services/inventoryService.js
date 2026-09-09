const Inventory = require('../models/Inventory');

async function deductProductStock(items) {
  const deductions = [];
  try {
    for (const item of items) {
      const stock = await Inventory.findOneAndUpdate(
        { productId: item.menuItemId, isActive: true, currentStock: { $gte: item.quantity } },
        { $inc: { currentStock: -item.quantity }, $set: { updatedAt: new Date() } },
        { new: true }
      );
      // Products without a linked inventory record are not stock-tracked yet.
      if (!stock) {
        const linked = await Inventory.exists({ productId: item.menuItemId, isActive: true });
        if (linked) throw new Error(`Insufficient stock for ${item.name}`);
        continue;
      }
      deductions.push({ inventoryId: stock._id, productId: item.menuItemId, quantity: item.quantity });
    }
    return deductions;
  } catch (error) {
    await Promise.all(deductions.map(entry => Inventory.updateOne(
      { _id: entry.inventoryId }, { $inc: { currentStock: entry.quantity } }
    )));
    throw error;
  }
}

module.exports = { deductProductStock };
