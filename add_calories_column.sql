DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'equipment_logs'
        AND column_name = 'calories'
    ) THEN
        ALTER TABLE public.equipment_logs
        ADD COLUMN calories numeric;
    END IF;
END $$;
