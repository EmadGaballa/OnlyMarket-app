-- V6: Add account-change timestamps used to enforce rate-limiting cooldowns on
-- password, name and email changes in Account Settings.
-- A NULL value means "never changed, so the change is allowed".
-- These are plain TIMESTAMP (no tz) to match the LocalDateTime JPA mapping.
ALTER TABLE users
    ADD COLUMN last_password_change_at TIMESTAMP,
    ADD COLUMN last_name_change_at TIMESTAMP,
    ADD COLUMN last_email_change_at TIMESTAMP;
