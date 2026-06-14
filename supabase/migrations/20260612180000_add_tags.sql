-- User-defined tags for organizing notes
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  color      text not null default '#6B7280',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.tags enable row level security;

drop policy if exists "Users can manage own tags" on public.tags;
create policy "Users can manage own tags"
  on public.tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Join table linking notes to tags (many-to-many)
create table if not exists public.note_tags (
  note_id uuid not null references public.notes(id) on delete cascade,
  tag_id  uuid not null references public.tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

alter table public.note_tags enable row level security;

-- A note's tags can be managed by whoever owns the note. The with-check
-- additionally requires the tag itself to belong to the caller, so a
-- note_tags row can never link to another user's tag.
drop policy if exists "Users can manage own note_tags" on public.note_tags;
create policy "Users can manage own note_tags"
  on public.note_tags for all
  using (
    exists (
      select 1 from public.notes n
      where n.id = note_tags.note_id and n.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.notes n
      where n.id = note_tags.note_id and n.user_id = auth.uid()
    )
    and exists (
      select 1 from public.tags t
      where t.id = note_tags.tag_id and t.user_id = auth.uid()
    )
  );

create index if not exists note_tags_tag_id_idx on public.note_tags (tag_id);
