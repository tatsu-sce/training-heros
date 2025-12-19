-- Add missing DELETE policies for friends and group_members
-- Run this in the Supabase SQL Editor

-- 1. Friends table: allow users to delete any friendship they are part of
CREATE POLICY "Users can delete own friendships" 
ON public.friends 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 2. Group Members table: allow users to leave groups (delete their own membership)
CREATE POLICY "Users can leave groups" 
ON public.group_members 
FOR DELETE 
USING (auth.uid() = user_id);
