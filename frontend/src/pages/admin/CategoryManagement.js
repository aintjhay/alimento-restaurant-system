import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiTag, FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import './CategoryManagement.css';
import AdminNav from '../../components/admin/AdminNav';
import { API_URL, authHeaders, fetchWithTimeout } from '../../services/api';

async function categoryRequest(path = '', options = {}) {
  const response = await fetchWithTimeout(`${API_URL}/admin/categories${path}`, {
    ...options, headers: { 'Content-Type': 'application/json', ...authHeaders() }
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = null; }
  if (!response.ok) {
    if (response.status === 429) throw new Error('Too many requests. Automatic refreshes have temporarily reached the server limit. Please try again shortly.');
    if (response.status === 401) throw new Error('Your session has expired. Please sign out and sign in again.');
    throw new Error(body?.message || `Unable to load or save categories (${response.status}). Please try again.`);
  }
  if (!body) throw new Error('The server returned an unexpected response. Please try again.');
  return body;
}
export default function CategoryManagement() {
  const [items, setItems] = useState([]), [name, setName] = useState(''), [editing, setEditing] = useState(null);
  const [error, setError] = useState(''), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const nameInput = useRef(null);
  const visibleItems = items.filter(item => item.name.toLowerCase().includes(search.trim().toLowerCase()));
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const body = await categoryRequest();
      if (!Array.isArray(body.data)) throw new Error('The category list could not be read. Please try again.');
      setItems(body.data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const submit = async event => {
    event.preventDefault();
    if (!name.trim()) { setError('Enter a category name.'); return; }
    setSaving(true); setError('');
    try {
      await categoryRequest(editing ? `/${editing}` : '', { method: editing ? 'PUT' : 'POST', body: JSON.stringify({ name: name.trim() }) });
      setName(''); setEditing(null); await load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  const remove = async item => {
    if (!window.confirm(`Delete the category "${item.name}"?`)) return;
    setSaving(true); setError('');
    try {
      await categoryRequest(`/${item._id}`, { method: 'DELETE' });
      if (editing === item._id) { setEditing(null); setName(''); }
      await load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  return <AdminNav title="Product Categories">
    <div className="category-management">
      <p className="category-intro">Organize your menu so every dish is easy to find.</p>
      {error && <div role="alert" className="category-error"><p>{error}</p><button disabled={loading || saving} onClick={load}>Retry categories</button></div>}
      <div className="category-workspace">
        <section className="category-panel" aria-label="Category list" aria-busy={loading}>
          <div className="category-panel-heading"><div><span className="category-eyebrow">MENU ORGANIZATION</span><h2>Your categories</h2></div><span className="category-count">{loading ? 'Loading?' : `${items.length} total`}</span></div>
          <div className="category-search"><FiSearch aria-hidden="true" /><input aria-label="Search categories" placeholder="Search categories?" value={search} onChange={event => setSearch(event.target.value)} /></div>
          <div className="category-list">
            {loading ? <div className="category-empty" role="status">Loading categories?</div> : visibleItems.length === 0 ? <div className="category-empty"><FiTag aria-hidden="true" /><h3>{error ? 'Categories unavailable' : search.trim() ? 'No matching categories' : 'Start organizing your menu'}</h3><p>{error ? 'Try loading the list again.' : search.trim() ? 'Try a different category name.' : 'Add your first category using the form.'}</p></div> : visibleItems.map(item => <div className={`category-row${editing === item._id ? ' is-editing' : ''}`} key={item._id}>
              <span className="category-icon"><FiTag aria-hidden="true" /></span>
              <div className="category-row-details"><strong>{item.name}</strong><span className={`category-status${item.isActive ? ' active' : ''}`}>{item.isActive ? 'Active' : 'Inactive'}</span></div>
              <div className="category-actions">
                <button type="button" aria-label={`Rename ${item.name}`} disabled={saving} onClick={() => { setEditing(item._id); setName(item.name); nameInput.current?.focus(); }}><FiEdit2 aria-hidden="true" /><span>Rename</span></button>
                <button type="button" className="category-delete" aria-label={`Delete ${item.name}`} disabled={saving} onClick={() => remove(item)}><FiTrash2 aria-hidden="true" /><span>Delete</span></button>
              </div>
            </div>)}
          </div>
          {!loading && items.length > 0 && <p className="category-list-footer">Showing {visibleItems.length} of {items.length} categories</p>}
        </section>
        <section className="category-panel category-editor" aria-labelledby="category-editor-title">
          <div className="category-panel-heading"><div><span className="category-eyebrow">{editing ? 'EDIT CATEGORY' : 'GROW YOUR MENU'}</span><h2 id="category-editor-title">{editing ? 'Rename category' : 'Add a category'}</h2></div><span className="category-icon">{editing ? <FiEdit2 aria-hidden="true" /> : <FiPlus aria-hidden="true" />}</span></div>
          <form onSubmit={submit}>
            <label htmlFor="category-name">Category name</label>
            <input id="category-name" ref={nameInput} required disabled={saving} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Beverages" aria-describedby="category-name-help" />
            <p id="category-name-help">{editing ? 'Renaming also updates the products in this category.' : 'Use a short, clear name to group related menu items.'}</p>
            <button disabled={saving || !name.trim()} className="category-primary">{editing ? <FiEdit2 aria-hidden="true" /> : <FiPlus aria-hidden="true" />}{saving ? 'Saving?' : editing ? 'Save changes' : 'Add category'}</button>
            {editing && <button className="category-cancel" type="button" disabled={saving} onClick={() => { setEditing(null); setName(''); }}>Cancel editing</button>}
          </form>
          <div className="category-tip"><FiTag aria-hidden="true" /><p>Categories keep your menu organized. Assign them to products in Menu Management.</p></div>
        </section>
      </div>
    </div>
  </AdminNav>;
}
