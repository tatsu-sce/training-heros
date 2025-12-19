-- Create a function that prevents updates to the student_id column
CREATE OR REPLACE FUNCTION public.prevent_student_id_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new student_id is different from the old one
  IF NEW.student_id IS DISTINCT FROM OLD.student_id THEN
    -- Force it back to the old value (Silent enforcement)
    NEW.student_id := OLD.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER ensure_student_id_immutable
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.prevent_student_id_change();
