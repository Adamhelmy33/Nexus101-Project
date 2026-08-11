-- ═══════════════════════════════════════════════
-- Nexus 101 — Remove Unused Backend Assets Migration
-- ═══════════════════════════════════════════════
-- This migration cleans up the database by dropping unused tables,
-- columns, functions, and updating constraints identified in the audit.
-- Safe to run in Supabase SQL editor or via CLI.
-- ═══════════════════════════════════════════════

-- ── 1. DROP FUNCTIONS ──────────────────────────────────────────────────────────
-- Drop credit_wallet (from 0003_wallet_functions.sql)
DROP FUNCTION IF EXISTS credit_wallet(uuid, integer, text, text, jsonb);

-- Drop redeem_course signatures (from 0003_wallet_functions.sql and 0005_dynamic_pricing.sql)
DROP FUNCTION IF EXISTS redeem_course(uuid);
DROP FUNCTION IF EXISTS redeem_course(uuid, integer);

-- Drop match_course_chunks (from 0004_pgvector_rag.sql)
DROP FUNCTION IF EXISTS match_course_chunks(vector, uuid, integer, double precision);

-- Drop video_total_duration (from 0006_videos_atomic_tagging.sql)
DROP FUNCTION IF EXISTS video_total_duration(uuid);

-- Drop match_video_segments (from 0008_segment_search_rpc.sql)
DROP FUNCTION IF EXISTS match_video_segments(vector, text, double precision, integer);

-- Drop stitch_playlist_items (from 0008_segment_search_rpc.sql)
DROP FUNCTION IF EXISTS stitch_playlist_items(uuid, jsonb);

-- ── 2. DROP TABLES (CASCADE will clean up dependent RLS policies & constraints) ──
DROP TABLE IF EXISTS custom_playlist_items CASCADE;
DROP TABLE IF EXISTS custom_playlists CASCADE;
DROP TABLE IF EXISTS parsed_syllabi CASCADE;
DROP TABLE IF EXISTS topic_mastery CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS watch_sessions CASCADE;
DROP TABLE IF EXISTS topic_mastery CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS wallet_ledger CASCADE;
DROP TABLE IF EXISTS wallet_balances CASCADE;
DROP TABLE IF EXISTS paymob_transactions CASCADE;
DROP TABLE IF EXISTS course_chunks CASCADE;
DROP TABLE IF EXISTS course_materials CASCADE;
DROP TABLE IF EXISTS ai_messages CASCADE;
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS videos CASCADE;

-- ── 3. CLEAN UP COLUMNS & CONSTRAINTS ──────────────────────────────────────────
-- Clean up courses columns
ALTER TABLE courses DROP COLUMN IF EXISTS price_points;
ALTER TABLE courses DROP COLUMN IF EXISTS meta;

-- Clean up purchases columns and payment method constraints
-- Drop obsolete points_spent column
ALTER TABLE purchases DROP COLUMN IF EXISTS points_spent;

-- Drop old check constraint on purchases.method
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_method_check;

-- Change default payment method from 'wallet' to 'card' (since 'wallet' is no longer allowed)
ALTER TABLE purchases ALTER COLUMN method SET DEFAULT 'card';

-- Add new check constraint limiting methods to card or cash
ALTER TABLE purchases ADD CONSTRAINT purchases_method_check CHECK (method IN ('card', 'cash'));
