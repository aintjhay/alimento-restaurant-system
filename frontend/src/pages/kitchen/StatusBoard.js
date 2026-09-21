import React from 'react';

export function getStationStatus(order, items) {
  if (['cancelled', 'completed', 'served', 'out_for_delivery'].includes(order.status)) return order.status;
  const statuses = items.map(item => item.itemStatus || order.status);
  const active = statuses.filter(status => !['cancelled', 'completed', 'served'].includes(status));
  if (active.includes('preparing')) return 'preparing';
  if (active.includes('pending')) return 'pending';
  if (active.includes('ready')) return 'ready';
  if (statuses.every(status => status === 'cancelled')) return 'cancelled';
  return 'served';
}

export default function StatusBoard({ orders, filter, preparingLabel, preparationOnly = false, children }) {
  const columns = [
    { key: 'pending', label: 'Received', hint: 'Waiting to start' },
    { key: 'preparing', label: preparingLabel, hint: 'In progress' },
    { key: 'ready', label: 'Ready', hint: 'Waiting for pickup / serving' },
    { key: 'out_for_delivery', label: 'Out for delivery', hint: 'With the rider' },
    { key: 'served', label: 'Served', hint: 'Handed over to the customer' },
    { key: 'completed', label: 'Completed', hint: 'Closed orders' },
    { key: 'cancelled', label: 'Cancelled', hint: 'No preparation needed' }
  ].filter(column => filter === 'all' || (filter === 'active'
    ? (preparationOnly ? ['pending', 'preparing', 'ready'] : ['pending', 'preparing', 'ready', 'out_for_delivery']).includes(column.key)
    : filter === 'history' ? ['served', 'completed', 'cancelled'].includes(column.key) : column.key === filter));

  return (
    <div className={`kds-status-board view-${filter}`} aria-label="Orders by preparation status">
      {columns.map(column => {
        const tickets = orders.filter(order => order.status === column.key)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return (
          <section className={`kds-status-column column-${column.key}`} key={column.key} aria-label={column.label}>
            <div className="kds-column-heading">
              <h2>{column.label} <span className="kds-filter-count">{tickets.length}</span></h2>
              <p>{column.hint}</p>
            </div>
            <div className="kds-column-tickets">
              {tickets.length ? tickets.map(children) : <p className="kds-column-empty">{preparationOnly ? 'No orders' : column.key === 'preparing' && preparingLabel === 'Preparing' ? 'No orders in preparation' : `No ${column.label.toLowerCase()} orders`}</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
