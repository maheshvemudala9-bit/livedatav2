-- ============================================================================
-- Migration 012: Featured profiles
-- ----------------------------------------------------------------------------
-- Adds two columns to public.users:
--   is_featured  boolean  NOT NULL DEFAULT false   (admin sets Yes/No)
--   featured_at  timestamp NULL                    (when it was set to Yes)
-- plus a partial index used by the public "Featured Brides & Grooms" query.
-- Existing users all become is_featured = false.
--
-- Idempotent: safe to run more than once.
--
-- Run manually BEFORE deploying the backend code:
--   Local:      psql -U postgres -d postgres -f 012_featured_profiles.sql
--   Production: (back up first)
--     docker compose exec -T db pg_dump -U postgres postgres > backup_$(date +%F).sql
--     docker compose exec -T db psql -U postgres -d postgres < backend/migrations/012_featured_profiles.sql
-- NOTE: NOT auto-run by the app.
-- ============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS featured_at timestamp NULL;

CREATE INDEX IF NOT EXISTS idx_users_featured_at
  ON public.users (featured_at DESC)
  WHERE is_featured;
