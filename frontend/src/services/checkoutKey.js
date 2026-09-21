export function checkoutKey(scope, body) {
  const value = JSON.stringify(body);
  let fingerprint = 2166136261;
  for (let i = 0; i < value.length; i++) fingerprint = Math.imul(fingerprint ^ value.charCodeAt(i), 16777619);
  const storageKey = `checkout-attempt-${scope}`;
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(storageKey)); } catch { /* Replace invalid cache. */ }
  if (!saved || saved.fingerprint !== fingerprint) {
    const bytes = new Uint8Array(16); crypto.getRandomValues(bytes);
    saved = { fingerprint, key: Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('') };
    sessionStorage.setItem(storageKey, JSON.stringify(saved));
  }
  return saved.key;
}
export const finishCheckout = scope => sessionStorage.removeItem(`checkout-attempt-${scope}`);
