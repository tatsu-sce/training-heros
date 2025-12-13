-- Add student_id and available_hours columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS available_hours JSONB; -- Create index for student_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
