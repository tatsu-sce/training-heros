-- 1. Alter groups table
alter table public.groups 
add column if not exists visibility text check (visibility in ('public', 'private')) default 'public',
add column if not exists description text;

-- 2. Alter group_members table
-- We need to drop the primary key if we want to allow multiple entries, but typically (group_id, user_id) should be unique regardless of status.
-- Detailed check: Status logic.
alter table public.group_members
add column if not exists status text check (status in ('active', 'pending_member', 'invited')) default 'active';

-- 3. Add calories to workout_logs if not exists (for comprehensive ranking)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'workout_logs'
        AND column_name = 'calories'
    ) THEN
        ALTER TABLE public.workout_logs
        ADD COLUMN calories numeric;
    END IF;
END $$;

-- 4. Create Ranking Function
-- Aggregates calories from equipment_logs and workout_logs
create or replace function public.get_group_ranking(group_id_param bigint, period_days int default 30)
returns table (
    user_id uuid,
    student_id text,
    total_calories numeric,
    rank bigint
) as $$
begin
    return query
    with member_stats as (
        select 
            m.user_id,
            coalesce(sum(e.calories), 0) as equip_cals
        from public.group_members m
        left join public.equipment_logs e on m.user_id = e.user_id 
            and e.created_at > (now() - (period_days || ' days')::interval)
        where m.group_id = group_id_param and m.status = 'active'
        group by m.user_id
    ),
    workout_stats as (
         select 
            m.user_id,
            coalesce(sum(w.calories), 0) as work_cals
        from public.group_members m
        left join public.workout_logs w on m.user_id = w.user_id
            and w.created_at > (now() - (period_days || ' days')::interval)
        where m.group_id = group_id_param and m.status = 'active'
        group by m.user_id
    )
    select 
        p.id as user_id,
        p.student_id,
        (coalesce(ms.equip_cals, 0) + coalesce(ws.work_cals, 0)) as total_calories,
        rank() over (order by (coalesce(ms.equip_cals, 0) + coalesce(ws.work_cals, 0)) desc) as rank
    from public.group_members gm
    join public.profiles p on gm.user_id = p.id
    left join member_stats ms on gm.user_id = ms.user_id
    left join workout_stats ws on gm.user_id = ws.user_id
    where gm.group_id = group_id_param and gm.status = 'active'
    order by total_calories desc;
end;
$$ language plpgsql security definer;

-- 5. Update RLS Policies for granular control

-- Drop existing generic policies if they conflict (safest to drop and recreate for specific logic)
drop policy if exists "Everyone can view group members" on public.group_members;
drop policy if exists "Users can join groups" on public.group_members;

-- Group Members Policies

-- SELECT: 
-- 1. Users can see their own membership
-- 2. Members of a group can see other members in that group
create policy "View memberships"
on public.group_members for select
using (
    auth.uid() = user_id -- see self
    or 
    exists ( -- see others if I am an active member of the same group
        select 1 from public.group_members my_m 
        where my_m.group_id = group_members.group_id 
        and my_m.user_id = auth.uid() 
        and my_m.status = 'active'
    )
    or
    exists ( -- Allow owners to see all requests/invites
        select 1 from public.groups g
        where g.id = group_members.group_id
        and g.owner_id = auth.uid()
    )
);

-- INSERT:
-- 1. Join Public Group (Active)
-- 2. Request Private Group (Pending)
-- 3. Owner Invites User (Invited)
create policy "Insert membership"
on public.group_members for insert
with check (
    -- CASE A: User joining/requesting themselves
    (
        auth.uid() = user_id 
        AND 
        (
            -- Public -> Active
            (status = 'active' AND exists (select 1 from public.groups where id = group_id and visibility = 'public'))
            OR
            -- Private -> Pending
            (status = 'pending_member' AND exists (select 1 from public.groups where id = group_id and visibility = 'private'))
        )
    )
    OR
    -- CASE B: Owner inviting someone
    (
        status = 'invited'
        AND
        exists (select 1 from public.groups where id = group_id and owner_id = auth.uid())
    )
);

-- UPDATE:
-- 1. Owner approves pending (pending -> active)
-- 2. User accepts invite (invited -> active)
create policy "Update membership"
on public.group_members for update
using (
    -- Owner updating others
    exists (select 1 from public.groups where id = group_id and owner_id = auth.uid())
    OR
    -- User updating self (Accept Invite)
    auth.uid() = user_id
)
with check (
    status = 'active' -- Only allow transitioning to active for now
);

-- DELETE:
-- 1. User leaves
-- 2. Owner removes member
create policy "Delete membership"
on public.group_members for delete
using (
    auth.uid() = user_id
    OR
    exists (select 1 from public.groups where id = group_id and owner_id = auth.uid())
);
