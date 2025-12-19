-- Add duration columns to occupancy_logs
ALTER TABLE public.occupancy_logs 
ADD COLUMN IF NOT EXISTS duration_minutes integer,
ADD COLUMN IF NOT EXISTS duration_seconds integer;

-- Update handle_occupancy to calculate duration on check-out
CREATE OR REPLACE FUNCTION public.handle_occupancy(action_type text, location_name text DEFAULT 'main_gym')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_status boolean;
  result_message text;
  last_check_in_time timestamp with time zone;
  calc_seconds integer;
  calc_minutes integer;
BEGIN
  -- Validate action_type
  IF action_type NOT IN ('check_in', 'check_out') THEN
    RAISE EXCEPTION 'Invalid action type: %. Must be check_in or check_out.', action_type;
  END IF;

  -- Determine new status
  new_status := (action_type = 'check_in');

  -- If checking out, find the last check-in to calculate duration
  IF action_type = 'check_out' THEN
    SELECT created_at INTO last_check_in_time
    FROM public.occupancy_logs
    WHERE user_id = auth.uid() AND action = 'check_in'
    ORDER BY created_at DESC
    LIMIT 1;

    IF last_check_in_time IS NOT NULL THEN
      calc_seconds := EXTRACT(EPOCH FROM (now() - last_check_in_time));
      calc_minutes := calc_seconds / 60;
    END IF;
  END IF;

  -- Update profile status
  UPDATE public.profiles
  SET is_present = new_status
  WHERE id = auth.uid();

  -- Insert log
  INSERT INTO public.occupancy_logs (user_id, action, location, duration_minutes, duration_seconds)
  VALUES (auth.uid(), action_type, location_name, calc_minutes, calc_seconds);

  -- Initialize result message
  IF new_status THEN
    result_message := 'Successfully checked in!';
  ELSE
    IF calc_seconds < 60 THEN
      result_message := 'Successfully checked out! You stayed for ' || COALESCE(calc_seconds, 0) || ' seconds.';
    ELSE
      result_message := 'Successfully checked out! You stayed for ' || COALESCE(calc_minutes, 0) || ' minutes.';
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', result_message,
    'is_present', new_status,
    'duration_minutes', calc_minutes,
    'duration_seconds', calc_seconds
  );
END;
$$;
