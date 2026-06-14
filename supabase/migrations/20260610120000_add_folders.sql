-- Folders table
create table if not exists public.folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

alter table public.folders enable row level security;

drop policy if exists "Users can manage own folders" on public.folders;
create policy "Users can manage own folders"
  on public.folders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Notes can optionally belong to a folder
alter table public.notes
  add column if not exists folder_id uuid references public.folders(id) on delete set null;
