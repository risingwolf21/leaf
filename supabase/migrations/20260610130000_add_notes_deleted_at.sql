-- Trash bin: soft-delete notes instead of removing them immediately
alter table public.notes
  add column if not exists deleted_at timestamptz default null;
