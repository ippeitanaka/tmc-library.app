-- 学生テーブル
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL UNIQUE,   -- 学籍番号
  department TEXT NOT NULL,           -- 学科名
  name TEXT NOT NULL,                 -- 氏名
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 全員閲覧可（学生が自分の情報を取得できるよう）
CREATE POLICY "students_select_all" ON public.students
  FOR SELECT USING (true);

-- 管理者のみ書き込み
CREATE POLICY "students_insert_admin" ON public.students
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "students_update_admin" ON public.students
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "students_delete_admin" ON public.students
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- updated_at トリガー
DROP TRIGGER IF EXISTS set_updated_at ON public.students;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
