-- Add fitness_goal column to profiles table
alter table public.profiles 
add column if not exists fitness_goal text default 'General Fitness';

-- Comment: Goals can be 'Weight Loss', 'Muscle Gain', 'Endurance', 'General Fitness', etc.
