const { test } = require('node:test');
const assert = require('node:assert/strict');
const syncProductCategories = require('./syncProductCategories');

test('backfills missing categories, preserves managed settings and can run repeatedly', async () => {
  const records = new Map([['Drinks', { _id: 'existing', name: 'Drinks', isActive: false, displayOrder: 42 }]]);
  const updates = [];
  const menuItems = {
    distinct: async (field, filter) => {
      assert.equal(field, 'category');
      assert.deepEqual(filter, { deletedAt: null });
      return ['Drinks', 'Meals', '', null];
    },
    updateMany: async (filter, update) => updates.push({ filter, update })
  };
  const categories = {
    findOneAndUpdate: async ({ name }, update, options) => {
      assert.deepEqual(options, { new: true, upsert: true });
      assert.deepEqual(Object.keys(update), ['$setOnInsert']);
      if (!records.has(name)) records.set(name, { _id: name, ...update.$setOnInsert });
      return records.get(name);
    }
  };
  assert.equal(await syncProductCategories(menuItems, categories), 2);
  await syncProductCategories(menuItems, categories);
  assert.equal(records.size, 2);
  assert.deepEqual(records.get('Drinks'), { _id: 'existing', name: 'Drinks', isActive: false, displayOrder: 42 });
  assert.equal(records.get('Meals').isActive, true);
  assert.deepEqual(updates[0], {
    filter: { category: 'Drinks', categoryId: { $ne: 'existing' }, deletedAt: null },
    update: { $set: { categoryId: 'existing' } }
  });
});

test('does not invent categories when there are no menu items', async () => {
  assert.equal(await syncProductCategories({ distinct: async () => [] }, {}), 0);
});
