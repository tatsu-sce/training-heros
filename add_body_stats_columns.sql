-- アバターの体型反映と動的変化に必要なカラムを追加します

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS height numeric,      -- 身長 (cm)
ADD COLUMN IF NOT EXISTS weight numeric,      -- 体重 (kg)
ADD COLUMN IF NOT EXISTS body_fat numeric DEFAULT 15.0,  -- 体脂肪率 (%)
ADD COLUMN IF NOT EXISTS last_workout_at timestamptz DEFAULT now(); -- 最終トレーニング日時

-- 既存のデータに対するデフォルト値の設定が必要であれば行う
-- UPDATE public.profiles SET height = 170, weight = 60 WHERE height IS NULL;
