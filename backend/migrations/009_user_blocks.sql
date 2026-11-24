-- ============================================================================
-- Migration 009: Block User
-- ----------------------------------------------------------------------------
-- Creates public.user_blocks. One row = "blocker_uid has blocked blocked_uid".
--   * UNIQUE (blocker_uid, blocked_uid): blocking twice is a no-op.
--   * CHECK  (blocker_uid <> blocked_uid): a user cannot block themselves.
--   * Both FKs are ON DELETE CASCADE, so deleting a user (admin delete) also
--     removes every block row they are part of.
--
-- Idempotent: safe to run more than once.
--
-- Run manually BEFORE deploying the backend code:
--   Local:      psql -U postgres -d postgres -f 009_user_blocks.sql
--   Production: (back up first)
--     docker compose exec -T db pg_dump -U postgres postgres > backup_$(date +%F).sql
--     docker compose exec -T db psql -U postgres -d postgres < backend/migrations/009_user_blocks.sql
-- NOTE: NOT auto-run by the app.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_blocks (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  blocker_uid integer NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  blocked_uid integer NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  created_at  timestamp DEFAULT now(),
  CONSTRAINT user_blocks_unique_pair UNIQUE (blocker_uid, blocked_uid),
  CONSTRAINT user_blocks_no_self_chk CHECK (blocker_uid <> blocked_uid)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_uid
  ON public.user_blocks (blocked_uid);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_uid
  ON public.user_blocks (blocker_uid);
