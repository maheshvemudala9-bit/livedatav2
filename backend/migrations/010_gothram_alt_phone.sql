-- ============================================================================
-- Migration 010: Gothram + Alternate Phone Number
-- ----------------------------------------------------------------------------
--   * public.userdetails.gothram   varchar(100), nullable. Public profile info
--                                  (shown like caste / nakshatram / rasi).
--   * public.users.ualtphone       varchar(20), nullable. PRIVATE: follows the
--                                  same visibility rules as users.uphone.
--
-- Idempotent: safe to run more than once.
--
-- Run manually BEFORE deploying the backend code:
--   Local:      psql -U postgres -d postgres -f 010_gothram_alt_phone.sql
--   Production: (back up first)
--     docker compose exec -T db pg_dump -U postgres postgres > backup_$(date +%F).sql
--     docker compose exec -T db psql -U postgres -d postgres < backend/migrations/010_gothram_alt_phone.sql
-- NOTE: NOT auto-run by the app.
-- ============================================================================

ALTER TABLE public.userdetails ADD COLUMN IF NOT EXISTS gothram   varchar(100);
ALTER TABLE public.users       ADD COLUMN IF NOT EXISTS ualtphone varchar(20);
