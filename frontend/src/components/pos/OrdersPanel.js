import React, { useEffect, useRef, useState } from 'react';
import { FaHistory, FaTimes, FaPrint, FaSyncAlt, FaArrowLeft } from 'react-icons/fa';
import API_BASE_URL from '../../config/api';
import { authHeaders } from '../../services/api';
import OrdersStatusFilter from './OrdersStatusFilter';
import './OrdersPanel.css';

const money = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0));
const label = value => ({ payment_pending_verification: 'Awaiting verification', payment_verified: 'Payment verified', partially_paid: 'Partially paid', out_for_delivery: 'Out for delivery' }[value] || String(value || 'Unknown').replace(/_/g, ' '));
const timestamp = value => new Date(value).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' });
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export default function OrdersPanel({ onClose }) {
  const dialog = useRef(null);
  const selectedRow = useRef(null);
  const detailHeading = useRef(null);

  const backToOrders = () => {
    setSelected(null);
    setPrintError('');
    requestAnimationFrame(() => selectedRow.current?.focus());
  };
  const [tab, setTab] = useState('history');
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printError, setPrintError] = useState('');

  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setSelected(null); setPrintError('');
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ status: status || tab, page: String(page), limit: '15', search: search.trim() });
      if (tab === 'history' && date) {
        params.set('startDate', new Date(`${date}T00:00:00+08:00`).toISOString());
        params.set('endDate', new Date(`${date}T23:59:59.999+08:00`).toISOString());
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders?${params}`, { headers: authHeaders(), signal: controller.signal });
        const data = await response.json();
        if (!response.ok || data.success === false) throw new Error(data.message || 'Unable to load orders. Please try again.');
        if (!controller.signal.aborted) { setOrders(data.orders || []); setTotal(data.pagination?.total || 0); }
      } catch (err) { if (!controller.signal.aborted) setError(err.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [tab, date, search, status, page, refresh]);

  useEffect(() => {
    if (selected) detailHeading.current?.focus();
  }, [selected]);

  const print = () => {
    setPrintError('');
    const popup = window.open('', '_blank', 'width=420,height=700');
    if (!popup) { setPrintError('Allow pop-ups for this site to print a receipt.'); return; }
    const doc = popup.document;
    doc.title = `Receipt ${selected.orderNumber}`;
    const style = doc.createElement('style');
    style.textContent = 'body{font:14px monospace;max-width:320px;margin:24px auto;padding:16px;color:#111}h1{text-align:center;font-size:22px}pre{white-space:pre-wrap;font:inherit;line-height:1.7}@media print{body{margin:0 auto;padding:0}}';
    doc.head.appendChild(style);
    const heading = doc.createElement('h1'); heading.textContent = 'ALIMENTO'; doc.body.appendChild(heading);
    const receipt = doc.createElement('pre');
    receipt.textContent = [
      'ORDER RECEIPT · COPY', selected.orderNumber, timestamp(selected.createdAt),
      `${selected.orderType}${selected.tableNumber ? ` · Table ${selected.tableNumber}` : ''}`,
      selected.customerName || 'Walk-in customer', `Order: ${label(selected.status)}`, '',
      ...(selected.items || []).flatMap(item => [
        `${item.quantity} × ${item.name}  ${money(item.itemTotal ?? item.price * item.quantity)}`,
        ...(item.modifiers || []).map(mod => `  ${mod.modifierName}: ${mod.selectedOption}`),
        ...(item.addons || []).map(addon => `  + ${addon.name}`),
        ...(item.specialInstructions ? [`  Note: ${item.specialInstructions}`] : [])
      ]), '',
      `Subtotal: ${money(selected.subtotal)}`, `Discount: -${money(selected.discount)}`,
      `Tax: ${money(selected.taxAmount)}`, `Delivery: ${money(selected.deliveryFee)}`,
      `TOTAL: ${money(selected.totalAmount)}`, `${label(selected.paymentMethod)} · ${label(selected.paymentStatus)}`,
      ...(selected.amountPaid != null ? [`Amount paid: ${money(selected.amountPaid)}`] : []),
      ...(selected.amountRefunded ? [`Refunded: ${money(selected.amountRefunded)}`] : []),
      '', 'Thank you!'
    ].join('\n');
    doc.body.appendChild(receipt);
    popup.focus(); popup.print();
  };

  return (
    <dialog ref={dialog} className="pos-orders-panel" aria-labelledby="pos-orders-title" onCancel={event => { event.preventDefault(); onClose(); }}>
      <header className="pos-orders-heading"><div><span>ALIMENTO POS</span><h2 id="pos-orders-title"><FaHistory aria-hidden="true" /> Orders</h2><p>Find an order or reprint a receipt.</p></div><button type="button" onClick={onClose} aria-label="Close orders" autoFocus><FaTimes /></button></header>
      {!selected && <><div className="pos-orders-tabs" role="group" aria-label="Order views">
        {['active', 'history'].map(view => <button key={view} type="button" aria-pressed={tab === view} onClick={() => { setTab(view); setStatus(''); setPage(1); }}>{view === 'active' ? 'Active orders' : 'Order history'}</button>)}
      </div>
      <div className="pos-orders-filters">
        <label className="pos-orders-search">Search orders<input type="search" placeholder="Order #, table, or customer" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label>
        {tab === 'history' && <label>Date (Manila)<input type="date" value={date} onChange={e => { setDate(e.target.value); setPage(1); }} /></label>}
        <OrdersStatusFilter key={tab} tab={tab} value={status} onChange={value => { setStatus(value); setPage(1); }} />
        <button type="button" onClick={() => setRefresh(value => value + 1)} aria-label="Refresh orders"><FaSyncAlt /></button>
      </div>
      </>}
      <div className={`pos-orders-body${selected ? ' pos-orders-body--detail' : ''}`}>
        {loading ? <p role="status" className="pos-orders-empty">Loading orders…</p> : error ? <div role="alert" className="pos-orders-empty"><p>{error}</p><button onClick={() => setRefresh(value => value + 1)}>Try again</button></div> : <>
          <div hidden={Boolean(selected)}> {!orders.length ? <div className="pos-orders-empty"><FaHistory /><h3>No orders found</h3><p>{tab === 'history' ? 'Try another date, status, or search. Clear the date to search all history.' : 'Active orders will appear here. Try clearing your filters.'}</p></div> : <div className="pos-orders-list">{orders.map(order => <button type="button" className="pos-orders-row" key={order._id} aria-pressed={selected?._id === order._id} onClick={event => { selectedRow.current = event.currentTarget; setSelected(order); setPrintError(''); }}><div><strong>{order.orderNumber}</strong><small>{timestamp(order.createdAt)}</small><span>{order.tableNumber ? `Table ${order.tableNumber} · ` : ''}{order.customerName || 'Walk-in'} · {order.orderType}</span></div><div className="pos-orders-row-total"><strong>{money(order.totalAmount)}</strong><span className={`pos-orders-badge pos-orders-badge--${order.status}`}>{label(order.status)}</span><small>{label(order.paymentStatus)}</small></div></button>)}</div>}
          {total > 15 && <nav className="pos-orders-pagination" aria-label="Order pages"><button disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} of {Math.ceil(total / 15)}</span><button disabled={page * 15 >= total} onClick={() => setPage(value => value + 1)}>Next</button></nav>}
          </div>
          {selected && <section className="pos-orders-detail" aria-label="Order details"><div className="pos-orders-detail-heading"><button type="button" className="pos-orders-back" onClick={backToOrders}><FaArrowLeft aria-hidden="true" /> Back to orders</button><h3 ref={detailHeading} tabIndex={-1}>{selected.orderNumber} details</h3><p>{timestamp(selected.createdAt)} &middot; {label(selected.status)}</p><p>{selected.customerName || 'Walk-in customer'} &middot; {selected.orderType}{selected.tableNumber ? ` \u00b7 Table ${selected.tableNumber}` : ''}</p></div><div className="pos-orders-detail-content">{(selected.items || []).map((item, index) => <div className="pos-orders-line" key={item._id || index}><div><strong>{item.quantity} × {item.name}</strong>{(item.modifiers || []).map((mod, i) => <small key={i}>{mod.modifierName}: {mod.selectedOption}</small>)}{(item.addons || []).map((addon, i) => <small key={i}>+ {addon.name}</small>)}{item.specialInstructions && <small>Note: {item.specialInstructions}</small>}</div><span>{money(item.itemTotal ?? item.price * item.quantity)}</span></div>)}<dl>{[['Subtotal', selected.subtotal], ['Discount', -(selected.discount || 0)], ['Tax', selected.taxAmount], ['Delivery', selected.deliveryFee], ['Total', selected.totalAmount], ...(selected.amountPaid != null ? [['Amount paid', selected.amountPaid]] : []), ...(selected.amountRefunded ? [['Refunded', selected.amountRefunded]] : [])].map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{money(value)}</dd></div>)}</dl><p className="pos-orders-payment">{label(selected.paymentMethod)} · {label(selected.paymentStatus)}</p>{selected.notes && <p>Notes: {selected.notes}</p>}</div><div className="pos-orders-detail-actions"><div className="pos-orders-detail-total"><span>Total</span><strong>{money(selected.totalAmount)}</strong></div><button type="button" className="pos-orders-print" onClick={print}><FaPrint /> Reprint receipt</button>{printError && <p role="alert">{printError}</p>}</div></section>}
        </>}
      </div>
      <footer className="pos-orders-footer">Your current cart stays saved while you browse orders.</footer>
    </dialog>
  );
}
