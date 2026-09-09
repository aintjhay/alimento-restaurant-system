import { getStockStatus, filterStockItems } from './inventoryView';

test('stock boundaries distinguish depleted items from low and sufficient stock', () => {
  expect(getStockStatus(0, 5)).toBe('out');
  expect(getStockStatus(0, 0)).toBe('out');
  expect(getStockStatus(0.5, 1)).toBe('low');
  expect(getStockStatus(5, 5)).toBe('low');
  expect(getStockStatus(5.1, 5)).toBe('good');
});

test('filters show mutually exclusive stock groups and preserve all items', () => {
  const items = [0, 2, 8].map(currentStock => ({ currentStock, minimumThreshold: 5 }));
  expect(filterStockItems(items, 'all')).toEqual(items);
  expect(filterStockItems(items, 'out')).toEqual([items[0]]);
  expect(filterStockItems(items, 'low')).toEqual([items[1]]);
  expect(filterStockItems(items, 'good')).toEqual([items[2]]);
});
