import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import AdminNav from '../../components/admin/AdminNav';
import { API_URL, authHeaders } from '../../services/api';
import './SalesReport.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);
const money = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value || 0);
const date = value => new Date(value).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' });
const statuses = { paid: 'Paid', payment_verified: 'Paid (verified)', unpaid: 'Unpaid', payment_pending_verification: 'Pending verification', partially_paid: 'Partially paid', refunded: 'Refunded' };
const methods = { cash: 'Cash', card: 'Card', gcash: 'GCash', qrph: 'QR Ph', maya: 'Maya', bank_transfer: 'Bank transfer', others: 'Other' };
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export default function SalesReport() {
  const [view, setView] = useState('all');
  const [startDate, setStartDate] = useState(today), [endDate, setEndDate] = useState(today);
  const [paymentStatus, setPaymentStatus] = useState('all'), [search, setSearch] = useState('');
  const [report, setReport] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [selected, setSelected] = useState(null), [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setReport(null); setSelected(null);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ view, paymentStatus, search, ...(view === 'custom' ? { startDate, endDate } : {}) });
        const response = await fetch(`${API_URL}/admin/sales?${params}`, { headers: authHeaders(), signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || 'Unable to load sales report.');
        if (!controller.signal.aborted) setReport(body);
      } catch (e) { if (!controller.signal.aborted) setError(e.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [view, startDate, endDate, paymentStatus, search, refresh]);
  const exportCsv = () => {
    const cell = value => `"${String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;
    const rows = [['Date (Asia/Manila)', 'Order', 'Customer', 'Payment status', 'Payment method', 'Total (PHP)'], ...report.data.map(o => [new Date(o.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }), o.orderNumber, o.customerName || 'Walk-in', statuses[o.paymentStatus] || o.paymentStatus, methods[o.paymentMethod] || o.paymentMethod, o.totalAmount.toFixed(2)])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = `sales-report-${view}-${today}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const summary = report?.summary;
  return <AdminNav title="Sales Report"><div className="sales-report">
    <p className="sales-muted">Sales by order date · Philippine time · Cancelled orders excluded</p>
    <div className="admin-toolbar sales-controls sales-filter-panel" aria-label="Report filters">
      <div className="sales-periods" role="group" aria-label="Report period">{[['all', 'All time'], ['today', 'Today'], ['weekly', 'This week'], ['monthly', 'This month'], ['custom', 'Custom range']].map(([value, label]) => <button key={value} className={`admin-button ${view === value ? 'is-active' : 'secondary'}`} aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}</div>
      {view === 'custom' && <><label>From<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label><label>To<input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label></>}
      <label>Payment status<select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}><option value="all">All statuses</option>{Object.entries(statuses).filter(([key]) => key !== 'payment_verified').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="sales-search">Search orders<input type="search" placeholder="Order number or customer" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <button className="admin-button secondary" onClick={() => setRefresh(n => n + 1)}>Refresh</button>
    </div>
    {loading && <p className="sales-loading" role="status">Loading sales report…</p>}
    {error && <p className="admin-error" role="alert">{error}</p>}
    {report && <>
      <div className="sales-heading"><div><h2>{report.range.start ? `${date(report.range.start)} – ${date(report.range.end)}` : `All time through ${date(report.range.end)}`}</h2><p className="sales-muted">All totals and insights reflect the selected filters.</p></div><div className="admin-actions sales-controls"><button className="admin-button secondary" onClick={exportCsv} disabled={!report.data.length}>Export CSV</button><button className="admin-button" onClick={() => window.print()}>Print report</button></div></div>
      <div className="admin-cards sales-cards">{[['Paid sales', money(summary.totalSales)], ['Paid orders', summary.paidOrderCount], ['Average paid order', money(summary.averageOrderValue)], ['Items sold', summary.itemsSold]].map(([label, value]) => <div className="admin-card" key={label}><small>{label}</small><h2>{value}</h2></div>)}</div>
      <p className="sales-muted sales-summary-note">Based on paid and verified orders.</p>
      <details className="sales-payment-details">
        <summary>Payment details &amp; totals</summary>
        <dl className="sales-secondary-totals">{[['Payments collected', money(summary.collected)], ['Refunds recorded', money(summary.refunds)], ['Outstanding balance', money(summary.unpaidTotal)], ['Total orders', summary.orderCount]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <p className="sales-muted">Outstanding balance includes unpaid orders, payments awaiting verification, and known remaining balances on partially paid orders.</p>
        {summary.unknownPartialBalances > 0 && <p className="sales-muted">{summary.unknownPartialBalances} partially paid order(s) have an unknown balance and are excluded from the outstanding total.</p>}
      </details>
      {report.comparison && <p className="sales-comparison">Paid sales {report.comparison.totalSales ? `${((summary.totalSales - report.comparison.totalSales) / report.comparison.totalSales * 100).toFixed(1)}% versus the previous equivalent period` : 'comparison unavailable: no paid sales in the previous equivalent period'} · {date(report.comparison.start)} – {date(report.comparison.end)} ({money(report.comparison.totalSales)})</p>}
      <div className="sales-insights"><section className="admin-card"><h2>Paid sales trend</h2>{report.trend.length ? <div className="sales-chart"><Line aria-label="Paid sales by order date" role="img" data={{ labels: report.trend.map(point => date(`${point.date}T00:00:00+08:00`)), datasets: [{ label: 'Paid sales (PHP)', data: report.trend.map(point => point.total), borderColor: '#2f6f6a', backgroundColor: '#2f6f6a', tension: 0.2 }] }} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }} /></div> : <div className="sales-insight-empty"><strong>No sales yet</strong><p>Paid orders in this period will appear here.</p></div>}</section><section className="admin-card"><h2>Top-selling items</h2><p className="sales-muted">By quantity in paid orders</p>{report.topItems.length ? <table className="admin-table"><thead><tr><th>Item</th><th className="sales-number">Quantity</th></tr></thead><tbody>{report.topItems.map(item => <tr key={item.id}><td>{item.name}</td><td className="sales-number">{item.quantity}</td></tr>)}</tbody></table> : <div className="sales-insight-empty"><strong>No items to rank</strong><p>Your best sellers will appear after a paid order.</p></div>}</section></div>
      <h2 className="sales-history-heading">Order history <small>{report.data.length} orders</small></h2><div className="sales-table-wrap"><table className="admin-table"><thead><tr><th>Date</th><th>Order</th><th>Customer</th><th>Payment status</th><th>Method</th><th className="sales-number">Total</th></tr></thead><tbody>{report.data.map(o => <tr key={o._id}><td className="sales-date">{date(o.createdAt)}<small>{new Date(o.createdAt).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' })}</small></td><td><button className="sales-order-link" onClick={() => setSelected(selected?._id === o._id ? null : o)} aria-expanded={selected?._id === o._id} aria-controls="sales-order-details">{o.orderNumber}</button></td><td>{o.customerName || 'Walk-in'}</td><td><span className={`sales-badge ${o.paymentStatus}`}>{statuses[o.paymentStatus] || o.paymentStatus}</span></td><td>{methods[o.paymentMethod] || '—'}</td><td className="sales-number">{money(o.totalAmount)}</td></tr>)}{!report.data.length && <tr><td colSpan="6" className="sales-empty">No orders match these filters.</td></tr>}</tbody></table></div>
      {selected && <section className="admin-card sales-details" id="sales-order-details" aria-label="Order details"><div className="sales-heading"><h2>{selected.orderNumber}</h2><button className="admin-button secondary" onClick={() => setSelected(null)}>Close details</button></div><p>{selected.customerName || 'Walk-in'} · {selected.orderType} · {selected.status}</p><table className="admin-table"><thead><tr><th>Item</th><th>Quantity</th><th className="sales-number">Amount</th></tr></thead><tbody>{selected.items.map((item, index) => <tr key={item._id || index}><td>{item.name}{item.itemStatus === 'cancelled' ? ' (cancelled)' : ''}</td><td>{item.quantity}</td><td className="sales-number">{money(item.itemTotal)}</td></tr>)}</tbody></table><p>Subtotal: {money(selected.subtotal)} · Tax: {money(selected.taxAmount)} · Discount: {money(selected.discount)} · Delivery: {money(selected.deliveryFee)}</p><strong>Total: {money(selected.totalAmount)}</strong></section>}
    </>}
  </div></AdminNav>;
}
