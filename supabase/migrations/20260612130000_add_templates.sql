-- User-owned note templates, selectable when creating a new note
create table if not exists public.templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  content    text not null,
  created_at timestamptz not null default now()
);

alter table public.templates enable row level security;

drop policy if exists "Users can manage own templates" on public.templates;
create policy "Users can manage own templates"
  on public.templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
