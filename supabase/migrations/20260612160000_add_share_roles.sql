-- Collaborators with viewer or editor role can read the note shared with them.
-- Additive to the existing "Users can view own notes" policy.
drop policy if exists "Collaborators can read shared notes" on public.notes;
create policy "Collaborators can read shared notes"
  on public.notes for select
  using (
    exists (
      select 1 from public.note_collaborators nc
      where nc.note_id = notes.id
        and nc.user_id = auth.uid()
    )
  );

-- Collaborators with the editor role can update the note shared with them.
drop policy if exists "Editors can update shared notes" on public.notes;
create policy "Editors can update shared notes"
  on public.notes for update
  using (
    exists (
      select 1 from public.note_collaborators nc
      where nc.note_id = notes.id
        and nc.user_id = auth.uid()
        and nc.role = 'editor'
    )
  );

-- A public share link can grant viewer (default) or editor access
alter table public.notes
  add column if not exists share_link_role public.share_role not null default 'viewer';

-- Signed-in users with an editor-role share link can update the note.
-- Scoped `to authenticated` so unauthenticated visitors cannot write via a
-- link — they must sign in first (anonymous editing is out of scope for v1).
drop policy if exists "Authenticated users can update via editor link" on public.notes;
create policy "Authenticated users can update via editor link"
  on public.notes for update
  to authenticated
  using (
    share_token is not null
    and deleted_at is null
    and share_link_role = 'editor'
  );
