import React, { useEffect, useMemo, useState } from 'react';
import './Reviews.css';

const REVIEW_FILTERS = ['All Reviews', 'Grooming', 'Boarding', 'Birthday Party', 'Orders'];
const STAR_FILTERS = ['All Ratings', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const RECORDS_PER_PAGE = 10;

const mapReview = (review) => ({
  id: review.reviewId || review.review_id || String(review.id),
  customerName: review.customerName || review.customer_name || 'Anonymous',
  service: review.service || 'Service',
  category: review.category || 'Orders',
  rating: Number(review.rating || 0),
  score: review.score || `${Number(review.rating || 0)}/5`,
  date: review.date || review.review_date || '',
  petName: review.petName || review.pet_name || 'N/A',
  review: review.review || review.review_text || '',
  wouldRecommend: Boolean(review.wouldRecommend ?? review.would_recommend),
  transaction: review.transaction || {
    reference: review.reference || '',
    serviceName: review.serviceName || '',
    bookedDate: review.bookedDate || '',
    time: review.time || '',
    paymentMethod: review.paymentMethod || '',
    paymentStatus: review.paymentStatus || '',
    total: review.total || ''
  }
});

function Reviews() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Reviews');
  const [starFilter, setStarFilter] = useState('All Ratings');
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/reviews`);
        if (!response.ok) {
          throw new Error(`Failed to fetch reviews (${response.status})`);
        }

        const payload = await response.json();
        const nextReviews = Array.isArray(payload.reviews) ? payload.reviews.map(mapReview) : [];
        setReviews(nextReviews);
        setError('');
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load reviews.');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => reviews.filter((review) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = review.customerName.toLowerCase().includes(search)
      || review.service.toLowerCase().includes(search)
      || review.review.toLowerCase().includes(search)
      || review.transaction.reference.toLowerCase().includes(search);
    const matchesCategory = categoryFilter === 'All Reviews' || review.category === categoryFilter;
    const matchesStar = starFilter === 'All Ratings' || review.rating === Number(starFilter.charAt(0));

    return matchesSearch && matchesCategory && matchesStar;
  }), [reviews, searchTerm, categoryFilter, starFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, starFilter, reviews]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / RECORDS_PER_PAGE));
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    return filteredReviews.slice(startIndex, startIndex + RECORDS_PER_PAGE);
  }, [filteredReviews, currentPage]);
  const pageStart = filteredReviews.length === 0 ? 0 : (currentPage - 1) * RECORDS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * RECORDS_PER_PAGE, filteredReviews.length);

  const reviewStats = useMemo(() => {
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : '0.0';
    const recommendedCount = reviews.filter((review) => review.wouldRecommend).length;
    const recommendationRate = totalReviews > 0 ? Math.round((recommendedCount / totalReviews) * 100) : 0;
    const fiveStarCount = reviews.filter((review) => review.rating === 5).length;

    return {
      averageRating,
      totalReviews,
      recommendationRate,
      fiveStarCount
    };
  }, [reviews]);

  return (
    <div className="reviews-container">
      <section className="reviews-hero-card">
        <div className="reviews-hero-copy">
          <h1 className="reviews-title">Community Reviews</h1>
          <p className="reviews-subtitle">Customer feedback, service insights, and transaction context for the admin team.</p>
        </div>

        <div className="reviews-summary-grid">
          <div className="reviews-summary-tile">
            <strong>{reviewStats.averageRating}/5</strong>
            <span>Average Rating</span>
          </div>
          <div className="reviews-summary-tile">
            <strong>{reviewStats.totalReviews.toLocaleString()}</strong>
            <span>Total Reviews</span>
          </div>
          <div className="reviews-summary-tile">
            <strong>{reviewStats.recommendationRate}%</strong>
            <span>Would Recommend</span>
          </div>
          <div className="reviews-summary-tile">
            <strong>{reviewStats.fiveStarCount}</strong>
            <span>Five-Star Reviews</span>
          </div>
        </div>
      </section>

      <section className="reviews-toolbar">
        <input
          type="text"
          className="reviews-search-input"
          placeholder="Search reviews, transaction IDs, services, or customer names..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <div className="reviews-filter-row">
          {REVIEW_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`reviews-filter-chip ${categoryFilter === filter ? 'active' : ''}`}
              onClick={() => setCategoryFilter(filter)}
            >
              {filter}
            </button>
          ))}
          <select
            className="reviews-filter-select"
            value={starFilter}
            onChange={(event) => setStarFilter(event.target.value)}
          >
            {STAR_FILTERS.map((filter) => (
              <option key={filter}>{filter}</option>
            ))}
          </select>
        </div>
      </section>

      {error && <div className="reviews-feedback reviews-feedback--error">{error}</div>}
      {loading && <div className="reviews-feedback">Loading reviews...</div>}

      {!loading && (
        <>
          <section className="reviews-grid">
            {paginatedReviews.map((review) => (
              <article key={review.id} className="review-card">
              <div className="review-card-header">
                <div className="review-customer">
                  <div className="review-avatar">
                    {review.customerName.charAt(0)}
                  </div>
                  <div>
                    <h2>{review.customerName}</h2>
                    <p>{review.service}</p>
                  </div>
                </div>
                <div className="review-score-pill">{review.score}</div>
              </div>

              <div className="review-meta-row">
                <div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>
                  {'★'.repeat(review.rating)}
                </div>
                <button
                  type="button"
                  className="review-details-btn"
                  onClick={() => setSelectedReview(review)}
                >
                  View Details
                </button>
              </div>

              <p className="review-text">{review.review}</p>

              <div className="review-detail-row">
                <span>{review.date}</span>
                <span>{review.category}</span>
                <span>Pet: {review.petName}</span>
              </div>
              </article>
            ))}
          </section>
          <div className="records-footer">
            <div className="customers-results-count">
              Showing {pageStart}-{pageEnd} of {filteredReviews.length} reviews
            </div>
            {filteredReviews.length > RECORDS_PER_PAGE && (
              <div className="records-pagination records-pagination--inline">
                <button
                  type="button"
                  className="records-pagination__btn records-pagination__btn--small"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <div className="records-pagination__info">Page {currentPage} of {totalPages}</div>
                <button
                  type="button"
                  className="records-pagination__btn records-pagination__btn--small"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {!loading && filteredReviews.length === 0 && (
        <div className="reviews-feedback">No reviews found.</div>
      )}

      {selectedReview && (
        <div className="reviews-modal-overlay" onClick={() => setSelectedReview(null)}>
          <div className="reviews-modal" onClick={(event) => event.stopPropagation()}>
            <div className="reviews-modal-header">
              <div>
                <h2>Review Details</h2>
                <p>{selectedReview.customerName} • {selectedReview.transaction.reference}</p>
              </div>
              <button type="button" className="reviews-modal-close" onClick={() => setSelectedReview(null)}>
                ×
              </button>
            </div>

            <div className="reviews-modal-body">
              <div className="reviews-modal-grid">
                <div className="reviews-modal-card">
                  <h3>Customer Review</h3>
                  <p><strong>Service:</strong> {selectedReview.service}</p>
                  <p><strong>Pet:</strong> {selectedReview.petName}</p>
                  <p><strong>Date Submitted:</strong> {selectedReview.date}</p>
                  <p><strong>Rating:</strong> {selectedReview.score}</p>
                  <p className="reviews-modal-copy">{selectedReview.review}</p>
                </div>

                <div className="reviews-modal-card">
                  <h3>Transaction Details</h3>
                  <p><strong>Reference:</strong> {selectedReview.transaction.reference}</p>
                  <p><strong>Booked Service:</strong> {selectedReview.transaction.serviceName}</p>
                  <p><strong>Date:</strong> {selectedReview.transaction.bookedDate}</p>
                  <p><strong>Time:</strong> {selectedReview.transaction.time}</p>
                  <p><strong>Payment Method:</strong> {selectedReview.transaction.paymentMethod}</p>
                  <p><strong>Payment Status:</strong> {selectedReview.transaction.paymentStatus}</p>
                  <p><strong>Total:</strong> {selectedReview.transaction.total}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reviews;
