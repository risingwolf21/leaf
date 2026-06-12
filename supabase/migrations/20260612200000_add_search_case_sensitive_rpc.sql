-- Case-sensitive substring search across note titles and content, used by
-- the search panel's "match case" toggle. `search_notes` always matches
-- case-insensitively via `websearch_to_tsquery`, so this provides a
-- case-sensitive fallback. Same RLS-scoping rationale as `search_notes`: no
-- `security definer`, no client-supplied user id.
create or replace function public.search_notes_case_sensitive(search_term text)
returns setof public.notes
language sql
stable
as $$
  select *
  from public.notes
  where deleted_at is null
    and (title like '%' || search_term || '%' or content like '%' || search_term || '%')
  order by updated_at desc
  limit 20;
$$;
