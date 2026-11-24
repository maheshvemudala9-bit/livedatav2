-- ============================================================================
-- Migration 007: Membership, payment and marriage status on users
-- ----------------------------------------------------------------------------
-- Adds three admin-managed columns to public.users:
--   payment_status   'Pending' | 'Paid' | 'Unpaid'          (new users: Pending)
--   membership_type  'Gold' | 'Premium' | 'Diamond'         (new users: Gold)
--   marriage_status  'Active' | 'Marriage Settled'          (new users: Active)
--
-- EXISTING users are backfilled as Paid / Gold / Active so nobody loses
-- contact access when this is released. Only NEW signups start as Pending.
-- (ADD COLUMN ... DEFAULT fills existing rows with that default; the default
--  is then changed for future inserts. Registration code is unchanged.)
--
-- Idempotent: safe to run more than once.
--
-- Run manually BEFORE deploying the backend code (db.js selects these columns):
--   Local:      psql -U postgres -d postgres -f 007_membership_payment_marriage.sql
--   Production: (back up first)
--     docker compose exec -T db pg_dump -U postgres postgres > backup_$(date +%F).sql
--     docker compose exec -T db psql -U postgres -d postgres < backend/migrations/007_membership_payment_marriage.sql
-- NOTE: NOT auto-run by the app.
-- ============================================================================

-- 1. Columns (existing rows receive the first default) ------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS payment_status  varchar(20) NOT NULL DEFAULT 'Paid';
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS membership_type varchar(20) NOT NULL DEFAULT 'Gold';
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS marriage_status varchar(30) NOT NULL DEFAULT 'Active';

-- 2. Defaults for NEW users ----------------------------------------------------
ALTER TABLE public.users ALTER COLUMN payment_status  SET DEFAULT 'Pending';
ALTER TABLE public.users ALTER COLUMN membership_type SET DEFAULT 'Gold';
ALTER TABLE public.users ALTER COLUMN marriage_status SET DEFAULT 'Active';

-- 3. Allowed values (added only if no CHECK on that column exists yet) --------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
     WHERE c.conrelid = 'public.users'::regclass AND c.contype = 'c'
       AND pg_get_constraintdef(c.oid) ILIKE '%payment_status%'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_payment_status_chk
      CHECK (payment_status IN ('Pending', 'Paid', 'Unpaid'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
     WHERE c.conrelid = 'public.users'::regclass AND c.contype = 'c'
       AND pg_get_constraintdef(c.oid) ILIKE '%membership_type%'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_membership_type_chk
      CHECK (membership_type IN ('Gold', 'Premium', 'Diamond'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
     WHERE c.conrelid = 'public.users'::regclass AND c.contype = 'c'
       AND pg_get_constraintdef(c.oid) ILIKE '%marriage_status%'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_marriage_status_chk
      CHECK (marriage_status IN ('Active', 'Marriage Settled'));
  END IF;
END $$;
