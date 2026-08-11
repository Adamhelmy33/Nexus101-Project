-- -------------------------------------------------------------------
-- Nexus 101 — Subject Visibility
-- Controls which subject × study_level combinations appear in the Store.
-- Defaults to visible = true so existing combos stay visible until
-- explicitly hidden via an UPDATE.
-- -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subject_visibility (
  subject     text NOT NULL CHECK (subject     IN ('engineering', 'physiotherapy', 'pharmacy')),
  study_level text NOT NULL CHECK (study_level IN ('ifp', 'level-4')),
  visible     bool NOT NULL DEFAULT true,
  PRIMARY KEY (subject, study_level)
);

-- Seed all 5 valid combinations, defaulting to visible = true.
-- Use ON CONFLICT DO NOTHING so re-runs are safe.
INSERT INTO subject_visibility (subject, study_level, visible) VALUES
  ('engineering',   'ifp',     true),
  ('engineering',   'level-4', true),
  ('physiotherapy', 'ifp',     true),
  ('physiotherapy', 'level-4', true),
  ('pharmacy',      'ifp',     true)
ON CONFLICT (subject, study_level) DO NOTHING;

-- Public read so unauthenticated and authenticated users can both query it.
ALTER TABLE subject_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone reads subject_visibility" ON subject_visibility;
CREATE POLICY "anyone reads subject_visibility"
  ON subject_visibility FOR SELECT
  USING (true);
