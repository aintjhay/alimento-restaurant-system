const money = value => Math.round((value + Number.EPSILON) * 100) / 100;
function isOpen(settings, now = new Date()) {
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  const day = new Date(now.getTime() + 8 * 3600000).getUTCDay();
  return !settings.closed && !(settings.closedDays || []).includes(day) && time >= settings.openingTime && time < settings.closingTime;
}
function promotionFor(product, settings, channel, now = new Date(), firstPurchaseEligible = false) {
  return (settings.promotions || []).filter(p => p.enabled && (!p.firstPurchaseOnly || (channel === 'portal' && firstPurchaseEligible)) && (p.channel === channel || p.channel === 'both') &&
    (!p.category || p.category === product.category) && (!p.productId || p.productId === String(product._id || product.id)) &&
    (!p.startsAt || new Date(p.startsAt) <= now) && (!p.endsAt || new Date(p.endsAt) > now))
    .sort((a, b) => b.percent - a.percent)[0];
}
function priceItems(items, products, settings, channel, now = new Date(), firstPurchaseEligible = false) {
  if (!Array.isArray(items) || !items.length || items.length > 100) throw new Error('Add between 1 and 100 items.');
  const result = items.map(item => {
    const product = products.find(p => String(p._id) === String(item.menuItemId));
    if (!product || product.isAvailable === false) throw new Error('An item is no longer available. Please refresh the menu.');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) throw new Error('Invalid quantity.');
    const modifiers = (item.modifiers || []).map(mod => {
      const definition = (product.modifiers || []).find(m => m.name === mod.modifierName);
      const option = definition?.options.find(o => o.name === mod.selectedOption);
      if (!option) throw new Error(`Invalid option for ${product.name}.`);
      return { modifierName: definition.name, selectedOption: option.name, extraPrice: definition.name === 'Temperature' ? option.price - product.price : option.price || 0 };
    });
    if (new Set(modifiers.map(m => m.modifierName)).size !== modifiers.length) throw new Error('Duplicate modifiers.');
    for (const mod of product.modifiers || []) if (mod.required && !modifiers.some(m => m.modifierName === mod.name)) throw new Error(`Choose ${mod.name} for ${product.name}.`);
    const addons = (item.addons || []).map(addon => {
      const definition = (product.addons || []).find(a => a.name === addon.name);
      if (!definition) throw new Error(`Invalid add-on for ${product.name}.`);
      return { name: definition.name, price: definition.price };
    });
    if (new Set(addons.map(a => a.name)).size !== addons.length) throw new Error('Duplicate add-ons.');
    const promo = promotionFor(product, settings, channel, now, firstPurchaseEligible);
    const unit = product.price + modifiers.reduce((s, m) => s + m.extraPrice, 0) + addons.reduce((s, a) => s + a.price, 0);
    const itemTotal = money(unit * item.quantity);
    const discountAmount = money(itemTotal * (promo?.percent || 0) / 100);
    return { menuItemId: product._id, name: product.name, category: product.category, image: product.image,
      price: product.price, quantity: item.quantity, modifiers, addons, specialInstructions: String(item.specialInstructions || '').slice(0, 500),
      itemTotal, discountAmount, promotionName: promo?.name || '', discountPercent: promo?.percent || 0 };
  });
  const subtotal = money(result.reduce((s, i) => s + i.itemTotal, 0));
  const discount = money(result.reduce((s, i) => s + i.discountAmount, 0));
  const deliveryFee = channel === 'portal' ? 50 : 0;
  return { items: result, subtotal, discount, taxAmount: 0, deliveryFee, totalAmount: money(subtotal - discount + deliveryFee) };
}
function validImage(value) {
  if (typeof value !== 'string' || value.length > 4 * 1024 * 1024) return false;
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  const bytes = Buffer.from(match[2], 'base64');
  return match[1] === 'png' ? bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' :
    match[1] === 'jpeg' ? bytes.subarray(0, 3).toString('hex') === 'ffd8ff' : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
}
module.exports = { money, isOpen, promotionFor, priceItems, validImage };
