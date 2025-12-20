-- Fix RLS policy for group_members to allow Owner to join as Active immediately
drop policy if exists "Insert membership" on public.group_members;

create policy "Insert membership"
on public.group_members for insert
with check (
    -- 1. Owner joining their own group (ALWAYS ALLOWED as Active)
    (
        auth.uid() = user_id 
        AND 
        exists (select 1 from public.groups where id = group_id and owner_id = auth.uid())
    )
    OR
    -- 2. User joining Public group (Active)
    (
        auth.uid() = user_id 
        AND status = 'active' 
        AND exists (select 1 from public.groups where id = group_id and visibility = 'public')
    )
    OR
    -- 3. User requesting Private group (Pending)
    (
        auth.uid() = user_id 
        AND status = 'pending_member' 
        AND exists (select 1 from public.groups where id = group_id and visibility = 'private')
    )
    OR
    -- 4. Owner inviting someone (Invited)
    (
        status = 'invited'
        AND
        exists (select 1 from public.groups where id = group_id and owner_id = auth.uid())
    )
);
