import { AttendanceRecord, Assignment, StudentProfile, AppConfig, Exam } from '../types';
import { getTodayShamsi } from '../utils/persianDate';

export const DEFAULT_CLASSES = [
  'هشتم ب',
  'هفتم الف',
  'هفتم ب',
  'هشتم الف',
  'نهم الف',
  'نهم ب',
];

export const DEFAULT_SUBJECTS = [
  'فرهنگ و هنر',
  'ریاضی',
  'علوم تجربی',
  'ادبیات فارسی',
  'زبان انگلیسی',
  'کار و فناوری',
];

export function getInitialConfig(): AppConfig {
  return {
    adminPin: '1234',
    managerPin: '9876', // رمز پیش‌فرض پنل مدیریت سایت
    schoolName: 'دبیرستان امام خمینی سمیرم',
    teacherName: 'محمدرضا داودی',
    academicYear: '۱۴۰۵ - ۱۴۰۶',
    classes: DEFAULT_CLASSES,
    subjects: DEFAULT_SUBJECTS,
    teachers: [
      {
        id: 'tch-1',
        name: 'محمدرضا داودی',
        username: 'dawoodi',
        pin: '1234',
        subject: 'فرهنگ و هنر',
        subjects: ['فرهنگ و هنر', 'علوم تجربی'],
        allowedClasses: ['هشتم ب', 'هفتم الف', 'نهم ب'],
        subjectClasses: {
          'فرهنگ و هنر': ['هشتم ب', 'هفتم الف', 'نهم ب'],
          'علوم تجربی': ['هشتم ب'],
        },
      },
      {
        id: 'tch-2',
        name: 'مهندس احمدی',
        username: 'ahmadi',
        pin: '1111',
        subject: 'ریاضی',
        subjects: ['ریاضی', 'علوم تجربی'],
        allowedClasses: ['هفتم الف', 'هشتم ب', 'نهم الف'],
        subjectClasses: {
          'ریاضی': ['هفتم الف', 'هشتم ب'],
          'علوم تجربی': ['نهم الف'],
        },
      },
      {
        id: 'tch-3',
        name: 'خانم حسینی',
        username: 'hoseini',
        pin: '2222',
        subject: 'ادبیات فارسی',
        subjects: ['ادبیات فارسی'],
        allowedClasses: ['هفتم ب', 'هشتم الف', 'نهم ب'],
        subjectClasses: {
          'ادبیات فارسی': ['هفتم ب', 'هشتم الف', 'نهم ب'],
        },
      },
      {
        id: 'tch-4',
        name: 'دکتر رضایی',
        username: 'rezaei',
        pin: '3333',
        subject: 'زبان انگلیسی',
        subjects: ['زبان انگلیسی', 'کار و فناوری'],
        allowedClasses: ['هفتم الف', 'هشتم الف', 'هشتم ب', 'نهم الف'],
        subjectClasses: {
          'زبان انگلیسی': ['هفتم الف', 'هشتم الف'],
          'کار و فناوری': ['هشتم ب', 'نهم الف'],
        },
      },
      {
        id: 'tch-5',
        name: 'خانم کریمی',
        username: 'karimi',
        pin: '4444',
        subject: 'کار و فناوری',
        subjects: ['کار و فناوری', 'فرهنگ و هنر'],
        allowedClasses: ['هفتم الف', 'هفتم ب', 'هشتم الف', 'نهم ب'],
        subjectClasses: {
          'کار و فناوری': ['هفتم الف', 'هفتم ب'],
          'فرهنگ و هنر': ['هشتم الف', 'نهم الف'],
        },
      },
    ],
    classEitaaLinks: {
      'هشتم ب': '',
      'هفتم الف': '',
      'هفتم ب': '',
      'هشتم الف': '',
      'نهم الف': '',
      'نهم ب': '',
    },
    classSubjectEitaaLinks: {
      'هشتم ب': {},
      'هفتم الف': {},
      'هفتم ب': {},
      'هشتم الف': {},
      'نهم الف': {},
      'نهم ب': {},
    },
    storageMode: 'local',
    supabaseUrl: 'https://dzbjznvdrrkfgycxqcnf.supabase.co',
    supabaseAnonKey: 'sb_publishable_hLm2YZ48fzg-IC_u3BHVSw_PKPVEz0L',
    eitaaGroupLink: '',
  };
}

