-- ユーザー削除時に、関連するプロフィールやログも自動で削除するように設定を変更します
-- これを実行することで、Authentication画面からユーザーを削除できるようになります。

-- 1. profilesテーブル
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 2. user_schedulesテーブル
ALTER TABLE public.user_schedules
DROP CONSTRAINT IF EXISTS user_schedules_user_id_fkey;

ALTER TABLE public.user_schedules
ADD CONSTRAINT user_schedules_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. equipment_logsテーブル
ALTER TABLE public.equipment_logs
DROP CONSTRAINT IF EXISTS equipment_logs_user_id_fkey;

ALTER TABLE public.equipment_logs
ADD CONSTRAINT equipment_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 4. occupancy_logsテーブル
ALTER TABLE public.occupancy_logs
DROP CONSTRAINT IF EXISTS occupancy_logs_user_id_fkey;

ALTER TABLE public.occupancy_logs
ADD CONSTRAINT occupancy_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;
