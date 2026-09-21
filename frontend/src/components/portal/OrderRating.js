import React, { useRef, useState } from 'react';
import { API_URL } from '../../services/api';
import { FiCheck, FiStar } from 'react-icons/fi';
import './OrderRating.css';

const ratingLabels = ['Select a rating', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
export default function OrderRating({ order, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(null);
  const saved = order.rating || submitted;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(0);
  const submitting = useRef(false);
  if (order.status !== 'completed') return null;
  const submit = async () => {
    if (!rating || saved || submitting.current) return;
    submitting.current = true;
    setBusy(true); setError('');
    try {
      let savedRating;
      if (onSubmit) {
        savedRating = await onSubmit(rating);
      } else {
        const response = await fetch(`${API_URL}/orders/${order._id}/rating`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('portalToken')}` }, body: JSON.stringify({ rating }) });
        const result = await response.json(); if (!response.ok) throw new Error(result.message);
        savedRating = result.rating;
      }
      if (!Number.isInteger(savedRating) || savedRating < 1 || savedRating > 5) throw new Error('Unable to save rating. Please try again.');
      setSubmitted(savedRating);
    } catch (e) { setError(e.message || 'Unable to save rating. Please try again.'); } finally { submitting.current = false; setBusy(false); }
  };
  return (
    <section aria-label="Rate your order" className="order-rating">
      <div className="order-rating-heading">
        <span className="order-rating-icon" aria-hidden="true">{saved ? <FiCheck /> : <FiStar />}</span>
        <div>
          <h3>{saved ? 'Thank you for your rating!' : 'How was your order?'}</h3>
          <p>{saved ? `You rated this order ${saved}/5. We appreciate your feedback.` : 'A little feedback helps us serve you better.'}</p>
        </div>
      </div>
      {saved ? (
        <div className="order-rating-saved" role="status" aria-label={`${saved} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map(value => <FiStar key={value} aria-hidden="true" className={value <= saved ? 'is-filled' : ''} />)}
        </div>
      ) : (
        <div className="order-rating-actions">
          <div className="order-rating-selection">
            <div className="order-rating-stars" role="group" aria-label="Star rating" onMouseLeave={() => setHovered(0)}>
              {[1, 2, 3, 4, 5].map(value => (
                <button key={value} className={`order-rating-star${value <= (hovered || rating) ? ' is-filled' : ''}`} type="button" disabled={busy} aria-label={`${value} star${value > 1 ? 's' : ''}`} aria-pressed={rating === value} onMouseEnter={() => setHovered(value)} onFocus={() => setHovered(value)} onBlur={() => setHovered(0)} onClick={() => setRating(value)}>
                  <FiStar aria-hidden="true" />
                </button>
              ))}
            </div>
            <span className="order-rating-label" aria-live="polite">{ratingLabels[hovered || rating]}</span>
          </div>
          <button className="order-rating-submit" type="button" disabled={!rating || busy} onClick={submit}>{busy ? 'Saving...' : 'Submit rating'}</button>
        </div>
      )}
      {error && <p className="order-rating-error" role="alert">{error}</p>}
    </section>
  );
}
