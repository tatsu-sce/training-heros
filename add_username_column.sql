-- Add username column to profiles
-- It must be unique.
alter table public.profiles 
add column if not exists username text unique;

-- Create an index for faster lookup by username
create index if not exists profiles_username_idx on public.profiles (username);

-- Policy update not needed as users can already update their own profile and read others (usually).
-- Just in case, ensure update policy allows username change.
-- (Assuming existing policy "Users can update own profile" covers all columns or specifically checks ID)
