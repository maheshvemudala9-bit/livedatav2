-- ============================================================================
-- Migration 008: Contact Us queries
-- ----------------------------------------------------------------------------
-- Creates public.contact_queries, filled by the public "Contact Us" form
-- (POST /api/contactUs) and listed read-only in the admin dashboard
-- (GET /api/adminhub/contact-queries).
--   uid  : set when the submitter was logged in, otherwise NULL (guest).
--          No FK, so deleting a user never blocks and old queries survive.
--   subject is restricted to the six values offered by the form.
--
-- Idempotent: safe to run more than once.
--
-- Run manually BEFORE deploying the backend code:
--   Local:      psql -U postgres -d postgres -f 008_contact_queries.sql
--   Production: (back up first)
--     docker compose exec -T db pg_dump -U postgres postgres > backup_$(date +%F).sql
--     docker compose exec -T db psql -U postgres -d postgres < backend/migrations/008_contact_queries.sql
-- NOTE: NOT auto-run by the app.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contact_queries (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uid        integer NULL,
  name       varchar(100) NOT NULL,
  email      varchar(255) NOT NULL,
  phone      varchar(20)  NOT NULL,
  subject    varchar(50)  NOT NULL,
  message    text         NOT NULL,
  ip         varchar(64)  NULL,
  created_at timestamp    DEFAULT now(),
  CONSTRAINT contact_queries_subject_chk CHECK (subject IN (
    'Registration / Profile Help',
    'Membership / Payment',
    'Report a Profile',
    'Technical Issue',
    'Feedback / Suggestion',
    'Other'
  ))
);

CREATE INDEX IF NOT EXISTS idx_contact_queries_created_at
  ON public.contact_queries (created_at DESC);
