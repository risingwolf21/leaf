-- Allow a note to be shared via a public, read-only link
alter table public.notes
  add column if not exists share_token text unique default null,
  add column if not exists shared_at timestamptz default null;

-- Allow anyone (including unauthenticated) to read a note by its share
-- token. Additive to the existing "Users can view own notes" policy.
drop policy if exists "Public can read shared notes" on public.notes;
create policy "Public can read shared notes"
  on public.notes for select
  using (share_token is not null and deleted_at is null);
