-- ═══════════════════════════════════════════════
-- Nexus 101 — RAG schema for AI Study Buddy
-- ═══════════════════════════════════════════════
-- Stores ingested course materials + chunks + embeddings for retrieval.
-- Uses pgvector for ANN search.

create table if not exists course_materials (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses on delete cascade,
  module_id   uuid references modules,
  kind        text not null check (kind in ('pdf','note','transcript')),
  title       text,
  storage_path text,
  ingested_at timestamptz,
  created_at  timestamptz default now()
);

create table if not exists course_chunks (
  id          uuid primary key default gen_random_uuid(),
  material_id uuid not null references course_materials on delete cascade,
  course_id   uuid not null references courses,
  module_id   uuid references modules,
  chunk_index int not null,
  content     text not null,
  tokens      int,
  meta        jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

-- Add vector column separately so the type resolves after extension is active
alter table course_chunks add column if not exists embedding vector(1536);

create index if not exists course_chunks_hnsw on course_chunks
  using hnsw (embedding vector_cosine_ops);

-- Conversations & messages
create table if not exists ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles on delete cascade,
  course_id   uuid references courses,
  module_id   uuid references modules,
  title       text default 'New chat',
  created_at  timestamptz default now()
);

create table if not exists ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations on delete cascade,
  role            text not null check (role in ('user','assistant','system')),
  content         text not null,
  cited_chunks    jsonb default '[]'::jsonb,
  tokens_input    int,
  tokens_output   int,
  created_at      timestamptz default now()
);

alter table ai_conversations enable row level security;
alter table ai_messages      enable row level security;
create policy "user owns conversations" on ai_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user reads own messages" on ai_messages
  for all
  using  (exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()))
  with check (exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));

-- Retrieval helper: nearest chunks for a course-scoped query
create or replace function match_course_chunks(
  p_query_embedding vector(1536),
  p_course_id       uuid,
  p_match_count     int default 5,
  p_min_score       float default 0.5
) returns table (
  id        uuid,
  content   text,
  module_id uuid,
  score     float
) language sql stable as $$
  select c.id, c.content, c.module_id,
         1 - (c.embedding <=> p_query_embedding) as score
    from course_chunks c
   where (p_course_id is null or c.course_id = p_course_id)
     and 1 - (c.embedding <=> p_query_embedding) >= p_min_score
   order by c.embedding <=> p_query_embedding
   limit p_match_count;
$$;
