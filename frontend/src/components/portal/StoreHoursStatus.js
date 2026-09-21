import React from 'react';
import { FiClock } from 'react-icons/fi';
import './StoreHoursStatus.css';

export function formatStoreTime(value) {
  if (!/^\d{2}:\d{2}$/.test(value || '')) return '—';
  const [hour, minute] = value.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export function scheduleStatus(store, now = new Date()) {
  const local = new Date(now.getTime() + 8 * 3600000);
  const time = `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`;
  if (store.closed) return { open: false, reason: 'Online ordering is temporarily paused.' };
  if ((store.closedDays || []).includes(local.getUTCDay())) return { open: false, reason: 'Today is a scheduled closed day.' };
  if (time < store.openingTime) return { open: false, reason: `Opens today at ${formatStoreTime(store.openingTime)}.` };
  if (time >= store.closingTime) return { open: false, reason: 'Ordering has ended for today.' };
  return { open: true, reason: `Orders accepted until ${formatStoreTime(store.closingTime)}.` };
}

export default function StoreHoursStatus({ store, draft = false, compact = false }) {
  if (!store) return null;
  const status = scheduleStatus(store);
  const open = draft ? status.open : store.isOpen;
  return <div className={`store-hours-status${open ? ' is-open' : ''}${compact ? ' is-compact' : ''}`} role="status">
    <FiClock aria-hidden="true" />
    <div><strong>{draft ? 'Schedule preview: ' : ''}{open ? 'Open for orders' : 'Currently closed'}</strong>
      {(!compact || !open || open !== status.open) && <span>{!draft && open !== status.open ? 'Store availability has changed. Refresh to check the latest status.' : status.reason}</span>}
      <small>{formatStoreTime(store.openingTime)} – {formatStoreTime(store.closingTime)} · {compact ? 'PHT' : 'Philippine time (PHT)'}</small>
    </div>
  </div>;
}
