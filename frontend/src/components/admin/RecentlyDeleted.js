import React, { useRef, useState } from 'react';
import { API_URL, authHeaders } from '../../services/api';
import './RecentlyDeleted.css';

export default function RecentlyDeleted({ resource, onRestore }) {
  const dialog = useRef(null);
  const restoring = useRef(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}/admin/${resource}/${path}`, { ...options, headers: authHeaders() });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || result.error || 'Unable to complete the request.');
    return result;
  };

  const loadItems = async () => {
    setLoading(true);
    setError('');
    setItems([]);
    try {
      const result = await request('recently-deleted');
      const deleted = resource === 'inventory' ? result.items : result.data;
      if (!Array.isArray(deleted)) throw new Error('Unable to load deleted items.');
      setItems(deleted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const restore = async item => {
    if (restoring.current) return;
    restoring.current = true;
    setBusyId(item._id);
    setError('');
    setMessage('');
    try {
      await request(`${encodeURIComponent(item._id)}/restore`, { method: 'PATCH' });
    } catch (err) {
      setError(err.message);
      restoring.current = false;
      setBusyId(null);
      return;
    }
    setItems(current => current.filter(entry => entry._id !== item._id));
    setMessage(`${item.name} restored.`);
    try {
      await onRestore?.();
    } catch {
      setError('Item restored, but the active list could not be refreshed. Refresh the page to see it.');
    } finally {
      restoring.current = false;
      setBusyId(null);
    }
  };

  return <>
    <button type="button" className="recently-deleted-trigger" onClick={() => {
      setMessage('');
      dialog.current.showModal();
      loadItems();
    }}>Recently Deleted</button>
    <dialog ref={dialog} className="recently-deleted-dialog" aria-label="Recently Deleted" onCancel={event => { if (busyId) event.preventDefault(); }}>
      <header><h2>Recently Deleted</h2><button type="button" disabled={Boolean(busyId)} onClick={() => dialog.current.close()}>Close</button></header>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error} <button type="button" disabled={loading || Boolean(busyId)} onClick={loadItems}>Retry list</button></p>}
      {loading ? <p role="status">Loading deleted items...</p> : <>
        {!items.length && !error && <p>No recently deleted items.</p>}
        <ul>{items.map(item => <li key={item._id}>
          <span><strong>{item.name}</strong>{item.deletedAt && <small>Deleted {new Date(item.deletedAt).toLocaleString()}</small>}</span>
          <button type="button" disabled={Boolean(busyId)} onClick={() => restore(item)} aria-label={`Restore ${item.name}`}>{busyId === item._id ? 'Restoring...' : 'Restore'}</button>
        </li>)}</ul>
      </>}
    </dialog>
  </>;
}
