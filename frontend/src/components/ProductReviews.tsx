import React, { useState, useEffect, useCallback } from "react";
import { RatingStars } from "./RatingStars";
import { ratingsApi, Review } from "../api/ratings";

interface ProductReviewsProps {
  productId: number | string;
  averageRating?: number;
  reviewCount?: number;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  averageRating = 0,
  reviewCount = 0,
}) => {
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
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      setSubmitError(
        err?.response?.data?.message ||
          "Failed to submit review. You may need to log in first.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate local breakdown from loaded reviews (or default to 0)
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
    <section
      style={{
        marginTop: "3rem",
        borderTop: "1px solid #e5e7eb",
        paddingTop: "2rem",
      }}
    >
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          marginBottom: "1.5rem",
        }}
      >
        Customer Reviews
      </h2>

      {/* SUMMARY HEADER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "2rem",
          padding: "1.5rem",
          backgroundColor: "#f9fafb",
          borderRadius: "12px",
          marginBottom: "2rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "3rem",
              fontWeight: "800",
              lineHeight: 1,
              color: "#111827",
            }}
          >
            {averageRating.toFixed(1)}
          </div>
          <div style={{ margin: "0.5rem 0" }}>
            <RatingStars
              rating={averageRating}
              showValue={false}
              showCount={false}
              size={20}
            />
          </div>
          <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Based on {displayCount} {displayCount === 1 ? "review" : "reviews"}
          </div>

          <button
            onClick={() => setIsFormOpen((prev) => !prev)}
            style={{
              marginTop: "1.25rem",
              padding: "0.625rem 1.25rem",
              backgroundColor: "#2563eb",
              color: "#fff",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {isFormOpen ? "Cancel" : "Write a Review"}
          </button>
        </div>

        {/* STAR DISTRIBUTION BARS */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {[5, 4, 3, 2, 1].map((star) => {
            const starCount =
              distribution[star as keyof typeof distribution] || 0;
            const percentage =
              reviews.length > 0 ? (starCount / reviews.length) * 100 : 0;

            return (
              <div
                key={star}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "0.875rem",
                }}
              >
                <span style={{ width: "45px", color: "#374151" }}>
                  {star} star
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "8px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: "100%",
                      backgroundColor: "#f59e0b",
                      borderRadius: "999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    width: "35px",
                    textAlign: "right",
                    color: "#6b7280",
                  }}
                >
                  {starCount}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* REVIEW FORM */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "1.5rem",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            marginBottom: "2rem",
            backgroundColor: "#fff",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              marginBottom: "1rem",
            }}
          >
            Write Your Review
          </h3>

          {submitError && (
            <div
              style={{
                color: "#dc2626",
                marginBottom: "1rem",
                fontSize: "0.875rem",
              }}
            >
              {submitError}
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Your Rating <span style={{ color: "#dc2626" }}>*</span>
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

          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Your Review
            </label>
            <textarea
              rows={4}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What did you like or dislike about this product?"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "0.625rem 1.5rem",
              backgroundColor: submitting ? "#9ca3af" : "#16a34a",
              color: "#fff",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}

      {/* REVIEWS LIST */}
      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading reviews...</p>
      ) : error ? (
        <p style={{ color: "#9ca3af", fontStyle: "italic" }}>{error}</p>
      ) : reviews.length === 0 ? (
        <p style={{ color: "#6b7280", fontStyle: "italic" }}>
          No reviews yet for this product. Be the first to write one!
        </p>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {reviews.map((rev) => (
            <div
              key={rev.id}
              style={{
                borderBottom: "1px solid #f3f4f6",
                paddingBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#e0e7ff",
                    color: "#3730a3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "0.875rem",
                  }}
                >
                  {rev.userName ? rev.userName[0].toUpperCase() : "U"}
                </div>
                <div>
                  <div style={{ fontWeight: "600", color: "#111827" }}>
                    {rev.userName || "Verified Buyer"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
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
                <p style={{ marginTop: "0.5rem", color: "#374151" }}>
                  {rev.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
