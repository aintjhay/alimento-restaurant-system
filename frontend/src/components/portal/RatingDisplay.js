import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RatingDisplay = ({ itemId, showReviews = false }) => {
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0
  });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchRatingStats();
    if (showReviews) {
      fetchReviews();
    }
  }, [itemId, showReviews]);

  const fetchRatingStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/reviews/item/${itemId}?limit=5`);
      if (response.data.success) {
        setStats(response.data.stats);
        setReviews(response.data.reviews);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching ratings:', err);
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_BASE}/reviews/item/${itemId}?limit=100`);
      if (response.data.success) {
        setReviews(response.data.reviews);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  if (loading) {
    return <div className="rating-loading">Loading ratings...</div>;
  }

  const renderStars = (rating) => {
    return (
      <span className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`star ${rating >= star ? 'active' : ''}`}>
            ★
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="rating-display">
      {/* Summary Card */}
      <div className="rating-summary">
        <div className="rating-score">
          <span className="big-number">{stats.averageRating.toFixed(1)}</span>
          <div>
            {renderStars(Math.round(stats.averageRating))}
            <p className="review-count">({stats.totalReviews} reviews)</p>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {showReviews && reviews.length > 0 && (
        <div className="reviews-section">
          <h4>Customer Reviews</h4>
          <div className="reviews-list">
            {reviews.slice(0, showAllReviews ? reviews.length : 3).map((review) => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <span className="reviewer-name">{review.userName}</span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="review-rating">
                    {renderStars(review.rating)}
                  </div>
                </div>
                {review.title && <p className="review-title">{review.title}</p>}
                {review.comment && <p className="review-text">{review.comment}</p>}
              </div>
            ))}
          </div>

          {reviews.length > 3 && (
            <button
              className="view-more-reviews"
              onClick={() => setShowAllReviews(!showAllReviews)}
            >
              {showAllReviews ? '👆 Show Less' : '👇 View All Reviews'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;
