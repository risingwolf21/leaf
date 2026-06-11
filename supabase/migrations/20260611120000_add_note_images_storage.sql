-- Private storage bucket for images embedded in notes. Files are stored at
-- `{user_id}/{uuid}.{ext}` and served via short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('note-images', 'note-images', false)
on conflict (id) do nothing;

create policy "Users can upload own images"
  on storage.objects for insert
  with check (
    bucket_id = 'note-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own images"
  on storage.objects for select
  using (
    bucket_id = 'note-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
