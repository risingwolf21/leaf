-- Returns notes shared with the current user (where they are a collaborator),
-- joined with the owner's email and the caller's role on that note. Used to
-- populate the "Shared with me" sidebar section.
--
-- Intentionally omits `security definer` and takes no user id parameter:
-- the existing RLS policies already let a collaborator read the owner's
-- note ("Collaborators can read shared notes"), their own
-- note_collaborators row ("Collaborators can read own entry"), and the
-- owner's profile ("Authenticated users can read profiles"), so this runs
-- with the caller's own privileges and `auth.uid()`, consistent with
-- `search_notes`.
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
  shared_since timestamptz
)
language sql
stable
as $$
  select
    n.id, n.user_id, n.title, n.content,
    n.folder_id, n.pinned, n.deleted_at,
    n.share_token, n.shared_at, n.share_link_role,
    n.created_at, n.updated_at,
    p.email as owner_email,
    nc.role as my_role,
    nc.created_at as shared_since
  from public.notes n
  join public.note_collaborators nc on nc.note_id = n.id
  join public.profiles p on p.id = n.user_id
  where nc.user_id = auth.uid()
    and n.deleted_at is null
  order by n.updated_at desc;
$$;
