import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import { authHeaders } from '../../services/api';
import ForecastChart from '../../components/admin/ForecastChart';
import PaymentAdjustment from '../../components/dashboard/PaymentAdjustment';
import './OperationsDashboard.css';
export const money = value => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP'
}).format(Number(value) || 0);
export const dayKey = value => new Date(value).toLocaleDateString('en-CA', {
  timeZone: 'Asia/Manila'
});
const status = order => String(order.status || 'pending').toLowerCase();
const payment = order => String(order.paymentStatus || 'unpaid').toLowerCase();
export const active = order => ['pending', 'preparing', 'ready', 'out_for_delivery', 'served'].includes(status(order));
export const unpaid = order => status(order) !== 'cancelled' && ['unpaid', 'partially_paid', 'payment_pending_verification'].includes(payment(order));
export const sale = order => status(order) !== 'cancelled' && payment(order) !== 'refunded';
const amount = order => Number(order.totalAmount) || 0;
const label = value => value.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
const matches = (order, tab) => tab === 'all' || (tab === 'active' ? active(order) : tab === 'unpaid' ? unpaid(order) : status(order) === 'completed');
export const nextStep = order => {
  const type = String(order.orderType || 'Dine-in').toLowerCase();
  switch (status(order)) {
    case 'pending': return ['preparing', 'Start preparing'];
    case 'preparing': return ['ready', 'Mark ready'];
    case 'ready': return type === 'delivery' ? ['out_for_delivery', 'Dispatch order'] : type === 'takeaway' ? ['completed', 'Mark collected'] : ['served', 'Mark served'];
    case 'out_for_delivery': return ['completed', 'Mark delivered'];
    case 'served': return ['completed', 'Complete order'];
    default: return null;
  }
};
function ReviewDrawer({ children, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (node.showModal) node.showModal();
    else node.setAttribute('open', '');
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="ops-review-drawer" aria-label="Order and payment review" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>{children}</dialog>;
}
export default function OperationsDashboard() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [stock, setStock] = useState(null);
  const [updated, setUpdated] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('today');
  const [tab, setTab] = useState('active');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => { setSearchQuery(search.trim()); setPage(1); setVisible(10); }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const [visible, setVisible] = useState(10);
  const [expanded, setExpanded] = useState(null);
  const [receiptZoom, setReceiptZoom] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  useEffect(() => { setReceiptZoom(false); setCancelConfirm(false); }, [expanded]);
  const [busy, setBusy] = useState(null);
  const requestController = useRef(null);
  const paymentInFlight = useRef(false);
  const refresh = useCallback(async () => {
    requestController.current?.abort();
    setRefreshing(true);
    const controller = new AbortController();
    requestController.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders?limit=50&page=${page}&status=${tab === 'all' ? '' : tab}&period=${['all', 'completed'].includes(tab) ? period : ''}&sort=${sort}&search=${encodeURIComponent(searchQuery)}`, {
        headers: authHeaders(),
        signal: controller.signal
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error('Unable to load orders');
      if (controller.signal.aborted) return;
      setOrders(data.orders || []);
      setTotalRows(data.pagination?.total || (data.orders || []).length);
      const stats = await fetch(`${API_BASE_URL}/api/orders/summary?period=${period}`, { headers: authHeaders(), signal: controller.signal });
      if (stats.ok) { const result = await stats.json(); if (!controller.signal.aborted && result.summary) setSummary(result); }
      if (controller.signal.aborted) return;
      setUpdated(new Date());
      setError('');
    } catch {
      if (controller.signal.aborted && requestController.current !== controller) return;
      setError('Unable to refresh orders. Displayed data may be out of date. Please retry.');
    } finally {
      clearTimeout(timeout);

      setRefreshing(false);
    }
  }, [page, tab, period, sort, searchQuery]);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => { clearInterval(timer); requestController.current?.abort(); };
  }, [refresh]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/admin/inventory/alerts/low-stock`, {
      headers: authHeaders(),
      signal: controller.signal
    }).then(response => response.ok ? response.json() : Promise.reject()).then(data => setStock(data.success ? data.items : null)).catch(() => setStock(null));
    return () => controller.abort();
  }, [updated]);
  useEffect(() => {
    if (!expanded) return;
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/orders/${expanded}/receipt`, { headers: authHeaders(), signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('Unable to load receipt'); return r.json(); })
      .then(data => { if (data.paymentProof !== undefined) setOrders(current => current.map(o => o._id === expanded ? { ...o, paymentProof: data.paymentProof } : o)); })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [expanded]);
  const updateStatus = async (order, next) => {
    setBusy(order._id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: next
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to update order.');
      setOrders(current => current.map(item => item._id === order._id ? {
        ...item,
        status: next
      } : item));
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };
  const confirmPayment = async order => {
    if (paymentInFlight.current) return;
    paymentInFlight.current = true;
    setBusy(order._id);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'payment_verified' })
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.order) {
        throw new Error(result.message || 'Unable to confirm payment. Please retry.');
      }
      setOrders(current => current.map(item => item._id === order._id ? result.order : item));
    } catch (err) {
      setError(err.message);
    } finally {
      paymentInFlight.current = false;
      setBusy(null);
    }
  };
  const now = updated || new Date();
  const today = dayKey(now);
  const start = new Date(`${today}T00:00:00+08:00`);
  start.setDate(start.getDate() - (period === 'week' ? 6 : period === 'month' ? 29 : 0));
  const selected = orders.filter(order => new Date(order.createdAt) >= start && new Date(order.createdAt) <= now);
  const periodLabel = period === 'today' ? 'Today' : period === 'week' ? 'Last 7 days' : 'Last 30 days';
  const elapsed = order => Math.max(0, Math.floor((now - new Date(order.createdAt)) / 60000));
  const delayed = order => ['pending', 'preparing'].includes(status(order)) && elapsed(order) >= 30;
  const source = value => value === 'active' || value === 'unpaid' ? orders : selected;
  const filtered = source(tab).filter(order => matches(order, tab)).sort((a, b) => sort === 'highest' ? amount(b) - amount(a) : (new Date(a.createdAt) - new Date(b.createdAt)) * (sort === 'oldest' ? 1 : -1));
  const counts = {};
  selected.filter(sale).forEach(order => (order.items || []).forEach(item => {
    const name = item.name || 'Unnamed item';
    counts[name] = (counts[name] || 0) + (Number(item.quantity) || 0);
  }));
  const top = summary?.topItems?.map(i => [i.name, i.quantity]) || Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const daily = Array.from({
    length: 7
  }, (_, i) => {
    const date = new Date(`${today}T12:00:00+08:00`);
    date.setDate(date.getDate() - 6 + i);
    return {
      date,
      value: summary?.trend?.find(d => d.date === dayKey(date))?.total ?? orders.filter(order => dayKey(order.createdAt) === dayKey(date) && sale(order)).reduce((sum, order) => sum + amount(order), 0)
    };
  });
  const max = Math.max(1, ...daily.map(day => day.value));
  return <main className="ops-dashboard">
    <header className="ops-header"><div><p className="ops-eyebrow">ALIMENTO / OPERATIONS</p><h1>Dashboard</h1><p className="ops-muted">{updated ? `Updated ${updated.toLocaleTimeString('en-PH', {
            hour: '2-digit',
            minute: '2-digit'
          })} · Refreshes every 30 seconds` : 'Waiting for restaurant activity'}</p></div><div className="ops-actions"><select aria-label="Reporting period" value={period} onChange={e => {
          setPeriod(e.target.value); setPage(1);
          setVisible(10);
        }}><option value="today">Today</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option></select><button disabled={refreshing} onClick={refresh}>{refreshing ? 'Refreshing…' : 'Refresh'}</button><Link to="/admin/products">Admin Panel</Link><Link className="ops-primary" to="/admin/pos">Go to POS</Link></div></header>
    <nav className="ops-shortcuts" aria-label="Restaurant shortcuts"><Link to="/admin/kitchen">Kitchen &amp; Bar display &#8599;</Link><Link to="/admin/inventory">Inventory ↗</Link><Link to="/admin/sales">Sales reports ↗</Link></nav>
    {error && !expanded && <div className="ops-notice" role="alert">{error}</div>}
    <section className="ops-metrics" aria-label="Key metrics">{[[`${period === 'today' ? "Today's" : periodLabel} order value`, money(summary?.summary?.orderValue ?? selected.filter(sale).reduce((sum, order) => sum + amount(order), 0)), 'Order value including unpaid; excludes cancelled and refunded'], [`${period === 'today' ? "Today's" : periodLabel} orders`, summary?.summary?.orderCount ?? selected.filter(order => status(order) !== 'cancelled').length, 'Excludes cancelled orders'], ['Active orders', summary?.activeCount ?? orders.filter(active).length, 'All dates · Pending through served'], [period === 'today' ? "Collected for today's orders" : 'Payments collected', summary ? money(summary.summary?.collected) : '\u2014', 'For orders placed in the selected period']].map(([title, value, detail]) => <article className="ops-metric" key={title}><h2>{title}</h2><strong>{updated ? value : '—'}</strong><p>{detail}</p></article>)}</section>
    <aside className={`ops-attention ${summary?.delayedCount > 0 ? 'ops-attention-warning' : ''}`}><strong>{!updated ? 'Checking activity' : summary?.delayedCount === 0 ? 'All caught up' : summary?.delayedCount > 0 ? 'Needs attention' : 'Order activity'}</strong><span>{!updated ? 'Loading order activity...' : summary?.delayedCount === 0 ? 'No delayed orders' : `${summary?.delayedCount ?? orders.filter(delayed).length} orders waiting 30+ min${summary?.delayedCount === undefined ? ' on this page' : ''}`}</span><Link to="/admin/inventory">{stock === null ? 'Check inventory alerts' : `${stock.length} low-stock items`} ↗</Link></aside>
    <section className="ops-panel"><div className="ops-panel-heading"><div><h2>Orders</h2><p className="ops-muted">{tab === 'active' || tab === 'unpaid' ? 'Outstanding orders across all dates' : `${periodLabel} · Philippines time`}</p></div><label>Sort <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option></select></label></div>
    <div className="ops-order-search"><label htmlFor="ops-search">Find an order</label><div><input id="ops-search" type="search" placeholder="Search order number or table" value={search} onChange={e => setSearch(e.target.value)} />{search && <button onClick={() => setSearch('')}>Clear search</button>}</div></div>
    <div className="ops-tabs" aria-label="Order filters">{['active', 'unpaid', 'completed', 'all'].map(value => <button key={value} aria-pressed={tab === value} onClick={() => {
          setTab(value); setPage(1);
          setVisible(10);
        }}>{label(value)} <span>{source(value).filter(order => matches(order, value)).length}</span></button>)}</div>
    <div className="ops-table-scroll"><table className="ops-table"><thead><tr>{['Order', 'Table / Type', 'Placed', 'Elapsed', 'Amount', 'Payment', 'Status'].map(title => <th scope="col" key={title}>{title}</th>)}</tr></thead><tbody>{filtered.slice(0, visible).map(order => <React.Fragment key={order._id}><tr className={delayed(order) ? 'ops-delayed' : ''}><td><button className="ops-order-link" aria-expanded={expanded === order._id} onClick={() => setExpanded(expanded === order._id ? null : order._id)}>{order.orderNumber || order._id.slice(-6)}</button></td><td>{String(order.orderType).toLowerCase() === 'delivery' || order.tableNumber === 'Delivery' ? 'Delivery' : order.tableNumber ? `Table ${order.tableNumber}` : label(order.orderType || 'Dine-in')}</td><td>{new Date(order.createdAt).toLocaleString('en-PH', {
                    timeZone: 'Asia/Manila',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td><td className={delayed(order) ? 'ops-elapsed-warning' : ''}>{active(order) ? `${elapsed(order)} min` : '—'}</td><td className="ops-amount">{money(amount(order))}</td><td><span className={unpaid(order) ? 'ops-payment-due' : 'ops-payment'}>{label(payment(order))}</span>{unpaid(order) && <div className="ops-payment-action">{order.paymentMethod === 'qrph' ? <small>Awaiting payment provider confirmation</small> : <button disabled={busy !== null} aria-expanded={expanded === order._id} onClick={() => setExpanded(order._id)}>Review payment</button>}</div>}</td><td><div className="ops-status-actions"><span className={`ops-status-badge ops-status-${status(order)}`} aria-label={`Status for ${order.orderNumber || order._id}`}>{status(order) === 'completed' && String(order.orderType).toLowerCase() === 'delivery' ? 'Delivered' : label(status(order))}</span>{nextStep(order) && <button disabled={busy !== null} onClick={() => updateStatus(order, nextStep(order)[0])}>{busy === order._id ? 'Saving...' : nextStep(order)[1]}</button>}</div></td></tr></React.Fragment>)}{!filtered.length && <tr><td colSpan="7" className="ops-empty">{!updated ? error ? 'Orders unavailable. Use Refresh to retry.' : 'Loading orders...' : searchQuery ? 'No matching orders. Try another order number or table.' : tab === 'active' ? 'No active orders. New orders will appear here automatically.' : `No ${tab === 'all' ? '' : tab + ' '}orders to show.`}</td></tr>}</tbody></table></div>{filtered.length > visible && <div className="ops-more"><button onClick={() => setVisible(count => count + 10)}>Show more ({filtered.length - visible} remaining)</button></div>}{page * 50 < totalRows && <button onClick={() => { setPage(p => p + 1); setVisible(v => v + 50); }} disabled={refreshing}>Next page</button>}{page > 1 && <button onClick={() => setPage(p => p - 1)} disabled={refreshing}>Previous page</button>}</section>
    {orders.filter(order => order._id === expanded).map(order => <ReviewDrawer key={order._id} onClose={() => setExpanded(null)}><section className="ops-review-panel" aria-label={`Payment review for ${order.orderNumber || order._id}`}>
                    <header className="ops-review-header">
                      <div><span className="ops-review-eyebrow">Order details</span><h3>Payment review <span>{order.orderNumber || order._id}</span></h3></div>
                      <button onClick={() => setExpanded(null)} aria-label="Close payment review">Close</button>
                    </header>
                    {error && <div className="ops-notice" role="alert">{error}</div>}<div className="ops-review-grid">
                      <div className="ops-review-summary">
                        <div className="ops-review-total"><p>Order total: <strong>{money(amount(order))}</strong></p><span className="ops-review-badge">{label(payment(order))}</span></div>
                        <dl className="ops-review-fields">
                          <div><dt>Payment method</dt><dd>{order.paymentMethod === 'gcash' ? 'GCash' : label(order.paymentMethod || 'Unknown')}</dd></div>
                          {[['customerName', 'Customer'], ['customerContact', 'Contact'], ['customerAddress', 'Address'], ['notes', 'Notes']].map(([key, title]) => order[key] && <div key={key}><dt>{title}</dt><dd>{order[key]}</dd></div>)}
                        </dl>
                        <div className="ops-review-items"><h4>Items ordered</h4><ul>{(order.items || []).map((item, i) => <li key={i}>{item.quantity} &times; {item.name}{item.notes ? ` - ${item.notes}` : ''}</li>)}</ul></div>
                        <PaymentAdjustment order={order} onSaved={saved => { setOrders(current => current.map(o => o._id === saved._id ? { ...o, ...saved } : o)); refresh(); }} />
                        {['pending', 'preparing', 'ready'].includes(status(order)) && <div className="ops-cancel-order">{cancelConfirm ? <><p>Cancel this order? This will stop fulfillment.</p><button disabled={busy !== null} onClick={async () => { await updateStatus(order, 'cancelled'); setCancelConfirm(false); }}>Confirm cancellation</button><button disabled={busy !== null} onClick={() => setCancelConfirm(false)}>Keep order</button></> : <button onClick={() => setCancelConfirm(true)}>Cancel order</button>}</div>}
                      </div>
                      <figure className="ops-review-receipt"><figcaption>Payment receipt<span>Customer attachment</span></figcaption>
                        {order.paymentProof ? <><button className={`ops-receipt-preview ${receiptZoom ? 'ops-receipt-zoom' : ''}`} aria-label={receiptZoom ? 'Shrink receipt' : 'Enlarge receipt'} aria-expanded={receiptZoom} onClick={() => setReceiptZoom(value => !value)}><img src={order.paymentProof} alt="Customer payment receipt" /></button><p className="ops-muted">{receiptZoom ? 'Click receipt to shrink' : 'Click receipt to enlarge'}</p></> : <div className="ops-receipt-empty">No payment receipt attached.</div>}
                      </figure>
                    </div>
                    {unpaid(order) && order.paymentMethod !== 'qrph' && <footer className="ops-payment-review">
                      <div><strong>Verify receipt of payment</strong><p>Check the actual transaction in your payment account or cash drawer. A receiving QR code alone is not proof of payment.</p>
                      {payment(order) === 'partially_paid' && <p>This order is partially paid. Confirm only after the remaining balance has been received.</p>}</div>
                      <button className="ops-confirm-payment" disabled={busy !== null} onClick={() => confirmPayment(order)}>{busy === order._id ? 'Saving...' : 'Confirm payment received'}</button>
                    </footer>}
                  </section></ReviewDrawer>)}
    <div className="ops-insights"><section className="ops-panel"><div className="ops-panel-heading"><div><h2>Order value trend</h2><p className="ops-muted">Last 7 days · Order value including unpaid</p></div></div><div className="ops-chart" aria-label="Daily sales for the last seven days">{daily.map(day => <div className="ops-chart-column" key={dayKey(day.date)}><span>{updated ? money(day.value) : '—'}</span><div className="ops-chart-track"><div style={{
                height: `${day.value / max * 100}%`
              }} /></div><span>{day.date.toLocaleDateString('en-PH', {
                timeZone: 'Asia/Manila',
                month: 'short',
                day: 'numeric'
              })}</span></div>)}</div></section><section className="ops-panel"><div className="ops-panel-heading"><div><h2>Top-selling items</h2><p className="ops-muted">{periodLabel} · Excludes cancelled and refunded</p></div></div><ol className="ops-top-items">{top.map(([name, count]) => <li key={name}><span>{name}</span><strong>{count} sold</strong></li>)}</ol>{!top.length && <p className="ops-empty">{updated ? 'No items sold in this period.' : 'Waiting for order data.'}</p>}</section></div>
    <section className="ops-panel ops-forecast" aria-label="Demand forecast and recommendations"><ForecastChart /></section>
  </main>;
}
