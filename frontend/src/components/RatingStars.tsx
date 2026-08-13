import React, { useState } from "react";
import styles from "./RatingStars.module.css";

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
      /* 1. APPLY CONTAINER CLASS FROM CSS MODULE HERE */
      className={`${styles.container} ${className}`.trim()}
      style={{ fontSize: `${size * 0.875}px` }}
    >
      <div className={styles.starsGroup}>
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
              /* 2. APPLY STAR ITEM & INTERACTIVE CLASSES */
              className={`${styles.starItem} ${interactive ? styles.interactive : ""}`.trim()}
              style={{
                width: `${size}px`,
                height: `${size}px`,
              }}
            >
              {/* Background Empty Star */}
              <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                className={styles.emptySvg}
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>

              {/* Filled Star with Fractional Width */}
              <div
                className={styles.fillContainer}
                style={{ width: `${fillPercentage}%` }}
              >
                <svg
                  width={size}
                  height={size}
                  viewBox="0 0 24 24"
                  className={styles.filledSvg}
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>
            </span>
          );
        })}
      </div>

      {showValue && (
        <span className={styles.valueText}>
          {rating ? rating.toFixed(1) : "0.0"}
        </span>
      )}

      {showCount && reviewCount !== undefined && (
        <span className={styles.countText}>({reviewCount})</span>
      )}
    </div>
  );
};
