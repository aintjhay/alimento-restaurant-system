import { API_URL, authHeaders, parseResponse } from './api';
export const getStore = () => fetch(`${API_URL}/store`, { cache: 'no-store' }).then(parseResponse);
export const saveStore = data => fetch(`${API_URL}/store`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(data) }).then(parseResponse);
export const quoteOrder = (items, channel = 'portal') => fetch(`${API_URL}/store/quote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, channel }) }).then(parseResponse);
export function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) return reject(new Error('Choose a PNG, JPEG or WebP image up to 3 MB.'));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read image.'));
    reader.readAsDataURL(file);
  });
}
export function promoFor(item, store, channel = 'portal') {
  const now = new Date();
  return (store?.promotions || []).filter(p => p.enabled && [channel, 'both'].includes(p.channel) && (!p.category || p.category === item.category) && (!p.productId || p.productId === String(item._id || item.id)) && (!p.startsAt || new Date(p.startsAt) <= now) && (!p.endsAt || new Date(p.endsAt) > now)).sort((a, b) => b.percent - a.percent)[0];
}
