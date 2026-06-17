-- Live collaborative editing: a note's Yjs CRDT state is persisted alongside
-- its markdown snapshot, so reopening a shared note resumes from the exact
-- merged state rather than just the last autosaved markdown.
alter table public.notes add column if not exists ydoc_state text;

-- Mirrors private.encrypt_notes_columns(), extended to also encrypt ydoc_state.
create or replace function private.encrypt_notes_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.title is distinct from old.title then
    new.title := private.encrypt_text(new.title);
  end if;
  if tg_op = 'INSERT' or new.content is distinct from old.content then
    new.content := private.encrypt_text(new.content);
  end if;
  if tg_op = 'INSERT' or new.ydoc_state is distinct from old.ydoc_state then
    new.ydoc_state := private.encrypt_text(new.ydoc_state);
  end if;
  return new;
end;
$$;

-- Return type is gaining a column, so the function must be dropped first.
drop function if exists public.get_notes_with_tags();
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
  ydoc_state text,
  tags json
)
language sql
stable
as $$
  select
    n.id, n.user_id,
    private.decrypt_text(n.title) as title,
    private.decrypt_text(n.content) as content,
    n.folder_id, n.pinned, n.deleted_at,
    n.created_at, n.updated_at,
    n.share_token, n.shared_at, n.share_link_role,
    private.decrypt_text(n.ydoc_state) as ydoc_state,
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

drop function if exists public.get_shared_notes();
create or replace function public.get_shared_notes()
returns table (
  id uuid,
  user_id uuid,
  title text,
  content text,
  folder_id uuid,
  pinned boolean,
  deleted_at timestamptz,
  share_token text,
  shared_at timestamptz,
  share_link_role public.share_role,
  created_at timestamptz,
  updated_at timestamptz,
  owner_email text,
  my_role public.share_role,
  shared_since timestamptz,
  ydoc_state text
)
language sql
stable
as $$
  select
    n.id, n.user_id,
    private.decrypt_text(n.title) as title,
    private.decrypt_text(n.content) as content,
    n.folder_id, n.pinned, n.deleted_at,
    n.share_token, n.shared_at, n.share_link_role,
    n.created_at, n.updated_at,
    p.email as owner_email,
    nc.role as my_role,
    nc.created_at as shared_since,
    private.decrypt_text(n.ydoc_state) as ydoc_state
  from public.notes n
  join public.note_collaborators nc on nc.note_id = n.id
  join public.profiles p on p.id = n.user_id
  where nc.user_id = auth.uid()
    and n.deleted_at is null
  order by n.updated_at desc;
$$;

-- Authorizes realtime broadcast on a note's `note:<id>` channel to its owner
-- and any of its collaborators, so live edits and cursors only reach
-- participants who already have access to the note itself.
drop policy if exists "Note participants can use realtime broadcast" on realtime.messages;
create policy "Note participants can use realtime broadcast"
  on realtime.messages for all
  to authenticated
  using (
    extension = 'broadcast'
    and realtime.topic() like 'note:%'
    and exists (
      select 1 from public.notes n
      where n.id::text = split_part(realtime.topic(), ':', 2)
        and (
          n.user_id = auth.uid()
          or exists (
            select 1 from public.note_collaborators nc
            where nc.note_id = n.id and nc.user_id = auth.uid()
          )
        )
    )
  );