export function getInitialStudents(): StudentProfile[] {
  return [
    { id: 'st-hb-1', name: 'پارسا آسوده', firstName: 'پارسا', lastName: 'آسوده', className: 'هشتم ب', code: '1200362721', fatherName: 'مهدی', createdAt: '2026-09-11' },
    { id: 'st-hb-2', name: 'ارشیا افشاری', firstName: 'ارشیا', lastName: 'افشاری', className: 'هشتم ب', code: '1200362500', fatherName: 'علی قاسم', createdAt: '2026-09-11' },
    { id: 'st-hb-3', name: 'پارسا امیدی', firstName: 'پارسا', lastName: 'امیدی', className: 'هشتم ب', code: '1200366379', fatherName: 'اسماعیل', createdAt: '2026-09-11' },
    { id: 'st-hb-4', name: 'نیما امیدی', firstName: 'نیما', lastName: 'امیدی', className: 'هشتم ب', code: '1200364791', fatherName: 'سعید', createdAt: '2026-09-11' },
    { id: 'st-hb-5', name: 'مهدی باقری', firstName: 'مهدی', lastName: 'باقری', className: 'هشتم ب', code: '1200364341', fatherName: 'علی قربان', createdAt: '2026-09-11' },
    { id: 'st-hb-6', name: 'بردیا بهرامیان', firstName: 'بردیا', lastName: 'بهرامیان', className: 'هشتم ب', code: '1200359275', fatherName: 'صمد', createdAt: '2026-09-11' },
    { id: 'st-hb-7', name: 'کیارش بهرامیان', firstName: 'کیارش', lastName: 'بهرامیان', className: 'هشتم ب', code: '1200360796', fatherName: 'شهریار', createdAt: '2026-09-11' },
    { id: 'st-hb-8', name: 'امیرمحمد بهی روزنیا', firstName: 'امیرمحمد', lastName: 'بهی روزنیا', className: 'هشتم ب', code: '1200364996', fatherName: 'محمود', createdAt: '2026-09-11' },
    { id: 'st-hb-9', name: 'امیرعلی پیرمرادیان', firstName: 'امیرعلی', lastName: 'پیرمرادیان', className: 'هشتم ب', code: '1200365658', fatherName: 'محمدابراهیم', createdAt: '2026-09-11' },
    { id: 'st-hb-10', name: 'محمدرضا جعفری', firstName: 'محمدرضا', lastName: 'جعفری', className: 'هشتم ب', code: '1200367863', fatherName: 'بابک', createdAt: '2026-09-11' },
    { id: 'st-hb-11', name: 'کوروش راجی', firstName: 'کوروش', lastName: 'راجی', className: 'هشتم ب', code: '1200360567', fatherName: 'حمید', createdAt: '2026-09-11' },
    { id: 'st-hb-12', name: 'علی رشیدی', firstName: 'علی', lastName: 'رشیدی', className: 'هشتم ب', code: '1200360494', fatherName: 'ابراهیم', createdAt: '2026-09-11' },
    { id: 'st-hb-13', name: 'علی رشیدی (بهرام)', firstName: 'علی', lastName: 'رشیدی', className: 'هشتم ب', code: '1200361504', fatherName: 'بهرام', createdAt: '2026-09-11' },
    { id: 'st-hb-14', name: 'پوریا شهبازی', firstName: 'پوریا', lastName: 'شهبازی', className: 'هشتم ب', code: '1200367014', fatherName: 'محمود', createdAt: '2026-09-11' },
    { id: 'st-hb-15', name: 'امیرحسین صابری', firstName: 'امیرحسین', lastName: 'صابری', className: 'هشتم ب', code: '1277022852', fatherName: 'محمدابراهیم', createdAt: '2026-09-11' },
    { id: 'st-hb-16', name: 'اشکان صاعدی', firstName: 'اشکان', lastName: 'صاعدی', className: 'هشتم ب', code: '1200368959', fatherName: 'ناصر', createdAt: '2026-09-11' },
    { id: 'st-hb-17', name: 'آدرین طاهری پور', firstName: 'آدرین', lastName: 'طاهری پور', className: 'هشتم ب', code: '1276919417', fatherName: 'یونس', createdAt: '2026-09-11' },
    { id: 'st-hb-18', name: 'مبین طائی', firstName: 'مبین', lastName: 'طائی', className: 'هشتم ب', code: '1200360011', fatherName: 'مجتبی', createdAt: '2026-09-11' },
    { id: 'st-hb-19', name: 'طاها طغرایی', firstName: 'طاها', lastName: 'طغرایی', className: 'هشتم ب', code: '1200361318', fatherName: 'پویا', createdAt: '2026-09-11' },
    { id: 'st-hb-20', name: 'علی قاسمی', firstName: 'علی', lastName: 'قاسمی', className: 'هشتم ب', code: '1200362934', fatherName: 'ابراهیم', createdAt: '2026-09-11' },
    { id: 'st-hb-21', name: 'محمد قاسمی', firstName: 'محمد', lastName: 'قاسمی', className: 'هشتم ب', code: '1200362926', fatherName: 'ابراهیم', createdAt: '2026-09-11' },
    { id: 'st-hb-22', name: 'هوتن قاسمی', firstName: 'هوتن', lastName: 'قاسمی', className: 'هشتم ب', code: '1190535963', fatherName: 'رضا', createdAt: '2026-09-11' },
    { id: 'st-hb-23', name: 'سیدآریا قائم مقامی', firstName: 'سیدآریا', lastName: 'قائم مقامی', className: 'هشتم ب', code: '1200360699', fatherName: 'سیدابراهیم', createdAt: '2026-09-11' },
    { id: 'st-hb-24', name: 'مهرسام کاوه', firstName: 'مهرسام', lastName: 'کاوه', className: 'هشتم ب', code: '1200368398', fatherName: 'محمد', createdAt: '2026-09-11' },
    { id: 'st-hb-25', name: 'امیرعلی منصورزاده', firstName: 'امیرعلی', lastName: 'منصورزاده', className: 'هشتم ب', code: '1200360818', fatherName: 'حمید', createdAt: '2026-09-11' },
    { id: 'st-hb-26', name: 'سیاوش نادری', firstName: 'سیاوش', lastName: 'نادری', className: 'هشتم ب', code: '1200363231', fatherName: 'محمد', createdAt: '2026-09-11' },
  ];
}

