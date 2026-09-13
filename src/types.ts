export type Role = 'student' | 'teacher' | 'manager';

export type MainTab = 'student' | 'admin' | 'manager' | 'app-info';

export type AdminSubTab = 'attendance' | 'assignments' | 'grades' | 'toolkit' | 'classbook';

export type AcademicTerm = 'ترم اول' | 'ترم دوم';

export interface TeacherAccount {
  id: string;
  name: string; // نام دبیر
  username: string; // نام کاربری یا کد دبیر
  pin: string; // رمز ورود اختصاصی دبیر
  subject?: string; // (برای سازگاری)
  subjects: string[]; // لیست درس‌هایی که دبیر تدریس می‌کند
  allowedClasses?: string[]; // کلاس‌های مجاز
  subjectClasses?: Record<string, string[]>; // نگاشت کلاس‌های اختصاص داده شده به هر درس
}

export interface AttendanceRecord {
  id: string;
  studentId?: string;
  studentName: string;
  className: string;
  subject: string;
  term?: AcademicTerm; // ترم تحصیلی
  shamsiDate: string;
  timeString: string;
  timestamp: string; // ISO string
  notes?: string;
  eitaaId?: string; // حساب یا شناسه ایتا / شماره همراه
  deviceId?: string; // شناسه منحصر‌به‌فرد دستگاه/گوشی
}

export interface StudentProfile {
  id: string;
  name: string; // Will now typically be firstName + " " + lastName
  firstName?: string;
  lastName?: string;
  className: string;
  code?: string;
  fatherName?: string;
  mobile?: string;
  notes?: string;
  createdAt: string;
}

export type Student = StudentProfile;

export interface GradeEntry {
  studentId?: string;
  studentName?: string;
  score: string; // "19.5" or "خیلی خوب"
  scoreType: 'numeric' | 'qualitative';
  badge?: '' | 'positive' | 'negative' | 'star';
  note?: string;
  updatedAt?: string;
}

export interface Assignment {
  id: string;
  title: string;
  className: string; // "همه کلاس‌ها" or specific class
  subject: string;
  term?: AcademicTerm; // ترم تحصیلی
  description: string;
  shamsiDate: string;
  createdAt: string;
  fileName?: string;
  fileSize?: string;
  fileData?: string; // Data URL or storage link
  fileType?: string;
  gradingType: 'numeric' | 'qualitative';
  gradesPublished: boolean;
  grades: Record<string, GradeEntry>; // studentId (or studentName) -> GradeEntry
}

export interface AppConfig {
  adminPin: string; // رمز ورود عمومی دبیران (یا پیش‌فرض)
  managerPin: string; // رمز ورود اختصاصی مدیر سایت (پیش‌فرض 9876 یا 12345)
  schoolName: string;
  teacherName: string;
  academicYear: string;
  classes: string[]; // default: ['هفتم الف', 'هفتم ب', 'هشتم الف', 'هشتم ب', 'نهم الف', 'نهم ب']
  subjects: string[]; // default: ['فرهنگ و هنر', 'ریاضی', 'علوم تجربی', 'ادبیات فارسی', 'زبان انگلیسی', 'پیام‌های آسمان']
  teachers: TeacherAccount[]; // لیست دبیران و درس اختصاصی و رمز ورود هر کدام
  classEitaaLinks: Record<string, string>; // className -> لینک پیش‌فرض یا عمومی
  classSubjectEitaaLinks?: Record<string, Record<string, string>>; // className -> (subjectName -> eitaaLink)
  storageMode: 'local' | 'supabase';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  eitaaGroupLink?: string; // لینک عمومی پشتیبان گروه چت ایتا
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: [string, string, string, string]; // ۴ گزینه تستی
  correctOptionIndex: number; // ۰، ۱، ۲ یا ۳
  explanation?: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId?: string;
  studentName: string;
  className: string;
  submittedAt: string;
  timeSpentSeconds?: number;
  eitaaId?: string; // حساب یا شناسه ایتا / شماره همراه
  deviceId?: string; // شناسه منحصر‌به‌فرد دستگاه/گوشی
  // برای آزمون تشریحی:
  photoAnswer?: string; // تصویر برگه دست‌نویس دانش‌آموز (Data URL)
  photoAnswerName?: string;
  teacherScore?: string;
  teacherFeedback?: string;
  // برای آزمون تستی چند گزینه‌ای:
  selectedOptions?: Record<string, number>; // questionId -> selectedIndex
  scorePercent?: number; // درصد نمره (۰ تا ۱۰۰)
  calculatedScore20?: number; // نمره از ۲۰ (گرد شده به بالا)
  correctCount?: number;
  wrongCount?: number;
  unansweredCount?: number;
}

export interface Exam {
  id: string;
  title: string;
  type: 'descriptive' | 'multiple-choice'; // تشریحی با ارسال عکس یا تستی چند گزینه‌ای
  className: string; // 'همه کلاس‌ها' یا کلاس مشخص
  subject: string;
  term?: AcademicTerm; // ترم تحصیلی
  description: string;
  durationMinutes: number; // تایمر زمان آزمون به دقیقه
  isActive: boolean; // فعال بودن برای دانش‌آموزان
  shamsiDate: string;
  createdAt: string;
  // محدودیت بازه زمانی ورود به آزمون:
  hasSchedule?: boolean;
  scheduledDate?: string; // تاریخ شمسی مجاز برای آزمون (مثلاً ۱۴۰۳/۰۷/۱۵)
  startTime?: string; // ساعت شروع مجاز (مثلاً ۱۲:۰۰)
  endTime?: string; // ساعت پایان مهلت ورود (مثلاً ۱۳:۰۰)
  // فایل سوالات تشریحی (آپلود شده توسط دبیر):
  fileName?: string;
  fileSize?: string;
  fileData?: string; // عکس برگه امتحانی یا PDF
  fileType?: string;
  // سوالات تستی:
  questions?: QuizQuestion[];
  // پاسخ‌های ثبت شده دانش‌آموزان:
  submissions: Record<string, ExamSubmission>; // studentName -> ExamSubmission
}

