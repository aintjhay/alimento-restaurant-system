import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import { authHeaders } from '../../services/api';
import ForecastChart from '../../components/admin/ForecastChart';
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
export const active = order => ['pending', 'preparing', 'ready', 'served'].includes(status(order));
export const unpaid = order => status(order) !== 'cancelled' && ['unpaid', 'partially_paid', 'payment_pending_verification'].includes(payment(order));
export const sale = order => status(order) !== 'cancelled' && payment(order) !== 'refunded';
const amount = order => Number(order.totalAmount) || 0;
const label = value => value.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
const matches = (order, tab) => tab === 'all' || (tab === 'active' ? active(order) : tab === 'unpaid' ? unpaid(order) : status(order) === 'completed');
export default function OperationsDashboard() {
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState(null);
  const [updated, setUpdated] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('today');
  const [tab, setTab] = useState('active');
  const [sort, setSort] = useState('oldest');
  const [visible, setVisible] = useState(10);
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy] = useState(null);
  const fetching = useRef(false);
  const refresh = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    setRefreshing(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders?limit=0`, {
        headers: authHeaders(),
        signal: controller.signal
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error('Unable to load orders');
      setOrders(data.orders || []);
      setUpdated(new Date());
      setError('');
    } catch {
      setError('Unable to refresh orders. Displayed data may be out of date. Please retry.');
    } finally {
      clearTimeout(timeout);
      fetching.current = false;
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/inventory/alerts/low-stock`, {
      headers: authHeaders(),
      signal: controller.signal
    }).then(response => response.ok ? response.json() : Promise.reject()).then(data => setStock(data.success ? data.items : null)).catch(() => setStock(null));
    return () => controller.abort();
  }, [updated]);
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
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const daily = Array.from({
    length: 7
  }, (_, i) => {
    const date = new Date(`${today}T12:00:00+08:00`);
    date.setDate(date.getDate() - 6 + i);
    return {
      date,
      value: orders.filter(order => dayKey(order.createdAt) === dayKey(date) && sale(order)).reduce((sum, order) => sum + amount(order), 0)
    };
  });
  const max = Math.max(1, ...daily.map(day => day.value));
  return <main className="ops-dashboard">
    <header className="ops-header"><div><p className="ops-eyebrow">ALIMENTO / OPERATIONS</p><h1>Dashboard</h1><p className="ops-muted">{updated ? `Updated ${updated.toLocaleTimeString('en-PH', {
            hour: '2-digit',
            minute: '2-digit'
          })} · Refreshes every 30 seconds` : 'Waiting for restaurant activity'}</p></div><div className="ops-actions"><select aria-label="Reporting period" value={period} onChange={e => {
          setPeriod(e.target.value);
          setVisible(10);
        }}><option value="today">Today</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option></select><button disabled={refreshing} onClick={refresh}>{refreshing ? 'Refreshing…' : 'Refresh'}</button><Link to="/admin/products">Admin Panel</Link><Link className="ops-primary" to="/admin/pos">Go to POS</Link></div></header>
    <nav className="ops-shortcuts" aria-label="Restaurant shortcuts"><Link to="/admin/kitchen">Kitchen display ↗</Link><Link to="/admin/bartender">Bartender display ↗</Link><Link to="/admin/inventory">Inventory ↗</Link><Link to="/admin/sales">Sales reports ↗</Link></nav>
    {error && <div className="ops-notice" role="alert">{error}</div>}
    <section className="ops-metrics" aria-label="Key metrics">{[[`${period === 'today' ? "Today's" : periodLabel} sales`, money(selected.filter(sale).reduce((sum, order) => sum + amount(order), 0)), 'Order value including unpaid; excludes cancelled and refunded'], [`${period === 'today' ? "Today's" : periodLabel} orders`, selected.filter(order => status(order) !== 'cancelled').length, 'Excludes cancelled orders'], ['Active orders', orders.filter(active).length, 'All dates · Pending through served'], ['Unpaid order value', money(orders.filter(unpaid).reduce((sum, order) => sum + amount(order), 0)), 'All dates · Full order values; partial balances unavailable']].map(([title, value, detail]) => <article className="ops-metric" key={title}><h2>{title}</h2><strong>{updated ? value : '—'}</strong><p>{detail}</p></article>)}</section>
    <aside className="ops-attention"><strong>Needs attention</strong><span>{updated ? orders.filter(delayed).length : '—'} orders waiting 30+ min</span><Link to="/admin/inventory">{stock === null ? 'Check inventory alerts' : `${stock.length} low-stock items`} ↗</Link></aside>
    <section className="ops-panel"><div className="ops-panel-heading"><div><h2>Orders</h2><p className="ops-muted">{tab === 'active' || tab === 'unpaid' ? 'Outstanding orders across all dates' : `${periodLabel} · Philippines time`}</p></div><label>Sort <select value={sort} onChange={e => setSort(e.target.value)}><option value="oldest">Oldest first</option><option value="newest">Newest first</option><option value="highest">Highest amount</option></select></label></div>
    <div className="ops-tabs" aria-label="Order filters">{['active', 'unpaid', 'completed', 'all'].map(value => <button key={value} aria-pressed={tab === value} onClick={() => {
          setTab(value);
          setVisible(10);
        }}>{label(value)} <span>{source(value).filter(order => matches(order, value)).length}</span></button>)}</div>
    <div className="ops-table-scroll"><table className="ops-table"><thead><tr>{['Order', 'Table / Type', 'Placed', 'Elapsed', 'Amount', 'Payment', 'Status'].map(title => <th scope="col" key={title}>{title}</th>)}</tr></thead><tbody>{filtered.slice(0, visible).map(order => <React.Fragment key={order._id}><tr className={delayed(order) ? 'ops-delayed' : ''}><td><button className="ops-order-link" aria-expanded={expanded === order._id} onClick={() => setExpanded(expanded === order._id ? null : order._id)}>{order.orderNumber || order._id.slice(-6)}</button></td><td>{String(order.orderType).toLowerCase() === 'delivery' || order.tableNumber === 'Delivery' ? 'Delivery' : order.tableNumber ? `Table ${order.tableNumber}` : label(order.orderType || 'Dine-in')}</td><td>{new Date(order.createdAt).toLocaleString('en-PH', {
                    timeZone: 'Asia/Manila',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td><td>{active(order) ? `${elapsed(order)} min` : '—'}</td><td className="ops-amount">{money(amount(order))}</td><td><span className={unpaid(order) ? 'ops-payment-due' : 'ops-payment'}>{label(payment(order))}</span></td><td><select aria-label={`Status for ${order.orderNumber || order._id}`} value={status(order)} disabled={busy === order._id} onChange={e => updateStatus(order, e.target.value)}>{['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'].map(value => <option key={value} value={value}>{label(value)}</option>)}</select></td></tr>{expanded === order._id && <tr><td colSpan="7" className="ops-order-details"><strong>Order details</strong><ul>{(order.items || []).map((item, i) => <li key={i}>{item.quantity} × {item.name}{item.notes ? ` — ${item.notes}` : ''}</li>)}</ul>{['customerName', 'customerContact', 'customerAddress', 'notes'].map(key => order[key] && <p key={key}>{order[key]}</p>)}<p>Payment method: {label(order.paymentMethod || 'Unknown')}</p></td></tr>}</React.Fragment>)}{!filtered.length && <tr><td colSpan="7" className="ops-empty">{!updated ? error ? 'Orders unavailable. Use Refresh to retry.' : 'Loading orders…' : `No ${tab === 'all' ? '' : tab + ' '}orders to show.`}</td></tr>}</tbody></table></div>{filtered.length > visible && <div className="ops-more"><button onClick={() => setVisible(count => count + 10)}>Show more ({filtered.length - visible} remaining)</button></div>}</section>
    <div className="ops-insights"><section className="ops-panel"><div className="ops-panel-heading"><div><h2>Sales trend</h2><p className="ops-muted">Last 7 days · Order value including unpaid</p></div></div><div className="ops-chart" aria-label="Daily sales for the last seven days">{daily.map(day => <div className="ops-chart-column" key={dayKey(day.date)}><span>{updated ? money(day.value) : '—'}</span><div className="ops-chart-track"><div style={{
                height: `${day.value / max * 100}%`
              }} /></div><span>{day.date.toLocaleDateString('en-PH', {
                timeZone: 'Asia/Manila',
                month: 'short',
                day: 'numeric'
              })}</span></div>)}</div></section><section className="ops-panel"><div className="ops-panel-heading"><div><h2>Top-selling items</h2><p className="ops-muted">{periodLabel} · Excludes cancelled and refunded</p></div></div><ol className="ops-top-items">{top.map(([name, count]) => <li key={name}><span>{name}</span><strong>{count} sold</strong></li>)}</ol>{!top.length && <p className="ops-empty">{updated ? 'No items sold in this period.' : 'Waiting for order data.'}</p>}</section></div>
    <details className="ops-panel ops-forecast"><summary>Demand forecast & recommendations</summary><ForecastChart /></details>
  </main>;
}
