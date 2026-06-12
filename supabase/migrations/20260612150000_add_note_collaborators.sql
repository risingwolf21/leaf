-- Roles a note can be shared with another user under
create type public.share_role as enum ('viewer', 'editor');

-- Per-note collaborators: grants another user viewer or editor access to a note
create table if not exists public.note_collaborators (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.notes(id) on delete cascade,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.share_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (note_id, user_id)
);

alter table public.note_collaborators enable row level security;

-- The note owner can add, change the role of, and remove collaborators
drop policy if exists "Owner can manage collaborators" on public.note_collaborators;
create policy "Owner can manage collaborators"
  on public.note_collaborators for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- A collaborator can read their own entry, to know which note was shared
-- with them and what role they have
drop policy if exists "Collaborators can read own entry" on public.note_collaborators;
create policy "Collaborators can read own entry"
  on public.note_collaborators for select
  using (auth.uid() = user_id);

-- A collaborator can remove themselves from a note shared with them
drop policy if exists "Collaborators can remove themselves" on public.note_collaborators;
create policy "Collaborators can remove themselves"
  on public.note_collaborators for delete
  using (auth.uid() = user_id);

-- Returns the collaborator list for a note, joined with each collaborator's
-- email. Intentionally omits `security definer`: a note's owner can already
-- select every collaborator row for that note (the "for all" policy above),
-- and "Authenticated users can read profiles" lets the caller resolve
-- emails, so this runs fine with the caller's own privileges.
create or replace function public.get_note_collaborators(p_note_id uuid)
returns table (
  id uuid,
  note_id uuid,
  owner_id uuid,
  user_id uuid,
  role public.share_role,
  created_at timestamptz,
  email text
)
language sql
stable
as $$
  select nc.id, nc.note_id, nc.owner_id, nc.user_id, nc.role, nc.created_at, p.email
  from public.note_collaborators nc
  join public.profiles p on p.id = nc.user_id
  where nc.note_id = p_note_id
  order by nc.created_at asc;
$$;
