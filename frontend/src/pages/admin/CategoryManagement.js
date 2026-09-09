import React, { useCallback, useEffect, useState } from 'react';
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
    <form className="admin-form" onSubmit={submit}>
      <input aria-label="Category name" required disabled={saving} value={name} onChange={event => setName(event.target.value)} placeholder="Category name, e.g. Beverages" />
      <div><button disabled={saving} className="admin-button">{saving ? 'Saving…' : editing ? 'Rename' : 'Add category'}</button>
        {editing && <button type="button" disabled={saving} onClick={() => { setEditing(null); setName(''); }}>Cancel</button>}</div>
    </form>
    {error && <div role="alert" className="admin-error"><p>{error}</p><button className="admin-button" disabled={loading || saving} onClick={load}>Retry categories</button></div>}
    <table className="admin-table" aria-busy={loading}><thead><tr><th>Name</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="3" role="status">Loading categories…</td></tr> : items.length === 0 ? <tr><td colSpan="3">{error ? 'Categories are currently unavailable.' : 'No categories yet. Add one using the form above.'}</td></tr> : items.map(item => <tr key={item._id}><td>{item.name}</td><td>{item.isActive ? 'Active' : 'Inactive'}</td><td>
        <button className="admin-button" disabled={saving} onClick={() => { setEditing(item._id); setName(item.name); }}>Rename</button>{' '}
        <button className="admin-button danger" disabled={saving} onClick={() => remove(item)}>Delete</button>
      </td></tr>)}
    </tbody></table>
  </AdminNav>;
}
