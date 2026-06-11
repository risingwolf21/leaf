-- Allow notes to be pinned to the top of their folder
alter table public.notes
  add column pinned boolean not null default false;
