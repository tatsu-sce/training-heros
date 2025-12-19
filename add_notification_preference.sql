-- Add notification preference to profiles table
-- This allows users to opt-in to receive notifications when the training center
-- has low occupancy (≤10 people) during their available time slots

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT false;

-- Note: The user_schedules table semantics are being reversed
-- Previously: is_occupied = true meant "busy with class"
-- Now: is_occupied = true means "available time"
-- The column name remains the same for backward compatibility,
-- but the interpretation changes in the application layer.

-- We'll also update the time slot format from period numbers (1-10)
-- to time range strings ('10-12', '12-14', etc.) in the application layer.
-- The period column will store a hash/index for these time slots:
-- 1 = '10-12', 2 = '12-14', 3 = '14-16', 4 = '16-18', 5 = '18-20'

-- Add comment to clarify the semantic change
COMMENT ON COLUMN public.user_schedules.is_occupied IS 
'Indicates user availability: true = available time, false = busy time (semantic reversed from original)';

COMMENT ON COLUMN public.user_schedules.period IS 
'Time slot index: 1=10-12, 2=12-14, 3=14-16, 4=16-18, 5=18-20 (updated from 1-10 class periods)';

COMMENT ON COLUMN public.user_schedules.day_of_week IS 
'Day of week: Mon, Tue, Wed, Thu, Fri, Sat (extended to include Saturday)';
