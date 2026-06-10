-- Allow folders to be nested inside other folders
alter table public.folders
  add column parent_id uuid references public.folders(id) on delete cascade;

create index folders_parent_id_idx on public.folders (parent_id);
