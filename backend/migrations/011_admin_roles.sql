-- ============================================================================
-- Migration 011: Admin roles
-- ----------------------------------------------------------------------------
--   * public.adminlogin.role is restricted to: admin, superadmin, moderator.
--       admin       full access (existing admins keep this role)
--       superadmin  no user delete, no contact limit
--       moderator   no user delete, no shadow login, no contact limit, no OTPs
--
-- Idempotent: safe to run more than once. Existing rows are NOT modified; if a
-- row holds any other role value the ALTER fails loudly and nothing changes.
--
-- Run manually BEFORE deploying the backend code:
--   Local:      psql -U postgres -d postgres -f 011_admin_roles.sql
--   Production: (back up first)
--     docker compose exec -T db pg_dump -U postgres postgres > backup_$(date +%F).sql
--     docker compose exec -T db psql -U postgres -d postgres < backend/migrations/011_admin_roles.sql
-- NOTE: NOT auto-run by the app.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'adminlogin_role_check'
       AND conrelid = 'public.adminlogin'::regclass
  ) THEN
    ALTER TABLE public.adminlogin
      ADD CONSTRAINT adminlogin_role_check
      CHECK (role IN ('admin', 'superadmin', 'moderator'));
  END IF;
END $$;
