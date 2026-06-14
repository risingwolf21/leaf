-- Allow notes to be pinned to the top of their folder
alter table public.notes
  add column if not exists pinned boolean not null default false;
