import React, { useRef, useState } from 'react';
import API_BASE_URL from '../../config/api';
import { authHeaders } from '../../services/api';

export default function StockAdjustment({ item, action, onClose, onSaved }) {
  const [quantity, setQuantity] = useState('');
  const [label, setLabel] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [batchId, setBatchId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const restocking = action === 'add';
  const title = restocking ? 'Restock' : 'Remove stock';
  const batches = (item.batches || []).filter(batch => batch.quantity > 0);

  const handleSubmit = async event => {
    event.preventDefault();
    if (submitting.current) return;
    const amount = Number(quantity);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a quantity greater than zero.');
      return;
    }
    const available = batchId ? batches.find(batch => batch._id === batchId)?.quantity : item.currentStock;
    if (!restocking && amount > Number(available)) {
      setError('Insufficient stock in the selected batch or item.');
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/inventory/${item._id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action, quantity: amount, ...(restocking ? { label: label.trim(), expiryDate } : { batchId: batchId || undefined }) })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || result.message || 'Unable to adjust stock. Please try again.');
    } catch (err) {
      setError(err.message || 'Unable to adjust stock. Please try again.');
      submitting.current = false;
      setSaving(false);
      return;
    }
    onClose();
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={() => { if (!saving) onClose(); }}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="stock-adjustment-title" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <h2 id="stock-adjustment-title">{title}: {item.name}</h2>
          <button type="button" className="modal-close" aria-label="Close" disabled={saving} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p>Current stock: {item.currentStock} {item.unit}</p>
            {error && <p role="alert">{error}</p>}
            <div className="form-group">
              <label htmlFor="stock-quantity">Quantity ({item.unit})</label>
              <input id="stock-quantity" type="number" min="0" step="any" required autoFocus disabled={saving} value={quantity} onChange={event => setQuantity(event.target.value)} />
            </div>
            {restocking ? <>
              <div className="form-group">
                <label htmlFor="stock-label">Batch label (optional)</label>
                <input id="stock-label" value={label} disabled={saving} onChange={event => setLabel(event.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="stock-expiry">Expiry date (optional)</label>
                <input id="stock-expiry" type="date" value={expiryDate} disabled={saving} onChange={event => setExpiryDate(event.target.value)} />
              </div>
            </> : <div className="form-group">
              <label htmlFor="stock-batch">Remove from</label>
              <select id="stock-batch" value={batchId} disabled={saving} onChange={event => setBatchId(event.target.value)}>
                <option value="">Earliest expiry first</option>
                {batches.map(batch => <option key={batch._id} value={batch._id}>{batch.label || 'Batch'} — {batch.quantity} {item.unit}{batch.expiryDate ? ` (expires ${batch.expiryDate.slice(0, 10)})` : ''}</option>)}
              </select>
            </div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" disabled={saving} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : title}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
