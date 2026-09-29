import React, { useEffect, useRef, useState } from 'react';
import AdminNav from '../../components/admin/AdminNav';
import { API_URL, authHeaders, parseResponse } from '../../services/api';
import { getStore, saveStore } from '../../services/storeService';
import { FiTag, FiPlus, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import './StoreSettings.css';
import './PromotionManagement.css';

const channelLabel = channel => channel === 'both' ? 'Portal + POS' : channel === 'pos' ? 'POS' : 'Portal';
export default function PromotionManagement() {
  const [store, setStore] = useState(null);
  const [saved, setSaved] = useState([]);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('All');
  const [editor, setEditor] = useState(null);
  const drawer = useRef(null);
  const opener = useRef(null);
  useEffect(() => {
    getStore().then(data => { setStore(data); setSaved(data.promotions || []); }).catch(e => setMessage(e.message));
    fetch(`${API_URL}/admin/product-options`, { headers: authHeaders() }).then(parseResponse).then(r => setProducts(r.data)).catch(e => setMessage(e.message));
  }, []);
  const isOpen = editor !== null;
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawer.current?.querySelector('input')?.focus();
    return () => { document.body.style.overflow = previousOverflow; opener.current?.focus(); };
  }, [isOpen]);
  const promotions = store?.promotions || [];
  const dirty = JSON.stringify(promotions) !== JSON.stringify(saved);
  const change = value => { setStore(s => ({ ...s, promotions: value })); setMessage(''); };
  const openEditor = (promo, index = null) => { opener.current = document.activeElement; setEditor({ promo: { ...promo }, index }); };
  const addPromo = (name = '', percent = 20, channel = 'portal', category = '') => openEditor({ name, percent, channel, category, productId: '', enabled: false, firstPurchaseOnly: false });
  const editDraft = (key, value) => setEditor(current => ({ ...current, promo: { ...current.promo, [key]: value } }));
  const apply = event => {
    event.preventDefault();
    change(editor.index === null ? [...promotions, editor.promo] : promotions.map((promo, index) => index === editor.index ? editor.promo : promo));
    setEditor(null);
  };
  const save = async () => {
    setBusy(true); setMessage('');
    try {
      const result = await saveStore({ promotions });
      setStore(result); setSaved(result.promotions || []); setMessage('Promotions saved.');
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  const handleKeys = event => {
    if (event.key === 'Escape') { event.preventDefault(); setEditor(null); }
    if (event.key === 'Tab') {
      const elements = drawer.current.querySelectorAll('button:not(:disabled), input, select, [tabindex="0"]');
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };
  const p = editor?.promo;
  return <AdminNav title="Promotions">
    <div className="store-settings promotions-page">
      <div inert={isOpen ? true : undefined}>
        <div className="promotions-toolbar"><p>Manage discounts for portal and POS orders.</p><button className="settings-add-promo" disabled={!store || busy} onClick={() => addPromo()}><FiPlus aria-hidden="true" /> Add promotion</button></div>
        {message && <p className="store-settings-message" role="status">{message}</p>}
        {!store ? <p>Loading promotions...</p> : <>
          <div className="promotions-filters" role="group" aria-label="Filter promotions">{['All', 'Enabled', 'Disabled'].map(value => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value} <span>{promotions.filter(promo => value === 'All' || Boolean(promo.enabled) === (value === 'Enabled')).length}</span></button>)}</div>
          <section className="promotions-list" aria-label="Promotions">
            {promotions.length === 0 ? <div className="promotions-empty"><FiTag aria-hidden="true" /><h3>Your next special starts here</h3><p>Add a promotion or choose a quick-start template below.</p></div> : <>
              {promotions.map((promo, index) => (filter === 'All' || Boolean(promo.enabled) === (filter === 'Enabled')) && <div className="promo-row" key={promo._id || index}>
                <div className="promo-amount">{promo.percent}%<small>OFF</small></div>
                <div className="promo-summary"><strong>{promo.name}</strong><p>{channelLabel(promo.channel)} &middot; {promo.category || 'All categories'}{promo.firstPurchaseOnly ? ' ? First purchase only' : ''}{promo.productId ? ` \u00b7 ${products.find(product => product._id === promo.productId)?.name || 'Selected product'}` : ''}</p>{(promo.startsAt || promo.endsAt) && <small>Scheduled &middot; {promo.startsAt ? new Date(promo.startsAt).toLocaleString() : 'Any start date'} &mdash; {promo.endsAt ? new Date(promo.endsAt).toLocaleString() : 'No end date'}</small>}</div>
                <button className="promo-toggle" role="switch" aria-checked={Boolean(promo.enabled)} aria-label={`Enable ${promo.name}`} disabled={busy} onClick={() => change(promotions.map((item, i) => i === index ? { ...item, enabled: !item.enabled } : item))}><span className="promo-switch-track" /><span>{promo.enabled ? 'Enabled' : 'Disabled'}</span></button>
                <button disabled={busy} onClick={() => openEditor(promo, index)} aria-label={`Edit ${promo.name}`}>Edit</button>
              </div>)}
              {!promotions.some(promo => filter === 'All' || Boolean(promo.enabled) === (filter === 'Enabled')) && <p className="promo-no-results">No {filter.toLowerCase()} promotions.</p>}
            </>}
          </section>
          <div className="promo-rules"><p>Highest matching discount applies. Delivery fees excluded.</p><details><summary>Discount rules</summary><p>The highest matching discount applies once to each item, including its selected options. New promotions are disabled until you enable and save them. Enabled promotions apply only within their scheduled dates.</p></details></div>
          <section className="promo-templates"><h2>Quick-start templates</h2><p>Start with an offer and customize the details.</p><div className="promotion-presets">
            <button className="promotion-preset" disabled={busy} aria-label="Add 20% website launch promo" onClick={() => addPromo('Website launch', 20)}><span className="preset-percent">20%<small>OFF</small></span><span><strong>Website launch</strong><small>Portal &middot; All categories</small></span><span className="promo-template-action">Use template <FiPlus aria-hidden="true" /></span></button>
            <button className="promotion-preset" disabled={busy} aria-label="Add 50% cocktail promo" onClick={() => addPromo('Cocktail special', 50, 'both', 'Cocktails')}><span className="preset-percent">50%<small>OFF</small></span><span><strong>Cocktail special</strong><small>Portal + POS &middot; Cocktails</small></span><span className="promo-template-action">Use template <FiPlus aria-hidden="true" /></span></button>
          </div></section>
          {dirty && <div className="promo-save-bar"><strong>Unsaved changes</strong><div><button disabled={busy} onClick={() => change(saved)}>Discard</button><button className="settings-add-promo" disabled={busy} onClick={save}><FiSave aria-hidden="true" />{busy ? 'Saving...' : 'Save changes'}</button></div></div>}
        </>}
      </div>
      {editor && <div className="promo-overlay" onClick={event => { if (event.target === event.currentTarget) setEditor(null); }}>
        <div className="promo-drawer" role="dialog" aria-modal="true" aria-labelledby="promo-editor-title" ref={drawer} onKeyDown={handleKeys}>
          <header><div><h2 id="promo-editor-title">{editor.index === null ? 'Add promotion' : 'Edit promotion'}</h2><p>Customize your offer.</p></div><button aria-label="Close editor" onClick={() => setEditor(null)}><FiX /></button></header>
          <form onSubmit={apply}>
            <div className="promo-drawer-status"><span className="promotion-discount">{p.percent || 0}% <small>OFF</small></span><label className="promo-toggle"><input type="checkbox" role="switch" checked={p.enabled} onChange={event => editDraft('enabled', event.target.checked)} />Enabled</label></div>
          <div className="promotion-fields">
          <label className="promotion-name">Name<input required maxLength={100} placeholder="e.g. Weekend favorites" value={p.name} onChange={e => editDraft('name', e.target.value)} /></label>
          <label>Discount %<input type="number" min="1" max="100" required value={p.percent} onChange={e => editDraft('percent', Number(e.target.value))} /></label>
          <label>Where<select disabled={Boolean(p.firstPurchaseOnly)} value={p.channel} onChange={e => editDraft('channel', e.target.value)}><option value="portal">Portal</option><option value="pos">POS</option><option value="both">Portal and POS</option></select></label>
          <label className="promotion-name">Customer eligibility<select value={p.firstPurchaseOnly ? 'first' : 'all'} onChange={e => setEditor(current => ({ ...current, promo: { ...current.promo, firstPurchaseOnly: e.target.value === 'first', ...(e.target.value === 'first' ? { channel: 'portal' } : {}) } }))}><option value="all">All customers</option><option value="first">First purchase only</option></select></label>
          {p.firstPurchaseOnly && <div className="promotion-field-heading"><p>Signed-in portal customers with no previous non-cancelled orders. Pending orders count; cancelled orders allow another attempt. Guest and POS orders are excluded.</p></div>}
          <div className="promotion-field-heading"><h4>Eligible items</h4><p>Choose a category or a specific product.</p></div>
          <label>Category<select value={p.category} onChange={e => editDraft('category', e.target.value)}><option value="">All categories</option>{[...new Set(products.map(p => p.category))].map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Product<select value={p.productId} onChange={e => editDraft('productId', e.target.value)}><option value="">All matching products</option>{products.map(product => <option key={product._id} value={product._id}>{product.name}</option>)}</select></label>
          <div className="promotion-field-heading"><h4>Schedule <span>Optional</span></h4><p>Leave dates empty for no time limit. Dates use your device’s local time.</p></div>
          <label>Starts (your local time)<input type="datetime-local" value={p.startsAt ? new Date(new Date(p.startsAt).getTime() - new Date(p.startsAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => editDraft('startsAt', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
          <label>Ends (your local time)<input type="datetime-local" value={p.endsAt ? new Date(new Date(p.endsAt).getTime() - new Date(p.endsAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => editDraft('endsAt', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
          </div>
            <footer><p>Apply your edits, then save changes to publish.</p><div>{editor.index !== null && <button className="settings-remove" type="button" onClick={() => { change(promotions.filter((_, index) => index !== editor.index)); setEditor(null); }}><FiTrash2 aria-hidden="true" /> Remove</button>}<button type="button" onClick={() => setEditor(null)}>Cancel</button><button className="settings-add-promo" type="submit">Apply changes</button></div></footer>
          </form>
        </div>
      </div>}
    </div>
  </AdminNav>;
}
