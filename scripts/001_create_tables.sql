-- 東洋医療専門学校 図書室管理システム
-- DBマイグレーション: テーブル作成

-- =====================
-- 1. library_schedules (開館スケジュール)
-- =====================
CREATE TABLE IF NOT EXISTS public.library_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  is_open BOOLEAN NOT NULL DEFAULT false,
  open_time TEXT,       -- e.g. "09:00"
  close_time TEXT,      -- e.g. "17:00"
  note TEXT,
  fiscal_year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.library_schedules ENABLE ROW LEVEL SECURITY;

-- 全員閲覧可
CREATE POLICY "schedules_select_all" ON public.library_schedules
  FOR SELECT USING (true);

-- 管理者のみ書き込み (user_metadata.is_admin = true)
CREATE POLICY "schedules_insert_admin" ON public.library_schedules
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "schedules_update_admin" ON public.library_schedules
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "schedules_delete_admin" ON public.library_schedules
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- =====================
-- 2. announcements (お知らせ)
-- =====================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- 'general' | 'new_book' | 'event' | 'urgent'
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  fiscal_year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_all" ON public.announcements
  FOR SELECT USING (true);

CREATE POLICY "announcements_insert_admin" ON public.announcements
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "announcements_update_admin" ON public.announcements
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "announcements_delete_admin" ON public.announcements
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- =====================
-- 3. loans (貸出管理)
-- =====================
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_title TEXT NOT NULL,
  student_id TEXT NOT NULL,       -- 学籍番号
  student_name TEXT NOT NULL,     -- 氏名
  loaned_at DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,          -- 返却期限 (貸出日 + 14日)
  returned_at DATE,                -- 返却済みの場合
  extension_status TEXT DEFAULT NULL, -- NULL | 'requested' | 'approved' | 'rejected'
  extension_comment TEXT,
  extended_due_date DATE,
  fiscal_year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- 全員閲覧可 (学籍番号で絞り込みはアプリ側で行う)
CREATE POLICY "loans_select_all" ON public.loans
  FOR SELECT USING (true);

CREATE POLICY "loans_insert_admin" ON public.loans
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "loans_update_admin_or_student" ON public.loans
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    OR auth.uid() IS NOT NULL
  );

CREATE POLICY "loans_delete_admin" ON public.loans
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- =====================
-- 4. updated_at トリガー
-- =====================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.library_schedules;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.library_schedules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.announcements;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.loans;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
