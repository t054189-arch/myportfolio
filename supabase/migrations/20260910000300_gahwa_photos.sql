/* Bloom — the photo bucket.

   A photo in this log is somebody's afternoon with their family. The
   bucket is private, and every path is prefixed with the owner's user id
   so a policy can check ownership from the path itself. Files are read
   through short-lived signed URLs; there is no public URL to leak, share
   or index.

   The four policies below are the whole surface: a customer may put a
   file in their own folder, look at it, replace it and delete it. There
   is no policy for anyone else — same reason as gahwa_logs, and the same
   instruction: do not add one. */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gahwa-photos', 'gahwa-photos', false, 5242880,
        array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

/* storage.foldername(name) splits the object path; element 1 is the first
   folder, which we require to be the caller's own user id. So
   '<uid>/2026/cup-1.jpg' is reachable by that user and by nobody else. */
create policy "own gahwa photos: read" on storage.objects for select
  using (bucket_id = 'gahwa-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own gahwa photos: upload" on storage.objects for insert
  with check (bucket_id = 'gahwa-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own gahwa photos: replace" on storage.objects for update
  using (bucket_id = 'gahwa-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'gahwa-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own gahwa photos: delete" on storage.objects for delete
  using (bucket_id = 'gahwa-photos' and (storage.foldername(name))[1] = auth.uid()::text);
