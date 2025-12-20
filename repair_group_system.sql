-- Comprehensive Join/Fix for Group System
-- Run this replacing previous scripts if unsure

-- 1. Ensure Columns Exist
alter table public.groups 
add column if not exists visibility text check (visibility in ('public', 'private')) default 'public',
add column if not exists description text,
add column if not exists icon_url text;

alter table public.group_members
add column if not exists status text check (status in ('active', 'pending_member', 'invited')) default 'active';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_logs' AND column_name = 'calories') THEN
        ALTER TABLE public.workout_logs ADD COLUMN calories numeric;
    END IF;
END $$;

-- 2. Storage Setup (Idempotent)
insert into storage.buckets (id, name, public)
values ('group-icons', 'group-icons', true)
on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'group-icons' );

drop policy if exists "Authenticated Upload" on storage.objects;
create policy "Authenticated Upload" on storage.objects for insert with check ( bucket_id = 'group-icons' and auth.role() = 'authenticated' );

-- 3. RLS Policies - GROUPS
alter table public.groups enable row level security;

-- Drop old policies to be safe
drop policy if exists "Everyone can view groups" on public.groups;
drop policy if exists "Auth users can create groups" on public.groups;
drop policy if exists "Owner can update group" on public.groups;

create policy "Everyone can view groups" on public.groups for select using (true);
create policy "Auth users can create groups" on public.groups for insert with check (auth.role() = 'authenticated');
create policy "Owner can update group" on public.groups for update using (auth.uid() = owner_id);

-- 4. RLS Policies - GROUP MEMBERS
alter table public.group_members enable row level security;

drop policy if exists "Everyone can view group members" on public.group_members;
drop policy if exists "Users can join groups" on public.group_members;
drop policy if exists "View memberships" on public.group_members;
drop policy if exists "Insert membership" on public.group_members;
drop policy if exists "Update membership" on public.group_members;
drop policy if exists "Delete membership" on public.group_members;

-- SELECT
create policy "View memberships" on public.group_members for select
using (
    auth.uid() = user_id 
    OR 
    exists (select 1 from public.group_members my_m where my_m.group_id = group_members.group_id and my_m.user_id = auth.uid() and my_m.status = 'active')
    OR
    exists (select 1 from public.groups g where g.id = group_members.group_id and g.owner_id = auth.uid())
);

-- INSERT (Fixed for Owner)
create policy "Insert membership" on public.group_members for insert
with check (
    -- 1. Owner joining own group (Allow Active)
    (auth.uid() = user_id AND exists (select 1 from public.groups where id = group_id and owner_id = auth.uid()))
    OR
    -- 2. Join Public (Allow Active)
    (auth.uid() = user_id AND status = 'active' AND exists (select 1 from public.groups where id = group_id and visibility = 'public'))
    OR
    -- 3. Request Private (Allowed Pending)
    (auth.uid() = user_id AND status = 'pending_member' AND exists (select 1 from public.groups where id = group_id and visibility = 'private'))
    OR
    -- 4. Invite User (Allowed Invited by Owner)
    (status = 'invited' AND exists (select 1 from public.groups where id = group_id and owner_id = auth.uid()))
);

-- UPDATE
create policy "Update membership" on public.group_members for update
using (
    exists (select 1 from public.groups where id = group_id and owner_id = auth.uid())
    OR
    auth.uid() = user_id
);

-- DELETE
create policy "Delete membership" on public.group_members for delete
using (
    auth.uid() = user_id
    OR
    exists (select 1 from public.groups where id = group_id and owner_id = auth.uid())
);

-- 5. Ranking Function
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
        select m.user_id, coalesce(sum(e.calories), 0) as equip_cals
        from public.group_members m
        left join public.equipment_logs e on m.user_id = e.user_id and e.created_at > (now() - (period_days || ' days')::interval)
        where m.group_id = group_id_param and m.status = 'active'
        group by m.user_id
    ),
    workout_stats as (
         select m.user_id, coalesce(sum(w.calories), 0) as work_cals
        from public.group_members m
        left join public.workout_logs w on m.user_id = w.user_id and w.created_at > (now() - (period_days || ' days')::interval)
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
