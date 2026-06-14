-- Per-note saved web links, optionally with a cached Open Graph preview
-- (title, description, image) fetched via the fetch-link-preview Edge
-- Function.
create table if not exists public.note_links (
  id           uuid primary key default gen_random_uuid(),
  note_id      uuid not null references public.notes(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  display_text text not null,
  url          text not null,
  show_preview boolean not null default false,

  -- Cached Open Graph metadata (populated by Edge Function)
  og_title     text,
  og_description text,
  og_image     text,
  og_fetched_at timestamptz,

  created_at   timestamptz not null default now()
);

create index if not exists note_links_note_id_idx
  on public.note_links (note_id);

alter table public.note_links enable row level security;

drop policy if exists "Users can manage own links" on public.note_links;
create policy "Users can manage own links"
  on public.note_links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
