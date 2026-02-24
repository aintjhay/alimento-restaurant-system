import React, { useState } from 'react';
import axios from 'axios';

const ReviewModal = ({ itemId, itemName, orderId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const API_BASE = 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/reviews`, {
        userId,
        userName,
        orderId,
        menuItemId: itemId,
        itemName,
        rating: parseInt(rating),
        title,
        comment
      });

      if (response.data.success) {
        alert('Thank you for your review!');
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting review');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⭐ Rate & Review</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          <div className="form-group">
            <label>Item: {itemName}</label>
          </div>

          {/* Star Rating */}
          <div className="form-group">
            <label>Rating</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star ${rating >= star ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <span className="rating-text">{rating} out of 5 stars</span>
          </div>

          {/* Title */}
          <div className="form-group">
            <label>Review Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Delicious and fresh!"
              maxLength="100"
            />
            <small>{title.length}/100</small>
          </div>

          {/* Comment */}
          <div className="form-group">
            <label>Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this item..."
              rows="4"
              maxLength="500"
            />
            <small>{comment.length}/500</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? '⏳ Submitting...' : '✅ Submit Review'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
