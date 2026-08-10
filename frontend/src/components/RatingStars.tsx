import React, { useState } from "react";

interface RatingStarsProps {
  rating?: number; // e.g. 4.5
  maxStars?: number; // default: 5
  reviewCount?: number; // e.g. 142
  size?: number; // icon size in px (default: 16)
  showValue?: boolean; // show numerical rating (e.g. "4.5")
  showCount?: boolean; // show review count (e.g. "(142)")
  interactive?: boolean; // allow click-to-rate
  onRate?: (rating: number) => void;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating = 0,
  maxStars = 5,
  reviewCount,
  size = 16,
  showValue = true,
  showCount = true,
  interactive = false,
  onRate,
  className = "",
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const activeRating = hoverRating ?? rating;

  const handleStarClick = (index: number) => {
    if (interactive && onRate) {
      onRate(index);
    }
  };

  return (
    <div
      aria-label={`Rating: ${rating.toFixed(1)} out of ${maxStars}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: `${size * 0.875}px`,
        lineHeight: 1,
      }}
      className={className}
    >
      <div style={{ display: "inline-flex", gap: "2px" }}>
        {Array.from({ length: maxStars }).map((_, i) => {
          const starValue = i + 1;
          const fillPercentage = Math.max(
            0,
            Math.min(100, (activeRating - i) * 100),
          );

          return (
            <span
              key={i}
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              style={{
                position: "relative",
                width: `${size}px`,
                height: `${size}px`,
                cursor: interactive ? "pointer" : "default",
                display: "inline-block",
              }}
            >
              {/* Background Empty Star */}
              <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="#e5e7eb"
                style={{ position: "absolute", top: 0, left: 0 }}
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>

              {/* Filled Star with Fractional Width */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: `${fillPercentage}%`,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}
              >
                <svg
                  width={size}
                  height={size}
                  viewBox="0 0 24 24"
                  fill="#f59e0b"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>
            </span>
          );
        })}
      </div>

      {showValue && (
        <span style={{ fontWeight: 600, color: "#374151" }}>
          {rating ? rating.toFixed(1) : "0.0"}
        </span>
      )}

      {showCount && reviewCount !== undefined && (
        <span style={{ color: "#6b7280" }}>({reviewCount})</span>
      )}
    </div>
  );
};
