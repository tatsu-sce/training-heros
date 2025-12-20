-- FIX: Infinite Recursion (42P17) in RLS policies
-- Cause: "View memberships" policy queried group_members while checking access to group_members.
-- Solution: Use a SECURITY DEFINER function to bypass RLS for the membership check.

-- 1. Create Helper Function (Bypass RLS)
create or replace function public.is_active_member(_group_id bigint, _user_id uuid)
returns boolean
language plpgsql
security definer -- Privileged execution
as $$
begin
  return exists (
    select 1 
    from public.group_members 
    where group_id = _group_id 
    and user_id = _user_id 
    and status = 'active'
  );
end;
$$;

-- 2. Drop Problematic Policy
drop policy if exists "View memberships" on public.group_members;

-- 3. Create Optimized Non-Recursive Policy
create policy "View memberships"
on public.group_members for select
using (
    -- A. User can see their own row
    auth.uid() = user_id
    OR
    -- B. Active members can see other members in the same group (Uses function to break recursion)
    public.is_active_member(group_id, auth.uid())
    OR
    -- C. Owners can see everything in their groups
    exists (
        select 1 from public.groups g 
        where g.id = group_members.group_id 
        and g.owner_id = auth.uid()
    )
);
