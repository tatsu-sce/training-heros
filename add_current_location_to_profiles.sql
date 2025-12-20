-- Add current_location column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_location text;

-- Update handle_occupancy function to track location
CREATE OR REPLACE FUNCTION public.handle_occupancy(action_type text, location_name text DEFAULT 'main_gym')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_status boolean;
  result_message text;
BEGIN
  -- Validate action_type
  IF action_type NOT IN ('check_in', 'check_out') THEN
    RAISE EXCEPTION 'Invalid action type: %. Must be check_in or check_out.', action_type;
  END IF;

  -- Determine new status
  new_status := (action_type = 'check_in');

  -- Update profile status and location
  UPDATE public.profiles
  SET 
    is_present = new_status,
    current_location = CASE WHEN new_status THEN location_name ELSE NULL END
  WHERE id = auth.uid();

  -- Insert log
  INSERT INTO public.occupancy_logs (user_id, action, location)
  VALUES (auth.uid(), action_type, location_name);

  -- Initialize result message
  IF new_status THEN
    result_message := 'Successfully checked in!';
  ELSE
    result_message := 'Successfully checked out!';
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', result_message,
    'is_present', new_status,
    'location', CASE WHEN new_status THEN location_name ELSE NULL END
  );
END;
$$;
