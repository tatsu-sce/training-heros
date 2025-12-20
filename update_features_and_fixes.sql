-- Features and Fixes Migration

-- 1. Fix Profile Save Error
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS main_campus TEXT;

-- 2. Ensure Cascade Delete for Group Members (for Group Deletion feature)
-- We need to drop the constraint and re-add it with ON DELETE CASCADE to be sure
ALTER TABLE public.group_members
DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;

ALTER TABLE public.group_members
ADD CONSTRAINT group_members_group_id_fkey
FOREIGN KEY (group_id)
REFERENCES public.groups(id)
ON DELETE CASCADE;

-- 3. Ensure Cascade Delete for Group Icons (in Storage)?
-- Storage objects don't automatically cascade from database rows usually.
-- We might need a trigger or handle it in app logic. For now, app logic is fine.
-- But let's ensure the groups table itself is robust.
