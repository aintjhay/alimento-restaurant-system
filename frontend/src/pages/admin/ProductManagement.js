import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import AdminNav from '../../components/admin/AdminNav';
import { API_URL, authHeaders } from '../../services/api';
import './ProductManagement.css';
import { getFoodImage } from '../../utils/imageUtils';
import { prepareMenuImage } from '../../utils/menuImage';

const emptyProduct = { image: '', name: '', description: '', price: '', category: '', categoryId: null, isAvailable: true, preparationTime: 15 };
const money = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
async function request(path, options = {}) {
  const response = await fetch(`${API_URL}/admin/${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...authHeaders() } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'Something went wrong. Please try again.');
  return body;
}
export default function ProductManagement() {
  const [products, setProducts] = useState([]), [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1), [category, setCategory] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [form, setForm] = useState(emptyProduct), [editing, setEditing] = useState(null);
  const [error, setError] = useState(''), [categoryError, setCategoryError] = useState(''), [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [revision, setRevision] = useState(0);
  const nameInput = useRef(null);
  const imageInput = useRef(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const busy = saving || processingImage;
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    request(`products?${new URLSearchParams({ page, category })}`).then(body => {
      if (!active) return;
      if (page > body.pagination.totalPages) { setPage(body.pagination.totalPages); return; }
      setProducts(body.data); setPagination(body.pagination);
    }).catch(err => { if (active) { setProducts([]); setError(err.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, category, revision]);
  useEffect(() => {
    let active = true;
    request('categories').then(body => { if (active) setCategories(body.data || []); })
      .catch(() => { if (active) setCategoryError('Categories could not be loaded. Refresh the page to try again.'); });
    return () => { active = false; };
  }, []);
  const reset = () => { setForm(emptyProduct); setEditing(null); setImageError(''); if (imageInput.current) imageInput.current.value = ''; };
  const change = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const selectImage = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProcessingImage(true); setImageError('');
    try { change('image', await prepareMenuImage(file)); }
    catch (err) { setImageError(err.message); }
    finally { setProcessingImage(false); if (imageInput.current) imageInput.current.value = ''; }
  };
  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    if (!form.name.trim()) { setError('Enter a food or drink name.'); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      await request(editing ? `products/${editing}` : 'products', { method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({ ...form, name: form.name.trim(), price: Number(form.price), preparationTime: Number(form.preparationTime) }) });
      setMessage(`${form.name.trim()} ${editing ? 'updated' : 'added to the menu'}.`);
      reset(); setRevision(value => value + 1);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  const edit = product => {
    setEditing(product._id); setImageError('');
    if (imageInput.current) imageInput.current.value = '';
    setForm({ image: product.image || '', name: product.name, description: product.description || '', price: product.price, category: product.category,
      categoryId: product.categoryId || categories.find(item => item.name === product.category)?._id || null,
      isAvailable: product.isAvailable, preparationTime: product.preparationTime ?? 15 });
    nameInput.current?.focus();
  };
  const remove = async product => {
    if (!window.confirm(`Delete "${product.name}"? This also removes its linked stock record. To temporarily hide it, edit the item and turn off availability instead.`)) return;
    setSaving(true); setError(''); setMessage('');
    try {
      await request(`products/${product._id}`, { method: 'DELETE' });
      if (editing === product._id) reset();
      setMessage(`${product.name} deleted.`); setRevision(value => value + 1);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  return <AdminNav title="Menu Management"><div className="menu-management">
    <div className="menu-intro"><p>Add your dishes and drinks, update prices, and keep your menu ready for service.</p><button className="menu-primary" disabled={busy} onClick={() => { reset(); nameInput.current?.focus(); }}><FiPlus /> Add menu item</button></div>
    {message && <div className="menu-notice" role="status">{message}</div>}
    {error && <div className="menu-notice menu-error" role="alert">{error} <button onClick={() => setRevision(value => value + 1)}>Retry list</button></div>}
    <div className="menu-workspace">
      <section className="menu-panel" aria-labelledby="menu-list-title">
        <div className="menu-heading"><div><span className="menu-eyebrow">YOUR OFFERINGS</span><h2 id="menu-list-title">Food & drinks</h2></div><span className="menu-count">{loading ? 'Loading…' : `${pagination.totalItems} items`}</span></div>
        <div className="menu-filter"><label htmlFor="category-filter">Browse category</label><select id="category-filter" value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map(item => <option key={item._id} value={item.name}>{item.name}</option>)}</select></div>
        <div className="menu-table-wrap" tabIndex="0" aria-label="Menu items" aria-busy={loading}><table className="menu-table"><thead><tr><th>Menu item</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {loading ? <tr><td colSpan="4" className="menu-empty">Loading your menu…</td></tr> : products.length === 0 ? <tr><td colSpan="4" className="menu-empty">{error ? 'Your menu could not be loaded.' : 'No items here yet. Add your first dish or drink using the form.'}</td></tr> : products.map(product => <tr key={product._id}>
            <td className="menu-item">{product.image && <img className="menu-item-thumbnail" src={getFoodImage(product.image)} alt="" />}<strong>{product.name}</strong><small>{product.category}</small><small>{product.stock ? `Stock: ${product.stock.currentStock}` : 'Stock not linked'}</small></td>
            <td className="menu-price">{money(product.price)}</td><td><span className={`menu-status ${product.isAvailable ? 'available' : ''}`}>{product.isAvailable ? 'Available' : 'Unavailable'}</span></td>
            <td><div className="menu-row-actions"><button disabled={busy} onClick={() => edit(product)} aria-label={`Edit ${product.name}`} title="Edit item"><FiEdit2 /></button><button className="menu-delete" disabled={busy} onClick={() => remove(product)} aria-label={`Delete ${product.name}`} title="Delete item"><FiTrash2 /></button></div></td>
          </tr>)}
        </tbody></table></div>
        <div className="menu-pagination"><span>Page {pagination.page} of {pagination.totalPages}</span><div><button disabled={loading || !pagination.hasPreviousPage} onClick={() => setPage(value => value - 1)}>Previous</button><button disabled={loading || !pagination.hasNextPage} onClick={() => setPage(value => value + 1)}>Next</button></div></div>
      </section>
      <section className="menu-panel menu-editor" aria-labelledby="menu-editor-title">
        <div className="menu-heading"><div><span className="menu-eyebrow">{editing ? 'MAKE CHANGES' : 'GROW YOUR MENU'}</span><h2 id="menu-editor-title">{editing ? 'Edit menu item' : 'Add a menu item'}</h2><p>Fields marked * are required.</p></div></div>
        <form onSubmit={submit}><fieldset disabled={busy}>
          <div className="menu-image-editor">
            <label htmlFor="food-image">Item photo <span>(optional)</span></label>
            {form.image ? <img className="menu-image-preview" src={getFoodImage(form.image)} alt="Menu item preview" /> : <div className="menu-image-placeholder">Add a photo of your dish or drink</div>}
            <input id="food-image" ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} aria-describedby="food-image-help" />
            <p id="food-image-help" className="menu-help">JPG, PNG, or WebP, up to 10 MB. Photos are resized automatically and saved with the item.</p>
            {processingImage && <p role="status">Preparing photo?</p>}
            {imageError && <p role="alert" className="menu-error">{imageError}</p>}
            {form.image && <button type="button" className="menu-cancel" onClick={() => { change('image', ''); setImageError(''); }}>Remove photo</button>}
          </div>
          <label htmlFor="food-name">Item name *</label><input id="food-name" ref={nameInput} required value={form.name} placeholder="e.g. Chicken Alfredo" onChange={event => change('name', event.target.value)} />
          <div className="menu-form-row"><div><label htmlFor="food-price">Price (₱) *</label><input id="food-price" required type="number" min="0" step="0.01" value={form.price} placeholder="0.00" onChange={event => change('price', event.target.value)} /></div><div><label htmlFor="food-time">Prep time (min) *</label><input id="food-time" required type="number" min="1" step="1" value={form.preparationTime} onChange={event => change('preparationTime', event.target.value)} /></div></div>
          <label htmlFor="food-category">Category *</label><select id="food-category" required value={form.category} onChange={event => setForm({ ...form, category: event.target.value, categoryId: categories.find(item => item.name === event.target.value)?._id || null })}><option value="">Choose a category</option>{form.category && !categories.some(item => item.name === form.category) && <option>{form.category}</option>}{categories.map(item => <option key={item._id} value={item.name}>{item.name}</option>)}</select>
          <p className="menu-help">Need another category? <Link to="/admin/categories">Manage categories</Link></p>
          {categoryError && <p role="alert" className="menu-error">{categoryError}</p>}
          <label htmlFor="food-description">Description <span>(optional)</span></label><textarea id="food-description" rows="3" value={form.description} placeholder="Tell customers what makes this item special." onChange={event => change('description', event.target.value)} />
          <label className="menu-availability"><input type="checkbox" checked={form.isAvailable} onChange={event => change('isAvailable', event.target.checked)} /><span><strong>Available to order</strong><small>Turn off to temporarily hide this item from the menu.</small></span></label>
          <button className="menu-primary menu-save" type="submit">{saving ? 'Saving…' : editing ? 'Save changes' : 'Add to menu'}</button>
          {editing && <button className="menu-cancel" type="button" onClick={reset}>Cancel editing</button>}
        </fieldset></form>
      </section>
    </div>
  </div></AdminNav>;
}
