-- Full-text search across note titles and content
alter table public.notes
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored;

create index if not exists notes_search_idx on public.notes using gin(search_vector);

-- Search the current user's own notes. This intentionally omits
-- `security definer` and any client-supplied user id, relying on the
-- existing row level security policy on notes (auth.uid() = user_id) to
-- scope results to the calling user.
create or replace function public.search_notes(search_term text)
returns setof public.notes
language sql
stable
as $$
  select *
  from public.notes
  where deleted_at is null
    and search_vector @@ websearch_to_tsquery('english', search_term)
  order by ts_rank(search_vector, websearch_to_tsquery('english', search_term)) desc
  limit 20;
$$;
