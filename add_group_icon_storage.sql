-- 1. Add icon_url to groups table
alter table public.groups
add column if not exists icon_url text;

-- 2. Create storage bucket for group icons
insert into storage.buckets (id, name, public)
values ('group-icons', 'group-icons', true)
on conflict (id) do nothing;

-- 3. Storage Policies

-- Allow public read access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'group-icons' );

-- Allow authenticated users to upload
create policy "Authenticated Upload"
on storage.objects for insert
with check (
  bucket_id = 'group-icons'
  and auth.role() = 'authenticated'
);

-- Allow owner to update/delete (optional, simplified for now)
create policy "Owner Update"
on storage.objects for update
using ( bucket_id = 'group-icons' and auth.uid() = owner );
