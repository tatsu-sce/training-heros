-- 1. Add UNIQUE constraint to profiles.student_id
ALTER TABLE public.profiles
ADD CONSTRAINT unique_student_id UNIQUE (student_id);

-- 2. Update the trigger function to save student_id from metadata to the profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, student_id)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'student_id'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
