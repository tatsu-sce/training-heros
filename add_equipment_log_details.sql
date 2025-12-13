-- 器具の利用ログに重量と回数を記録するためのカラムを追加します

ALTER TABLE public.equipment_logs
ADD COLUMN IF NOT EXISTS weight numeric, -- 重量 (kg)
ADD COLUMN IF NOT EXISTS reps integer;   -- 回数

-- 既存のログの weight/reps は NULL になります
