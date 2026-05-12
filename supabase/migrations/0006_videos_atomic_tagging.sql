-- ═══════════════════════════════════════════════
-- Nexus 101 — Atomic Video Tagging
-- ═══════════════════════════════════════════════

create extension if not exists vector with schema public;

-- ── VIDEOS ───────────────────────────────────────────────────
create table if not exists videos (
  id               uuid primary key default gen_random_uuid(),
  bunny_library_id text not null,
  bunny_video_id   text not null,
  course_id        uuid references courses on delete set null,
  module_id        uuid references modules on delete set null,
  title            text,
  description      text,
  duration_sec     int,
  hls_path         text,
  thumbnail_url    text,
  language         text default 'en',
  status           text not null default 'processing'
                     check (status in ('processing','ready','failed')),
  uploaded_at      timestamptz default now(),
  meta             jsonb default '{}'::jsonb,
  unique (bunny_library_id, bunny_video_id)
);

create index if not exists videos_course_idx on videos (course_id);
create index if not exists videos_module_idx on videos (module_id);

-- ── VIDEO SEGMENTS — create shell, then add every column safely ──
create table if not exists video_segments (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

alter table video_segments add column if not exists video_id    uuid references videos  on delete cascade;
alter table video_segments add column if not exists course_id   uuid references courses;
alter table video_segments add column if not exists topic_id    uuid references topics  on delete set null;
alter table video_segments add column if not exists module_id   uuid references modules on delete set null;
alter table video_segments add column if not exists start_sec   int;
alter table video_segments add column if not exists end_sec     int;
alter table video_segments add column if not exists title       text;
alter table video_segments add column if not exists subject     text;
alter table video_segments add column if not exists difficulty  int  default 3;
alter table video_segments add column if not exists transcript  text;
alter table video_segments add column if not exists embedding   vector(1536);
alter table video_segments add column if not exists meta        jsonb default '{}'::jsonb;

create index if not exists video_segments_search_idx
  on video_segments using hnsw (embedding vector_cosine_ops);
create index if not exists video_segments_topic_idx  on video_segments (topic_id);
create index if not exists video_segments_course_idx on video_segments (course_id);
create index if not exists video_segments_video_idx  on video_segments (video_id);

-- ── RLS ──────────────────────────────────────────────────────
alter table videos         enable row level security;
alter table video_segments enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies
                  where tablename = 'videos'
                    and policyname = 'anyone reads videos') then
    create policy "anyone reads videos" on videos for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies
                  where tablename = 'video_segments'
                    and policyname = 'anyone reads video_segments') then
    create policy "anyone reads video_segments" on video_segments for select using (true);
  end if;
end $$;

-- ── Helper ───────────────────────────────────────────────────
create or replace function video_total_duration(p_video_id uuid)
returns int language sql stable as $$
  select coalesce(max(end_sec), 0) from video_segments where video_id = p_video_id;
$$;
