-- Add display_name column to profiles table if it doesn't exist
alter table public.profiles 
add column if not exists display_name text;

-- Update RLS policies to allow update of display_name (already covered by existing policy but good to verify)
-- Existing policy: "Users can update own profile." using ( auth.uid() = id );
