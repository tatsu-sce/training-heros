-- 1. Add last_check_in_at column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_check_in_at timestamp with time zone;

-- 2. Update handle_occupancy to set last_check_in_at on check-in
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
  SET 
    is_present = new_status,
    last_check_in_at = CASE WHEN action_type = 'check_in' THEN now() ELSE last_check_in_at END
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

-- 3. Function to record a corrected checkout with a user-provided duration
CREATE OR REPLACE FUNCTION public.record_corrected_checkout(provided_duration_minutes integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark user as away
  UPDATE public.profiles
  SET is_present = false
  WHERE id = auth.uid();

  -- Insert a NEW check_out log with the provided duration
  INSERT INTO public.occupancy_logs (user_id, action, location, duration_minutes, duration_seconds)
  VALUES (auth.uid(), 'check_out', 'main_gym', provided_duration_minutes, provided_duration_minutes * 60);

  RETURN json_build_object(
    'success', true,
    'message', 'Correction recorded. Stay time updated to ' || provided_duration_minutes || ' minutes.'
  );
END;
$$;
