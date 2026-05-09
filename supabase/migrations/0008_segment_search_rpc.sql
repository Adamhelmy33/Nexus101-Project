-- ═══════════════════════════════════════════════
-- Nexus 101 — Segment retrieval RPCs
-- ═══════════════════════════════════════════════
-- Exposed to authenticated users (with RLS gating which segments
-- their query can see). Used by:
--   • build-custom-playlist Edge Function (find segments per topic)
--   • study-buddy-chat Edge Function (find segments to cite)
-- ═══════════════════════════════════════════════

-- ── Find best-matching segments for a query embedding ──
create or replace function match_video_segments(
  p_query_embedding vector(1536),
  p_subject         text   default null,         -- 'math' | 'physics' | 'cs' | null = any
  p_min_score       float  default 0.45,
  p_match_count     int    default 8
) returns table (
  segment_id    uuid,
  video_id      uuid,
  course_id     uuid,
  topic_id      uuid,
  start_sec     int,
  end_sec       int,
  title         text,
  subject       text,
  transcript    text,
  score         float
) language sql stable as $$
  select s.id, s.video_id, s.course_id, s.topic_id,
         s.start_sec, s.end_sec, s.title, s.subject, s.transcript,
         1 - (s.embedding <=> p_query_embedding) as score
    from video_segments s
   where (p_subject is null or s.subject = p_subject)
     and s.embedding is not null
     and 1 - (s.embedding <=> p_query_embedding) >= p_min_score
   order by s.embedding <=> p_query_embedding
   limit p_match_count;
$$;

grant execute on function match_video_segments to authenticated, service_role;


-- ── Greedy stitcher: dedupe + order playlist items ──
-- Called by build-custom-playlist after running match_video_segments
-- across all syllabus topics. Removes duplicate segments and orders
-- them by syllabus position then in-video order.
create or replace function stitch_playlist_items(
  p_playlist_id uuid,
  p_segments    jsonb            -- [{segment_id, match_score, ai_reason, syllabus_position}]
) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_count int := 0;
  v_seen  uuid[] := array[]::uuid[];
  v_row   jsonb;
begin
  -- Wipe any existing items (idempotent rebuild)
  delete from custom_playlist_items where playlist_id = p_playlist_id;

  for v_row in select * from jsonb_array_elements(p_segments)
                 order by (value->>'syllabus_position')::int,
                          (value->>'match_score')::float desc
  loop
    if (v_row->>'segment_id')::uuid = any(v_seen) then continue; end if;
    v_seen := array_append(v_seen, (v_row->>'segment_id')::uuid);
    v_count := v_count + 1;

    insert into custom_playlist_items (playlist_id, segment_id, position, match_score, ai_reason)
    values (
      p_playlist_id,
      (v_row->>'segment_id')::uuid,
      v_count,
      (v_row->>'match_score')::float,
      v_row->>'ai_reason'
    );
  end loop;

  -- Update playlist totals
  update custom_playlists
     set status        = 'ready',
         segment_count = v_count,
         total_seconds = (
           select coalesce(sum(s.end_sec - s.start_sec), 0)
             from custom_playlist_items i
             join video_segments s on s.id = i.segment_id
            where i.playlist_id = p_playlist_id
         )
   where id = p_playlist_id;

  return v_count;
end;
$$;

grant execute on function stitch_playlist_items to service_role;
