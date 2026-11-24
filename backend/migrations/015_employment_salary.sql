-- ============================================================================
-- Migration 015: Employed In + Salary (Signup)
-- ----------------------------------------------------------------------------
-- Adds three nullable columns to public.users:
--   employed_in   varchar(30)    Government / Private / Defense / Self Employed / Business / Not Working
--   salary_amount numeric(14,2)  Salary as entered by the user (0 when Not Working)
--   salary_unit   varchar(30)    Thousands / Lakhs / Crores (amount is per annum)
-- Existing rows stay NULL; nothing is rewritten. users.upackage is unchanged.
--
-- Idempotent: safe to run more than once.
--
-- Run manually BEFORE deploying the backend code:
--   Local:      psql -U postgres -d postgres -f 015_employment_salary.sql
--   Production: (back up first)
--     docker compose exec -T db pg_dump -U postgres postgres > backup_$(date +%F).sql
--     docker compose exec -T db psql -U postgres -d postgres < backend/migrations/015_employment_salary.sql
-- NOTE: NOT auto-run by the app.
-- ============================================================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS employed_in varchar(30) NULL;
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS salary_amount numeric(14,2) NULL;
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS salary_unit varchar(30) NULL;