export function getInitialAttendance(): AttendanceRecord[] {
  return [];
}

export function getInitialAssignments(): Assignment[] {
  const today = getTodayShamsi();
  return [
    {
      id: 'ass-1',
      title: 'طراحی پرسپکتیو یک‌نقطه‌ای از اتاق کار',
      className: 'هشتم ب',
      subject: 'فرهنگ و هنر',
      description: 'دانش‌آموزان گرامی، لطفاً تمرین صفحه ۳۲ کتاب را با رعایت تناسبات و پرسپکتیو در برگه A4 ترسیم کرده و در جلسه آینده به همراه داشته باشید.',
      shamsiDate: today.dateString,
      createdAt: new Date().toISOString(),
      gradingType: 'numeric',
      gradesPublished: true,
      grades: {},
    },
    {
      id: 'ass-2',
      title: 'فعالیت کلاسی: بررسی نقوش سنتی اسلیمی و ختایی',
      className: 'همه کلاس‌ها',
      subject: 'فرهنگ و هنر',
      description: 'تصویر پیوست را بررسی کرده و ۳ نمونه از نقوش اسلیمی را با راپید یا روان‌نویس بازطراحی نمایید.',
      shamsiDate: today.dateString,
      createdAt: new Date().toISOString(),
      gradingType: 'qualitative',
      gradesPublished: true,
      grades: {},
    },
  ];
}

