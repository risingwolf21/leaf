-- Allow folders to be nested inside other folders
alter table public.folders
  add column if not exists parent_id uuid references public.folders(id) on delete cascade;

create index if not exists folders_parent_id_idx on public.folders (parent_id);
