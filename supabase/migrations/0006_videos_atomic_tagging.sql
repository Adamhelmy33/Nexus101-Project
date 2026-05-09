-- ═══════════════════════════════════════════════
-- Nexus 101 — Atomic Video Tagging
-- ═══════════════════════════════════════════════
-- Two new tables:
--   videos          — one row per Bunny.net video file
--   video_segments  — N rows per video (atomic taggable chunks with embeddings)
--
-- The vector column powers the AI Custom Course Generator + Study Buddy
-- "find me a clip that explains X" capability.
-- ═══════════════════════════════════════════════

create extension if not exists vector;

-- ── VIDEOS (master record, mapped to Bunny.net) ──────────────
create table if not exists videos (
  id                  uuid primary key default uuid_generate_v4(),
  bunny_library_id    text   not null,
  bunny_video_id      text   not null,                    -- the Bunny GUID
  course_id           uuid   references courses on delete set null,
  module_id           uuid   references modules on delete set null,
  title               text,
  description         text,
  duration_sec        int,
  hls_path            text,                                -- relative .m3u8 path on Bunny CDN
  thumbnail_url       text,
  language            text   default 'en',
  status              text   not null default 'processing'
                                check (status in ('processing','ready','failed')),
  uploaded_at         timestamptz default now(),
  meta                jsonb default '{}'::jsonb,
  unique (bunny_library_id, bunny_video_id)
);

create index if not exists videos_course_idx on videos (course_id);
create index if not exists videos_module_idx on videos (module_id);


-- ── VIDEO SEGMENTS (atomic, taggable, embedded chunks) ───────
create table if not exists video_segments (
  id              uuid primary key default uuid_generate_v4(),
  video_id        uuid not null references videos on delete cascade,
  course_id       uuid not null references courses,        -- denormalised for fast filter
  topic_id        uuid references topics on delete set null,
  start_sec       int  not null,
  end_sec         int  not null check (end_sec > start_sec),
  title           text not null,                           -- e.g. "Integration by Parts"
  subject         text not null check (subject in ('math','physics','cs','mixed')),
  difficulty      int  default 3 check (difficulty between 1 and 5),
  transcript      text,                                    -- text of this clip for RAG
  embedding       vector(1536),                            -- OpenAI text-embedding-3-small
  meta            jsonb default '{}'::jsonb,               -- speaker, formulas, key terms
  created_at      timestamptz default now()
);

create index if not exists video_segments_search_idx
  on video_segments using hnsw (embedding vector_cosine_ops);
create index if not exists video_segments_topic_idx on video_segments (topic_id);
create index if not exists video_segments_course_idx on video_segments (course_id);
create index if not exists video_segments_video_idx on video_segments (video_id);


-- ── RLS: anyone can read, only service role writes ───────────
alter table videos          enable row level security;
alter table video_segments  enable row level security;

create policy "anyone reads videos"          on videos          for select using (true);
create policy "anyone reads video_segments"  on video_segments  for select using (true);

-- Writes happen only via Edge Functions using the service-role key.


-- ── Helper: total duration of a video from its longest end_sec ──
create or replace function video_total_duration(p_video_id uuid)
returns int language sql stable as $$
  select coalesce(max(end_sec), 0) from video_segments where video_id = p_video_id;
$$;
