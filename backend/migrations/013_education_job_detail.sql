-- ============================================================================
-- Migration 013: Education / Job detail + Family location cascade
-- ----------------------------------------------------------------------------
-- Adds five nullable columns to public.userdetails:
--   education_detail  varchar(200)  free text shown next to Highest Education (Edit Profile only)
--   job_detail        varchar(200)  free text shown next to Profession (Edit Profile only)
--   family_country    varchar(100)  Family Background location: country
--   family_state      varchar(100)  Family Background location: state / province
--   family_district   varchar(100)  Family Background location: district / city
-- (userdetails.familyresidence keeps a readable "District, State, Country" text.)
-- Existing rows stay NULL; nothing is rewritten.
--
-- Idempotent: safe to run more than once.
--
-- Run manually BEFORE deploying the backend code:
--   Local:      psql -U postgres -d postgres -f 013_education_job_detail.sql
--   Production: (back up first)
--     docker compose exec -T db pg_dump -U postgres postgres > backup_$(date +%F).sql
--     docker compose exec -T db psql -U postgres -d postgres < backend/migrations/013_education_job_detail.sql
-- NOTE: NOT auto-run by the app.
-- ============================================================================
ALTER TABLE public.userdetails
  ADD COLUMN IF NOT EXISTS education_detail varchar(200) NULL;
ALTER TABLE public.userdetails
  ADD COLUMN IF NOT EXISTS job_detail varchar(200) NULL;
ALTER TABLE public.userdetails
  ADD COLUMN IF NOT EXISTS family_country varchar(100) NULL;
ALTER TABLE public.userdetails
  ADD COLUMN IF NOT EXISTS family_state varchar(100) NULL;
ALTER TABLE public.userdetails
  ADD COLUMN IF NOT EXISTS family_district varchar(100) NULL;
