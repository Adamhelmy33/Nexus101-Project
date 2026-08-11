-- 0017_subject_visibility_whatsapp.sql
-- Adds the optional WhatsApp group URL to subject_visibility.
-- NULL means "no group yet" — the UI shows a "coming soon" message instead.

ALTER TABLE subject_visibility
  ADD COLUMN IF NOT EXISTS whatsapp_group_url text DEFAULT NULL;
