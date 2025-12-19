-- Ensure profiles.student_id has a UNIQUE constraint
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_id'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT unique_student_id UNIQUE (student_id);
    END IF;
END $$;
