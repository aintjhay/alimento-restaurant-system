// Build an ISO day explicitly: localized date ordering can vary across runtimes.
const dayKey = date => {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
};

function initializeBatches(item) {
  if (!item.batches?.length && item.currentStock > 0) {
    item.batches = [{ label: 'Opening stock', quantity: item.currentStock, expiryDate: item.expiryDate || null, receivedAt: item.lastRestocked || new Date() }];
  }
  item.batches = item.batches || [];
}

function validExpiryDate(value) {
  return value === undefined || value === null || value === '' || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value);
}

function changeStock(item, { quantity, action, expiryDate, label, batchId }, now = new Date()) {
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0 || !['add', 'subtract', 'set'].includes(action)) throw new Error('Enter a valid non-negative quantity and stock action');
  if (!validExpiryDate(expiryDate)) throw new Error('Enter a valid expiry date');
  initializeBatches(item);
  if (action === 'set') {
    if (quantity === item.currentStock) return;
    throw new Error('Use Restock or Remove stock to preserve batch quantities');
  }
  if (action === 'add') {
    if (quantity <= 0) throw new Error('Restock quantity must be greater than zero');
    item.batches.push({ label: label || 'Restock', quantity, expiryDate: expiryDate || null, receivedAt: now });
    item.lastRestocked = now;
  } else {
    const batches = [...item.batches].filter(batch => !batchId || String(batch._id) === String(batchId))
      .sort((a, b) => (a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity) - (b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity));
    if (batches.reduce((sum, batch) => sum + batch.quantity, 0) < quantity) throw new Error('Insufficient stock in the selected batch or item');
    let remaining = quantity;
    for (const batch of batches) {
      const used = Math.min(batch.quantity, remaining);
      batch.quantity -= used;
      remaining -= used;
    }
  }
  item.currentStock = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
}

function expirationAlerts(item, now = new Date()) {
  const today = dayKey(now);
  const soon = dayKey(new Date(now.getTime() + 7 * 86400000));
  const batches = item.batches?.length ? item.batches : [{ label: 'Opening stock', quantity: item.currentStock, expiryDate: item.expiryDate }];
  return batches.filter(batch => batch.quantity > 0 && batch.expiryDate).map(batch => {
    const date = new Date(batch.expiryDate).toISOString().slice(0, 10);
    return { batchId: batch._id, label: batch.label, quantity: batch.quantity, expiryDate: date, status: date < today ? 'expired' : date <= soon ? 'expiring-soon' : 'fresh' };
  }).filter(batch => batch.status !== 'fresh');
}

module.exports = { initializeBatches, changeStock, expirationAlerts, validExpiryDate };
