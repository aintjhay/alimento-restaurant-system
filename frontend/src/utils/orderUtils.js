// Status polling returns partial items. Preserve the original receipt fields.
export const mergeOrderUpdate = (order, update) => ({
  ...order,
  ...update,
  items: update.items ? update.items.map((item, index) => ({
    ...(item._id ? order.items?.find(previous => String(previous._id) === String(item._id)) : order.items?.[index]),
    ...item
  })) : order.items
});

export const orderItemTotal = item => {
  const number = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;
  const total = number(item.itemTotal);
  if (total !== null) return total;
  const price = number(item.price ?? item.basePrice);
  const quantity = number(item.quantity);
  if (price === null || quantity === null) return null;
  return (price + (item.modifiers || []).reduce((sum, mod) => sum + (number(mod.extraPrice) || 0), 0) + (item.addons || []).reduce((sum, addon) => sum + (number(addon.price) || 0), 0)) * quantity;
};
