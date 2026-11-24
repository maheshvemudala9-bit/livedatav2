-- ============================================================================
-- Migration 014: Job location cascade (Edit Profile)
-- ----------------------------------------------------------------------------
-- Adds three nullable columns to public.userdetails:
--   job_country  varchar(100)  Job location: country
--   job_state    varchar(100)  Job location: state / province
--   job_city     varchar(100)  Job location: district / city
-- (userdetails.jobcity keeps a readable "City, State, Country" text and the old
--  work-city values for existing rows.)
-- Existing rows stay NULL; nothing is rewritten.
--
-- Idempotent: safe to run more than once.
--
-- Run manually BEFORE deploying the backend code:
--   Local:      psql -U postgres -d postgres -f 014_job_location.sql
--   Production: (back up first)
--     docker compose exec -T db pg_dump -U postgres postgres > backup_$(date +%F).sql
--     docker compose exec -T db psql -U postgres -d postgres < backend/migrations/014_job_location.sql
-- NOTE: NOT auto-run by the app.
-- ============================================================================
ALTER TABLE public.userdetails
  ADD COLUMN IF NOT EXISTS job_country varchar(100) NULL;
ALTER TABLE public.userdetails
  ADD COLUMN IF NOT EXISTS job_state varchar(100) NULL;
ALTER TABLE public.userdetails
  ADD COLUMN IF NOT EXISTS job_city varchar(100) NULL;
