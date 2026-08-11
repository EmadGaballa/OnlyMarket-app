-- ============================================================
-- V4: Replace uniform DummyJSON-imported reviews with varied seed data
-- ============================================================
-- Previous behavior: every published product got exactly 3 identical-looking
-- reviews imported from DummyJSON (all with user_id = NULL, is_seed_data = FALSE).
--
-- This migration:
--   1. Deletes ONLY the imported reviews (reliably identified by user_id IS NULL --
--      is_seed_data was never set TRUE by the import process so it cannot be used
--      to distinguish those rows). Real reviews submitted by logged-in users
--      (user_id IS NOT NULL) are left completely untouched.
--   2. Inserts a randomized 1-10 reviews per product, with varied reviewer names,
--      varied generic comments, randomized creation dates and a weighted rating
--      distribution that skews positive (like real review data).
--   3. Recalculates products.review_count / products.average_rating from the actual
--      current contents of the reviews table (including real user reviews), since
--      those two columns are denormalized and not computed on the fly.
-- ============================================================

-- ------------------------------------------------------------
-- Step 1: Remove only the uniform DummyJSON-imported reviews.
-- user_id IS NULL is the reliable signal for "not a real user's review".
-- The UNIQUE (product_id, user_id) constraint does not block this because
-- Postgres treats every NULL as distinct from every other NULL.
-- ------------------------------------------------------------
DELETE FROM reviews
WHERE user_id IS NULL;

-- ------------------------------------------------------------
-- Step 2: Insert randomized seed reviews (1-10 per product).
-- ------------------------------------------------------------
DO $$
DECLARE
    p              RECORD;
    num_reviews    INT;
    i              INT;
    r              DOUBLE PRECISION;
    chosen_rating  INT;
    chosen_comment TEXT;
    chosen_name    TEXT;
BEGIN
    FOR p IN SELECT id FROM products LOOP

        -- Genuinely random count per product: 1..10
        num_reviews := floor(random() * 10 + 1)::int;

        FOR i IN 1..num_reviews LOOP

            -- Weighted rating: skew toward positive (real reviews cluster at 4-5).
            r := random();
            chosen_rating := CASE
                WHEN r < 0.04 THEN 1
                WHEN r < 0.10 THEN 2
                WHEN r < 0.25 THEN 3
                WHEN r < 0.50 THEN 4
                ELSE 5
            END::int;

            chosen_comment := (
                ARRAY[
                    'Great quality, exactly what I expected.',
                    'Fast shipping and well packaged.',
                    'Good value for the price.',
                    'Works well, no complaints so far.',
                    'Would buy again without hesitation.',
                    'Solid build and looks just like the pictures.',
                    'Really happy with this purchase.',
                    'Exactly as described, no surprises.',
                    'Does exactly what it is supposed to do.',
                    'Happy with the quality so far.',
                    'Arrived quickly and in perfect condition.',
                    'Very good product for the money.',
                    'Pleasantly surprised by how well it performs.',
                    'Would recommend to a friend.',
                    'Great addition to my collection.',
                    'Simple to use and does the job.',
                    'Quality is better than I expected at this price.',
                    'No issues so far, very satisfied.',
                    'Good buy, shipping was fast too.',
                    'Meets all my expectations.'
                ]
            )[1 + floor(random() * 20)::int];


chosen_name := (
                ARRAY[
                    'Sarah Johnson',
                    'Michael Chen',
                    'Emily Rodriguez',
                    'James Wilson',
                    'Olivia Martinez',
                    'David Kim',
                    'Sophia Anderson',
                    'Daniel Thompson',
                    'Emma Patel',
                    'Chris Nguyen',
                    'Jessica Brown',
                    'Andrew Davis',
                    'Laura Garcia',
                    'Matthew Lee',
                    'Amanda Clark',
                    'Joshua Lewis',
                    'Megan Walker',
                    'Ryan Young',
                    'Hannah Moore',
                    'Tyler Jackson'
                ]
            )[1 + floor(random() * 20)::int];

            INSERT INTO reviews
                (product_id, user_id, order_item_id, rating, title, comment,
                 reviewer_name, reviewer_email, is_seed_data, created_at, updated_at)
            VALUES
                (p.id,
                 NULL,              -- synthetic seed review, not tied to a real account
                 NULL,
                 chosen_rating,
                 NULL,              -- leave title unset (generic seed comments)
                 chosen_comment,
                 chosen_name,
                 -- Derive a plausible, non-null email from the chosen name.
                 lower(replace(chosen_name, ' ', '.')) || '@example.com',
                 TRUE,              -- mark as seed data so future cleanups can find these
                 now() - (random() * interval '180 days'),  -- within the last ~6 months
                 now());
        END LOOP;
    END LOOP;
END $$;

-- ------------------------------------------------------------
-- Step 3: Recalculate the denormalized summary columns from the
-- ACTUAL contents of the reviews table (seed rows + any real user
-- reviews on the same product).
-- ------------------------------------------------------------
WITH stats AS (
    SELECT
        product_id,
        COUNT(*)             AS cnt,
        ROUND(AVG(rating), 2) AS avg_rating
    FROM reviews
    WHERE deleted_at IS NULL
    GROUP BY product_id
)
UPDATE products p
SET review_count   = COALESCE(s.cnt, 0),
    average_rating = COALESCE(s.avg_rating, 0),
    updated_at     = NOW()
FROM stats s
WHERE p.id = s.product_id;
