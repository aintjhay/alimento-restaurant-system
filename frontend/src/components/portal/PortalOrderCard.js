import React, { useId, useState } from 'react';
import { LuChevronDown, LuClock, LuCheck, LuX, LuMapPin, LuReceiptText, LuCreditCard } from 'react-icons/lu';
import { orderItemTotal } from '../../utils/orderUtils';
import './PortalOrderCard.css';

const states = { pending: 'Awaiting confirmation', confirmed: 'Confirmed', preparing: 'Preparing', ready: 'Ready', served: 'Served', completed: 'Completed', cancelled: 'Cancelled' };
const money = value => value != null && Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value)) : 'Unavailable';
const dateText = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
const title = value => value.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()).replace(/\bBbq\b/g, 'BBQ');

const PortalOrderCard = ({ order, onReorder }) => {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const items = order.items || [];
  const quantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const terminal = ['completed', 'served', 'cancelled'].includes(order.status);
  const Icon = order.status === 'cancelled' ? LuX : terminal ? LuCheck : LuClock;
  const payment = { paid: 'Paid', payment_verified: 'Payment verified', refunded: 'Refunded', partially_paid: 'Partially paid', payment_pending_verification: 'Awaiting payment verification' }[order.paymentStatus] || (order.paymentMethod === 'cash' ? 'Pay on delivery' : 'Awaiting payment');
  const method = { cash: 'Cash on delivery', qrph: 'QR Ph', gcash: 'GCash', card: 'Card', maya: 'Maya', bank_transfer: 'Bank transfer' }[order.paymentMethod] || 'Not available';
  return (
    <article className="history-card">
      <div className="history-card-heading">
        <div className="history-order-identity"><span className="history-order-icon"><LuReceiptText aria-hidden="true" /></span><div><h2>{order.orderNumber || 'Order'}</h2><p>{dateText(order.createdAt)}</p></div></div>
        <span className={`history-status ${order.status === 'cancelled' ? 'cancelled' : terminal ? 'finished' : ''}`}><Icon aria-hidden="true" />{states[order.status] || 'Status unavailable'}</span>
      </div>
      <div className="history-card-summary"><div><span className="history-summary-label">{quantity} {quantity === 1 ? 'item' : 'items'}{order.orderType ? ` · ${order.orderType}` : ''}</span><p className="history-item-preview">{items.slice(0, 2).map(item => title(item.name || item.menuItemId?.name || 'Item')).join(', ')}{items.length > 2 ? ` +${items.length - 2} more` : ''}</p></div><div className="history-summary-total"><span className="history-summary-label">Order total</span><strong>{money(order.totalAmount)}</strong></div></div>
      <div className="history-card-bottom"><span className="history-payment-caption"><LuCreditCard aria-hidden="true" />{payment}</span><button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls={detailsId}>{expanded ? 'Hide details' : 'View details'}<LuChevronDown aria-hidden="true" className={expanded ? 'rotated' : ''} /></button></div>
      {expanded && <div id={detailsId} className="history-details">
        <section className="history-progress" aria-label="Order progress">
          <h3>Order progress</h3>
          {order.status === 'pending' && <p>Waiting for restaurant confirmation.</p>}
          {order.status === 'cancelled' ? <p>This order was cancelled.</p> : <ol>{['pending', 'preparing', 'ready', 'completed'].map((step, index) => {
            const current = { pending: 0, confirmed: 0, preparing: 1, ready: 2, served: 3, completed: 3 }[order.status];
            return <li key={step} className={index <= current ? 'reached' : ''} aria-current={index === current ? 'step' : undefined}><span aria-hidden="true">{index < current ? <LuCheck /> : index + 1}</span>{['Received', 'Preparing', 'Ready', 'Completed'][index]}</li>;
          })}</ol>}
          {!terminal && order.status !== 'pending' && order.estimatedCompletionTime && <p>Estimated ready: {dateText(order.estimatedCompletionTime)}</p>}
        </section>
        <section className="history-items"><h3>Items</h3>{items.map((item, index) => <div className="history-item" key={item._id || index}><div><strong>{item.quantity || 1} &times; {title(item.name || item.menuItemId?.name || 'Item details unavailable')}</strong>{(item.modifiers || []).map((mod, i) => <small key={i}>{mod.modifierName}: {mod.selectedOption}</small>)}{(item.addons || []).map((addon, i) => <small key={i}>+ {addon.name}</small>)}{item.specialInstructions && <small>Note: {item.specialInstructions}</small>}</div><span>{money(orderItemTotal(item))}</span></div>)}</section>
        <div className="history-detail-columns">
          <div className="history-fulfillment">
            <section aria-label="Delivery">
              <h3>Delivery</h3>
              <div className="history-delivery-address"><LuMapPin aria-hidden="true" /><p>{order.customerAddress || 'Address not available'}</p></div>
              {(order.customerName || order.customerContact) && (
                <dl className="history-recipient">
                  {order.customerName && <div><dt>Recipient</dt><dd>{order.customerName}</dd></div>}
                  {order.customerContact && <div><dt>Contact number</dt><dd>{order.customerContact}</dd></div>}
                </dl>
              )}
            </section>
            <section aria-label="Payment" className="history-payment">
              <h3>Payment</h3>
              <p className="history-payment-method">{method}</p>
              {order.paymentMethod === 'cash' && order.paymentStatus === 'unpaid' && order.status !== 'cancelled' ? (
                <p className="history-payment-help">Pay when your order arrives.</p>
              ) : (
                <span className={`history-payment-badge ${['paid', 'payment_verified'].includes(order.paymentStatus) ? 'paid' : ''}`}>
                  {order.paymentMethod === 'cash' && order.paymentStatus === 'unpaid' ? 'Unpaid' : payment}
                </span>
              )}
            </section>
          </div>
          <section><h3>Order total</h3><dl className="history-totals"><div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>{Number(order.taxAmount) > 0 && <div><dt>Tax</dt><dd>{money(order.taxAmount)}</dd></div>}{Number(order.deliveryFee) > 0 && <div><dt>Delivery fee</dt><dd>{money(order.deliveryFee)}</dd></div>}{Number(order.discount) > 0 && <div><dt>Discount</dt><dd>-{money(order.discount)}</dd></div>}<div className="history-grand-total"><dt>Total</dt><dd>{money(order.totalAmount)}</dd></div></dl></section>
        </div>
        {order.status === 'completed' && onReorder && <button className="history-reorder" onClick={() => onReorder(order)}>Order again</button>}
      </div>}
    </article>
  );
};
export default PortalOrderCard;
