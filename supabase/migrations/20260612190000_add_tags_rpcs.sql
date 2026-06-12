-- Returns the current user's tags with a count of non-trashed notes each is
-- attached to. Intentionally omits `security definer` and a uid parameter:
-- `auth.uid()` plus the "Users can manage own tags" RLS policy already scope
-- this to the caller, so it runs fine with the caller's own privileges.
create or replace function public.get_tags_with_counts()
returns table (
  id uuid,
  user_id uuid,
  name text,
  color text,
  created_at timestamptz,
  note_count int
)
language sql
stable
as $$
  select
    t.id, t.user_id, t.name, t.color, t.created_at,
    count(n.id)::int as note_count
  from public.tags t
  left join public.note_tags nt on nt.tag_id = t.id
  left join public.notes n on n.id = nt.note_id and n.deleted_at is null
  where t.user_id = auth.uid()
  group by t.id, t.user_id, t.name, t.color, t.created_at
  order by t.name asc;
$$;

-- Returns the current user's non-trashed notes (same shape as the `notes`
-- table) plus each note's tags as a JSON array. Same RLS-scoping rationale
-- as above: no `security definer`, no uid parameter.
create or replace function public.get_notes_with_tags()
returns table (
  id uuid,
  user_id uuid,
  title text,
  content text,
  folder_id uuid,
  pinned boolean,
  deleted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  share_token text,
  shared_at timestamptz,
  share_link_role public.share_role,
  tags json
)
language sql
stable
as $$
  select
    n.id, n.user_id, n.title, n.content,
    n.folder_id, n.pinned, n.deleted_at,
    n.created_at, n.updated_at,
    n.share_token, n.shared_at, n.share_link_role,
    coalesce(
      (
        select json_agg(
          json_build_object(
            'id', t.id,
            'user_id', t.user_id,
            'name', t.name,
            'color', t.color,
            'created_at', t.created_at
          )
          order by t.name
        )
        from public.note_tags nt
        join public.tags t on t.id = nt.tag_id
        where nt.note_id = n.id
      ),
      '[]'::json
    ) as tags
  from public.notes n
  where n.user_id = auth.uid() and n.deleted_at is null
  order by n.pinned desc, n.updated_at desc;
$$;
