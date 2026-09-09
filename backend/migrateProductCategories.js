require('dotenv').config();
const { connectDB } = require('./src/config/mongodb');
const MenuItem = require('./src/models/MenuItem');
const ProductCategory = require('./src/models/ProductCategory');

async function migrateProductCategories() {
  await connectDB();
  const names = await MenuItem.distinct('category');
  for (const [index, name] of names.filter(Boolean).sort().entries()) {
    const category = await ProductCategory.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, displayOrder: index, isActive: true } },
      { new: true, upsert: true }
    );
    await MenuItem.updateMany({ category: name }, { $set: { categoryId: category._id } });
  }
  console.log(`Migrated ${names.length} product categories.`);
}

migrateProductCategories().then(() => process.exit(0)).catch(error => {
  console.error(error.message);
  process.exit(1);
});
