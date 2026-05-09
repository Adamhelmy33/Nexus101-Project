-- ═══════════════════════════════════════════════
-- Nexus 101 — Custom Course Generator schema
-- ═══════════════════════════════════════════════
-- The flow:
--   1. Student uploads syllabus PDF → parsed_syllabi (parsing → parsed)
--   2. Edge Function builds playlist  → custom_playlists + custom_playlist_items
--   3. Frontend plays through items  → CustomCoursePlayer (auto-advance)
-- ═══════════════════════════════════════════════

-- ── PARSED SYLLABI (intermediate AI output) ──
create table if not exists parsed_syllabi (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles on delete cascade,
  source_path   text,                                      -- Supabase Storage URL of the PDF
  raw_text      text,                                      -- extracted plain text
  parsed_topics jsonb,                                     -- [{title, description, weight, keywords[]}]
  status        text not null default 'parsing'
                    check (status in ('parsing','parsed','failed')),
  error_message text,
  created_at    timestamptz default now(),
  parsed_at     timestamptz
);

create index if not exists parsed_syllabi_user_idx on parsed_syllabi (user_id, created_at desc);


-- ── CUSTOM PLAYLISTS (the assembled course) ──
create table if not exists custom_playlists (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references profiles on delete cascade,
  title        text not null,
  source       text default 'syllabus_upload'
                  check (source in ('syllabus_upload','manual','ai_topic')),
  syllabus_id  uuid references parsed_syllabi on delete set null,
  status       text not null default 'building'
                  check (status in ('building','ready','failed')),
  total_seconds int default 0,
  segment_count int default 0,
  cover_color   text,
  created_at   timestamptz default now()
);

create index if not exists custom_playlists_user_idx on custom_playlists (user_id, created_at desc);


-- ── PLAYLIST ITEMS (ordered list of video segments) ──
create table if not exists custom_playlist_items (
  id                uuid primary key default uuid_generate_v4(),
  playlist_id       uuid not null references custom_playlists on delete cascade,
  segment_id        uuid not null references video_segments,
  position          int  not null,
  match_score       float,                                  -- cosine similarity from RAG
  ai_reason         text,                                   -- "matches your 'Calc 2' chapter…"
  unique (playlist_id, position)
);

create index if not exists custom_playlist_items_playlist_idx
  on custom_playlist_items (playlist_id, position);


-- ── RLS: scoped to owner ──
alter table parsed_syllabi         enable row level security;
alter table custom_playlists       enable row level security;
alter table custom_playlist_items  enable row level security;

create policy "user owns syllabi"    on parsed_syllabi
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns playlists"  on custom_playlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user reads own playlist items" on custom_playlist_items
  for select using (
    exists (select 1 from custom_playlists p
             where p.id = playlist_id and p.user_id = auth.uid())
  );
-- Inserts/updates from Edge Functions only (service-role bypass).
