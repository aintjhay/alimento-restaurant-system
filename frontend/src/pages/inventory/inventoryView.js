export const getStockStatus = (current, minimum) => {
  if (Number(current) <= 0) return 'out';
  if (Number(current) <= Number(minimum)) return 'low';
  return 'good';
};

export const filterStockItems = (items, status) => status === 'all'
  ? items
  : items.filter(item => getStockStatus(item.currentStock, item.minimumThreshold) === status);
