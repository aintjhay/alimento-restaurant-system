const MenuItem = require('../models/MenuItem');
const ProductCategory = require('../models/ProductCategory');

// Safe to repeat on deployment: preserve managed names, order and inactive status.
async function syncProductCategories(menuItems = MenuItem, categories = ProductCategory) {
  const names = (await menuItems.distinct('category', { deletedAt: null }))
    .filter(name => typeof name === 'string' && name.trim()).sort();
  for (const [index, name] of names.entries()) {
    const category = await categories.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, displayOrder: index, isActive: true } },
      { new: true, upsert: true }
    );
    await menuItems.updateMany(
      { category: name, categoryId: { $ne: category._id }, deletedAt: null },
      { $set: { categoryId: category._id } }
    );
  }
  return names.length;
}

module.exports = syncProductCategories;
