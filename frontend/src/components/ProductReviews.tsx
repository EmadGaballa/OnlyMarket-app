import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { RatingStars } from "./RatingStars";
import { ratingsApi, Review } from "../api/ratings";
import { useAuth } from "../context/AuthContext";
import styles from "./ProductReviews.module.css";

interface ProductReviewsProps {
  productId: number | string;
  averageRating?: number;
  reviewCount?: number;
  onReviewSubmitted?: () => void;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  averageRating = 0,
  reviewCount = 0,
  onReviewSubmitted,
}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const location = useLocation();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [newRating, setNewRating] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load reviews safely
  const loadReviewData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ratingsApi.getReviews(productId);
      setReviews(response.data || []);
    } catch (err: any) {
      console.error("Failed to load reviews from API:", err);
      // Graceful fallback if endpoint fails or returns 500/404
      setError("Unable to load reviews at this time.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviewData();
  }, [loadReviewData]);

  // Handle submit review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRating === 0) {
      setSubmitError("Please select a star rating.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      await ratingsApi.submitReview(productId, {
        rating: newRating,
        comment: newComment,
      });

      setNewRating(0);
      setNewComment("");
      setIsFormOpen(false);
      await loadReviewData();
      onReviewSubmitted?.();
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      let message = "Failed to submit review. You may need to log in first.";
      try {
        const parsed = JSON.parse(err?.message ?? "{}");
        if (parsed?.message) message = parsed.message;
      } catch {
        // Fall back to generic message
      }
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate local breakdown from loaded reviews
  const distribution = reviews.reduce(
    (acc, rev) => {
      const r = Math.round(rev.rating) as 1 | 2 | 3 | 4 | 5;
      if (acc[r] !== undefined) acc[r]++;
      return acc;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  );

  const displayCount = reviews.length > 0 ? reviews.length : reviewCount;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Customer Reviews</h2>

      {/* SUMMARY HEADER */}
      <div className={styles.summaryGrid}>
        <div className={styles.scoreContainer}>
          <div className={styles.scoreValue}>{averageRating.toFixed(1)}</div>
          <div className={styles.starsWrapper}>
            <RatingStars
              rating={averageRating}
              showValue={false}
              showCount={false}
              size={20}
            />
          </div>
          <div className={styles.countSubtitle}>
            Based on {displayCount} {displayCount === 1 ? "review" : "reviews"}
          </div>

          {authLoading ? null : isAuthenticated ? (
            <button
              onClick={() => setIsFormOpen((prev) => !prev)}
              className={styles.actionButton}
            >
              {isFormOpen ? "Cancel" : "Write a Review"}
            </button>
          ) : (
            <Link
              to="/login"
              state={{ from: { pathname: location.pathname } }}
              className={styles.loginLink}
            >
              Log in to write a review
            </Link>
          )}
        </div>

        {/* STAR DISTRIBUTION BARS */}
        <div className={styles.distributionList}>
          {[5, 4, 3, 2, 1].map((star) => {
            const starCount =
              distribution[star as keyof typeof distribution] || 0;
            const percentage =
              reviews.length > 0 ? (starCount / reviews.length) * 100 : 0;

            return (
              <div key={star} className={styles.distributionRow}>
                <span className={styles.starLabel}>{star} star</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className={styles.starCountLabel}>{starCount}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* REVIEW FORM */}
      {isAuthenticated && isFormOpen && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <h3 className={styles.formTitle}>Write Your Review</h3>

          {submitError && (
            <div className={styles.errorMessage}>{submitError}</div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Your Rating <span className={styles.requiredAsterisk}>*</span>
            </label>
            <RatingStars
              rating={newRating}
              interactive={true}
              onRate={(selected) => setNewRating(selected)}
              showValue={false}
              showCount={false}
              size={24}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Your Review</label>
            <textarea
              rows={4}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What did you like or dislike about this product?"
              className={styles.textarea}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={styles.submitButton}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}

      {/* REVIEWS LIST */}
      {loading ? (
        <p className={styles.statusText}>Loading reviews...</p>
      ) : error ? (
        <p className={styles.statusErrorText}>{error}</p>
      ) : reviews.length === 0 ? (
        <p className={styles.statusEmptyText}>
          No reviews yet for this product. Be the first to write one!
        </p>
      ) : (
        <div className={styles.reviewsList}>
          {reviews.map((rev) => (
            <div key={rev.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.avatar}>
                  {rev.userName ? rev.userName[0].toUpperCase() : "U"}
                </div>
                <div>
                  <div className={styles.authorName}>
                    {rev.userName || "Verified Buyer"}
                  </div>
                  <div className={styles.reviewDate}>
                    {rev.createdAt
                      ? new Date(rev.createdAt).toLocaleDateString()
                      : ""}
                  </div>
                </div>
              </div>

              <RatingStars
                rating={rev.rating}
                showValue={false}
                showCount={false}
                size={14}
              />

              {rev.comment && (
                <p className={styles.commentText}>{rev.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
