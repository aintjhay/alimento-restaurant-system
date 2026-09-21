require('dotenv').config();
const { connectDB } = require('./src/config/mongodb');
const syncProductCategories = require('./src/services/syncProductCategories');

async function migrateProductCategories() {
  await connectDB();
  const count = await syncProductCategories();
  console.log(`Migrated ${count} product categories.`);
}

migrateProductCategories().then(() => process.exit(0)).catch(error => {
  console.error(error.message);
  process.exit(1);
});