export function getInitialExams(): Exam[] {
  const today = getTodayShamsi();
  return [
    {
      id: 'exam-1',
      title: 'آزمون تشریحی میان‌ترم درس فرهنگ و هنر (طراحی و ترکیب‌بندی)',
      type: 'descriptive',
      className: 'همه کلاس‌ها',
      subject: 'فرهنگ و هنر',
      description: 'دانش‌آموزان عزیز، برگه سوالات زیر را مشاهده نمایید. پاسخ سوالات را روی یک برگ کاغذ با خط خوانا و طراحی دقیق انجام داده، سپس از برگه خود با دوربین گوشی یا تبلت عکس باکیفیت گرفته و همین‌جا آپلود و ارسال کنید.',
      durationMinutes: 25,
      isActive: true,
      shamsiDate: today.dateString,
      createdAt: new Date().toISOString(),
      fileName: 'برگه_سوالات_امتحان_هنر_فصل۳.png',
      fileSize: '145 KB',
      // SVG data URL as question paper preview
      fileData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="300" y="65" font-family="sans-serif" font-size="18" font-weight="bold" fill="%231e293b" text-anchor="middle">برگه آزمون کلاسی - درس فرهنگ و هنر</text><text x="300" y="95" font-family="sans-serif" font-size="13" fill="%2364748b" text-anchor="middle">مدت زمان پاسخگویی: ۲۵ دقیقه • نمره کل: ۲۰</text><line x1="50" y1="120" x2="550" y2="120" stroke="%23e2e8f0" stroke-width="1.5"/><text x="540" y="160" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23334155" text-anchor="end">سوال ۱: سه قانون اصلی در ترکیب‌بندی نقطه طلایی را شرح دهید. (۶ نمره)</text><text x="540" y="220" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23334155" text-anchor="end">سوال ۲: تفاوت رنگ‌های مکمل و همجوار در چرخه رنگ ایتن چیست؟ (۷ نمره)</text><text x="540" y="280" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23334155" text-anchor="end">سوال ۳: یک طرح ساده از کوزه سفالی با سایه‌روشن هاشور رسم نمایید. (۷ نمره)</text><text x="300" y="345" font-family="sans-serif" font-size="12" fill="%2394a3b8" text-anchor="middle">پاسخ‌ها را روی برگه نوشته و عکس آن را در سامانه ارسال کنید.</text></svg>',
      fileType: 'image/svg+xml',
      submissions: {},
    },
    {
      id: 'exam-2',
      title: 'آزمون تستی چند گزینه‌ای مفاهیم و عناصر بصری',
      type: 'multiple-choice',
      className: 'همه کلاس‌ها',
      subject: 'فرهنگ و هنر',
      description: 'به ۴ سوال تستی زیر در مدت زمان مشخص پاسخ دهید. به محض پایان آزمون، نمره و درصد شما به صورت خودکار محاسبه و نمایش داده می‌شود.',
      durationMinutes: 15,
      isActive: true,
      shamsiDate: today.dateString,
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: 'q-1',
          questionText: 'کدام گزینه از رنگ‌های اصلی (درجه اول) در دایره رنگ سنتی است؟',
          options: ['سبز', 'نارنجی', 'زرد', 'بنفش'],
          correctOptionIndex: 2, // زرد
          explanation: 'رنگ‌های اصلی شامل قرمز، آبی و زرد هستند.'
        },
        {
          id: 'q-2',
          questionText: 'ایجاد احساس عمق و فاصله در نقاشی با کدام عنصر بصری به دست می‌آید؟',
          options: ['پرسپکتیو (دیدگاه)', 'فونت کتیبه', 'ضخامت کاغذ', 'قاب عکس'],
          correctOptionIndex: 0, // پرسپکتیو
          explanation: 'پرسپکتیو علم نمایش عمق و سه بعدی نشان دادن حجم روی سطح دو بعدی است.'
        },
        {
          id: 'q-3',
          questionText: 'رنگ مکمل رنگ آبی کدام است؟',
          options: ['سبز', 'نارنجی', 'زرد', 'قرمز'],
          correctOptionIndex: 1, // نارنجی
          explanation: 'در چرخه رنگ ایتن، نارنجی روبروی آبی و مکمل آن است.'
        },
        {
          id: 'q-4',
          questionText: 'کدام خط، احساس آرامش و سکون را در یک اثر هنری به بیننده القا می‌کند؟',
          options: ['خط شکسته و زاویه‌دار', 'خط افقی', 'خط منحنی تند', 'خط مورب متمایل'],
          correctOptionIndex: 1, // خط افقی
          explanation: 'خطوط افقی یادآور خط افق طبیعت بوده و حس سکون و آرامش ایجاد می‌کنند.'
        }
      ],
      submissions: {},
    }
  ];
}

