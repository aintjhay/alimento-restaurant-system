import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../services/api';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import OrderRating from '../../components/portal/OrderRating';
import { LuArrowLeft, LuCheck, LuChefHat, LuClock, LuCopy, LuCreditCard, LuPackageCheck, LuReceiptText, LuX } from 'react-icons/lu';
import './Portal.css';
import './PortalTracking.css';

const statuses = {
  pending: 'Waiting for restaurant confirmation', confirmed: 'Order confirmed',
  out_for_delivery: 'Out for delivery', preparing: 'Preparing your order', ready: 'Your order is ready',
  served: 'Order served', completed: 'Order completed', cancelled: 'Order cancelled'
};
const payments = {
  paid: 'Paid', payment_verified: 'Payment verified', refunded: 'Refunded',
  partially_paid: 'Partially paid', payment_pending_verification: 'Awaiting payment verification'
};
const steps = [
  { label: 'Order received', icon: LuReceiptText },
  { label: 'Preparing', icon: LuChefHat },
  { label: 'Ready', icon: LuPackageCheck },
  { label: 'Out for delivery', icon: LuPackageCheck },
  { label: 'Completed', icon: LuCheck }
];
const descriptions = {
  pending: 'Your order is with Alimento. We’ll update you here once the kitchen starts preparing it.',
  confirmed: 'The restaurant has confirmed your order. Your food will be prepared soon.',
  preparing: 'The kitchen is working on your order. Sit back while we prepare your favorites.',
  out_for_delivery: 'Your rider is on the way with your order.',
  ready: 'Your food is ready. Keep this page handy for the next update.',
  served: 'Your order has been marked as served. Thank you for choosing Alimento.',
  completed: 'Thank you for ordering with Alimento. We hope you enjoyed your meal!',
  cancelled: 'This order has been cancelled. Check the payment status below for any payment updates.'
};

export default function PortalTracking() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      let saved;
      try { saved = JSON.parse(localStorage.getItem('portalLastOrder') || 'null'); } catch { /* No usable receipt. */ }
      if (saved?.trackingToken) navigate(`/portal/track/${saved.trackingToken}`, { replace: true });
      else if (saved?.orderNumber) navigate('/portal/confirmation', { replace: true });
      else setError('Open the tracking link saved after placing your order.');
      return;
    }
    let active = true;
    let timer;
    const controller = new AbortController();
    setOrder(null);
    setError('');
    const refresh = async () => {
      try {
        const response = await fetch(`${API_URL}/orders/track/${encodeURIComponent(token)}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(response.status === 404 ? 'This tracking link is invalid or no longer available.' : 'Unable to refresh your order. Retrying shortly.');
        if (active) { setOrder(result.order); setError(''); }
      } catch (err) {
        if (active) setError(err.message || 'Unable to load order status.');
      } finally {
        if (active) timer = setTimeout(refresh, 5000);
      }
    };
    refresh();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [token, navigate]);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); }
    catch { setError('Copy the tracking link from your browser address bar.'); }
  };

  const cancelled = order?.status === 'cancelled';
  const currentStep = { pending: 0, confirmed: 0, preparing: 1, ready: 2, out_for_delivery: 3, served: 4, completed: 4 }[order?.status] ?? -1;
  const finished = currentStep === 4;
  const StatusIcon = cancelled ? LuX : finished ? LuCheck : currentStep === 1 ? LuChefHat : currentStep === 2 ? LuPackageCheck : LuClock;
  const paymentLabel = payments[order?.paymentStatus] || (order?.paymentStatus === 'unpaid' ? (order?.paymentMethod === 'cash' ? 'Pay on delivery' : 'Awaiting payment') : 'Status unavailable');

  return <div className="portal-page tracking-page">
    <PortalHeader />
    <main className="tracking-shell">
      <button className="tracking-back" onClick={() => navigate('/portal')}><LuArrowLeft aria-hidden="true" /> Back to menu</button>
      <div className="tracking-heading">
        <p className="tracking-eyebrow">YOUR ALIMENTO ORDER</p>
        <h1>Track your order</h1>
        <p>A little closer to your next good meal.</p>
      </div>
      {error && <p className="tracking-error" role="alert">{error}</p>}
      {!order && !error && <div className="tracking-loading" role="status"><LuClock aria-hidden="true" /> Loading your order...</div>}
      {order && <>
        <section className={`tracking-card${cancelled ? ' is-cancelled' : ''}`} aria-label="Order status">
          <div className="tracking-card-top">
            <div><span className="tracking-label">Order number</span><strong>{order.orderNumber}</strong></div>
            <span className={`tracking-update${error ? ' is-paused' : ''}`}><span aria-hidden="true" />{error ? 'Update interrupted' : 'Automatic updates'}</span>
          </div>
          <div className="tracking-status" role="status">
            <span className="tracking-status-icon"><StatusIcon aria-hidden="true" /></span>
            <h2>{statuses[order.status] || 'Order received'}</h2>
            <p>{descriptions[order.status] || 'Check back here for updates from the restaurant.'}</p>
          </div>
          {!cancelled && <ol className="tracking-steps" aria-label="Order progress">
            {steps.map(({ label, icon: Icon }, index) => {
              const complete = index < currentStep || finished;
              return <li key={label} className={`${complete ? 'is-complete' : ''} ${index === currentStep ? 'is-current' : ''}`} aria-current={index === currentStep ? 'step' : undefined}>
                <span className="tracking-step-icon">{complete ? <LuCheck aria-hidden="true" /> : <Icon aria-hidden="true" />}</span>
                <span>{label}</span>
                <small>{complete ? 'Done' : index === currentStep ? 'In progress' : 'Up next'}</small>
              </li>;
            })}
          </ol>}
        </section>
        <OrderRating key={token} order={order} onSubmit={async rating => {
          const response = await fetch(`${API_URL}/orders/track/${encodeURIComponent(token)}/rating`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || 'Unable to save rating. Please try again.');
          return result.rating;
        }} />
        <section className="tracking-payment" aria-label="Payment summary">
          <span className="tracking-payment-icon"><LuCreditCard aria-hidden="true" /></span>
          <div><h2>Payment</h2><p>{order.paymentMethod === 'cash' ? 'Cash on delivery' : order.paymentMethod === 'gcash' ? 'GCash' : order.paymentMethod === 'qrph' ? 'QR Ph' : 'Order payment'}</p></div>
          <strong>{paymentLabel}</strong>
        </section>
      </>}
      {token && <section className="tracking-save" aria-label="Save tracking link">
        <div><h2>Keep your order close</h2><p>Save this private link to check back anytime. No login needed.</p></div>
        <button onClick={copyLink}>{copied ? <LuCheck aria-hidden="true" /> : <LuCopy aria-hidden="true" />}{copied ? 'Link copied' : 'Copy tracking link'}</button>
      </section>}
      <p className="tracking-copy-feedback" role="status">{copied ? 'Tracking link copied.' : ''}</p>
    </main>
    <PortalFooter />
  </div>;
}
