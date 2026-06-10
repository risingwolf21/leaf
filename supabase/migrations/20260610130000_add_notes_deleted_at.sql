-- Trash bin: soft-delete notes instead of removing them immediately
alter table public.notes
  add column deleted_at timestamptz default null;
