-- Add distance_km to equipment_logs table
ALTER TABLE public.equipment_logs 
ADD COLUMN IF NOT EXISTS distance_km numeric;

-- Comment to record the purpose
COMMENT ON COLUMN public.equipment_logs.distance_km IS 'Distance in km for cardio equipment (treadmill, bike, etc.)';
