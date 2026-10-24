-- B208 PostgreSQL prototype, isolated schema only. Never run against production.
BEGIN;
CREATE SCHEMA IF NOT EXISTS core20k_qa;
CREATE TABLE IF NOT EXISTS core20k_qa.ku_reservations (
  reservation_key text PRIMARY KEY,
  candidate_id text NOT NULL UNIQUE,
  headword_id text NOT NULL,
  sense_id text NOT NULL,
  revision_sha256 char(64) NOT NULL CHECK (revision_sha256 ~ '^[0-9a-f]{64}$'),
  authority_release_id text NOT NULL,
  runtime_sha256 char(64) NOT NULL CHECK (runtime_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(trim(candidate_id))>0),
  CHECK (length(trim(headword_id))>0),
  CHECK (length(trim(sense_id))>0)
);
CREATE TABLE IF NOT EXISTS core20k_qa.registration_events (
  event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reservation_key text NOT NULL REFERENCES core20k_qa.ku_reservations(reservation_key),
  event_type text NOT NULL CHECK (event_type IN ('RESERVED','REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
-- The application must verify approval via an independently trusted authority
-- BEFORE beginning a reservation transaction. Do not accept client supplied flags.
-- In one SERIALIZABLE transaction, INSERT the reservation (without ON CONFLICT DO UPDATE),
-- then INSERT its RESERVED event. A unique violation or serialization failure aborts
-- the entire transaction. Retry serialization failures only after rechecking authority.
-- This DDL creates no formal KU IDs, publication status, or SRS state.
