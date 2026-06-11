-- Snapshot of a note's title/content taken on every auto-save, used for
-- the version history drawer.
create table public.note_versions (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.notes(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  title      text not null,
  saved_at   timestamptz not null default now()
);

create index note_versions_note_id_saved_at_idx
  on public.note_versions (note_id, saved_at desc);

alter table public.note_versions enable row level security;

create policy "Users can view own versions"
  on public.note_versions for select
  using (auth.uid() = user_id);

create policy "Users can insert own versions"
  on public.note_versions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own versions"
  on public.note_versions for delete
  using (auth.uid() = user_id);

-- Inserts a version snapshot for a note and trims its history down to the
-- 50 most recent versions. Runs with the caller's privileges, so it is
-- scoped by the policies above.
create or replace function public.save_note_version(p_note_id uuid, p_title text, p_content text)
returns void
language plpgsql
as $$
begin
  insert into public.note_versions (note_id, user_id, title, content)
  values (p_note_id, auth.uid(), p_title, p_content);

  delete from public.note_versions
  where note_id = p_note_id
    and id not in (
      select id from public.note_versions
      where note_id = p_note_id
      order by saved_at desc
      limit 50
    );
end;
$$;
