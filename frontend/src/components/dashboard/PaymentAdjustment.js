import React, { useState } from 'react';
import API_BASE_URL from '../../config/api';
import { authHeaders } from '../../services/api';
export default function PaymentAdjustment({ order, onSaved }) {
  const [kind, setKind] = useState('payment');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (order.paymentMethod === 'qrph') return null;
  const paid = order.amountPaid ?? (['paid', 'payment_verified', 'refunded'].includes(order.paymentStatus) ? order.totalAmount : 0);
  const refunded = order.amountRefunded || 0;
  const save = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const total = Number(amount);
      if (!Number.isFinite(total) || total < 0 || amount === '') throw new Error('Enter a cumulative amount.');
      const response = await fetch(`${API_BASE_URL}/api/orders/${order._id}/status`, { method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(kind === 'payment' ? { amountPaid: total } : { amountRefunded: total }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to record payment.');
      onSaved(result.order); setAmount('');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <form onSubmit={save} aria-label="Record payment amount">
    <p>Received: ₱{paid.toFixed(2)} · Refunded: ₱{refunded.toFixed(2)} · Remaining: ₱{Math.max(0, order.totalAmount - paid).toFixed(2)}</p>
    {order.paymentStatus === 'partially_paid' && order.amountPaid == null && <p>Legacy partial payment: verify the amount received before updating this record.</p>}
    <label>Record <select value={kind} onChange={e => { setKind(e.target.value); setAmount(''); }} disabled={busy}><option value="payment">Payment received</option><option value="refund">Refund issued</option></select></label>
    <label>Total {kind === 'payment' ? 'received' : 'refunded'} to date (PHP)<input type="number" step="0.01" min={kind === 'payment' ? paid : refunded} max={kind === 'payment' ? order.totalAmount : paid} value={amount} onChange={e => setAmount(e.target.value)} required disabled={busy} /></label>
    <p>Record only money actually received or returned. This form does not transfer money.</p>
    <button disabled={busy}>{busy ? 'Saving...' : 'Save payment record'}</button>
    {error && <p role="alert">{error}</p>}
  </form>;
}
