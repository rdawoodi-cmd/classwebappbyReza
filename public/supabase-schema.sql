-- ==============================================================================
-- اسکریپت ساخت جداول دیتابیس سامانه هوشمند مدرسه در Supabase (PostgreSQL)
-- با پشتیبانی کامل از منطقه زمانی ایران (Asia/Tehran) و تقویم جلالی / شمسی
-- ==============================================================================

-- ۱. تنظیم تایم‌زون پیش‌فرض دیتابیس بر روی تهران
SET timezone = 'Asia/Tehran';

-- ۲. جدول تنظیمات کلی سامانه و ساختار مدرسه (کلاس‌ها، دروس، دبیران)
CREATE TABLE IF NOT EXISTS public.app_config (
    id INT PRIMARY KEY DEFAULT 1,
    data JSONB NOT NULL,
    updated_at_shamsi TEXT,
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Tehran')
);

COMMENT ON TABLE public.app_config IS 'تنظیمات مدرسه، رمزهای عبور، لیست کلاس‌ها و دسترسی‌های دبیران';

-- ۳. جدول پروفایل و مشخصات دانش‌آموزان
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    class_name TEXT NOT NULL,
    national_code TEXT,
    father_name TEXT,
    parent_phone TEXT,
    notes TEXT,
    created_at_shamsi TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Tehran'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Tehran')
);

CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_name);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students(name);

-- ۴. جدول رکوردهای حضور و غیاب کلاسی
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    student_id TEXT, -- شناسه دانش‌آموز (جهت اتصال نرم بدون قفل سخت‌گیرانه)
    student_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    term TEXT,
    date_shamsi TEXT NOT NULL, -- مثال: ۱۴۰۴/۰۷/۱۵
    time_tehran TEXT NOT NULL, -- مثال: ۰۸:۳۰:۰۰ (به وقت ایران)
    timestamp TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Tehran'),
    notes TEXT,
    eitaa_id TEXT,
    device_id TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Tehran')
);

-- حذف قید سخت‌گیرانه کلید خارجی در صورت وجود قبلی برای پیشگیری از خطای ۲۳۵۰۳
ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey;

CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date_shamsi);
CREATE INDEX IF NOT EXISTS idx_attendance_class_subject ON public.attendance_records(class_name, subject);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance_records(student_id);

-- ۵. جدول تکالیف درسی، پاسخ‌ها و نمرات
CREATE TABLE IF NOT EXISTS public.assignments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    term TEXT,
    grading_type TEXT DEFAULT 'numeric',
    grades_published BOOLEAN DEFAULT true,
    file_name TEXT,
    file_size TEXT,
    file_data TEXT,
    file_type TEXT,
    grades JSONB DEFAULT '{}'::jsonb,
    created_at_shamsi TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Tehran'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Tehran')
);

CREATE INDEX IF NOT EXISTS idx_assignments_class_sub ON public.assignments(class_name, subject);

-- ۶. جدول آزمون‌های آنلاین، سوالات، زمان‌بندی و کارنامه‌ها
CREATE TABLE IF NOT EXISTS public.exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'multiple-choice',
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    term TEXT,
    description TEXT DEFAULT '',
    duration_minutes INT DEFAULT 20,
    is_active BOOLEAN DEFAULT true,
    has_schedule BOOLEAN DEFAULT false,
    scheduled_date TEXT,
    start_time TEXT,
    end_time TEXT,
    file_name TEXT,
    file_size TEXT,
    file_data TEXT,
    file_type TEXT,
    questions JSONB DEFAULT '[]'::jsonb,
    submissions JSONB DEFAULT '{}'::jsonb,
    created_at_shamsi TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Tehran'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Tehran')
);

CREATE INDEX IF NOT EXISTS idx_exams_class_sub ON public.exams(class_name, subject);

-- ۷. فعال‌سازی دسترسی‌های امنیتی Row Level Security (RLS)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- ایجاد پالیسی‌های عمومی جهت خواندن و نوشتن از طریق Anon Key کلاینت اپلیکیشن
CREATE POLICY "Allow public read access on app_config" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Allow public write access on app_config" ON public.app_config FOR ALL USING (true);

CREATE POLICY "Allow public read access on students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public write access on students" ON public.students FOR ALL USING (true);

CREATE POLICY "Allow public read access on attendance_records" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Allow public write access on attendance_records" ON public.attendance_records FOR ALL USING (true);

CREATE POLICY "Allow public read access on assignments" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Allow public write access on assignments" ON public.assignments FOR ALL USING (true);

CREATE POLICY "Allow public read access on exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Allow public write access on exams" ON public.exams FOR ALL USING (true);

-- ۸. اضافه کردن جداول به کانال Realtime سوپابیس جهت دریافت همزمان تغییرات
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.app_config, 
    public.students, 
    public.attendance_records, 
    public.assignments, 
    public.exams;
COMMIT;
