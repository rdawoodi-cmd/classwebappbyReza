import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Code2, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Cpu, 
  Calendar,
  Heart,
  Laptop,
  Download,
  FileArchive
} from 'lucide-react';
import { AppConfig } from '../types';
import { APP_VERSION, APP_VERSION_FA, APP_BUILD_DATE_FA } from '../version';
import { toPersianDigits } from '../utils/persianDate';

interface AppInfoViewProps {
  config: AppConfig;
  onNavigateTab: (tab: any) => void;
}

export const AppInfoView: React.FC<AppInfoViewProps> = ({ config, onNavigateTab }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const developerName = 'محمدرضا داودی';
  const developerEmail = 'rdawoodi@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(developerEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-blue-700 via-indigo-700 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>شناسنامه و مشخصات نرم‌افزار</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              سامانه هوشمند مدیریت کلاس درس
            </h2>
            <p className="text-sm text-blue-100/90 leading-relaxed max-w-xl">
              سیستم جامع و کاربردی مدیریت کلاس، حضور و غیاب، تکالیف و نمرات دانش‌آموزی با کاربری آسان و پایدار برای معلمان و مدارس.
            </p>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/15">
            <span className="text-[11px] text-blue-200">نسخه نرم‌افزار</span>
            <span className="text-lg font-bold font-mono text-white">v{APP_VERSION} ({APP_VERSION_FA})</span>
            <span className="text-[10px] text-blue-200/80">{APP_BUILD_DATE_FA}</span>
          </div>
        </div>
      </div>

      {/* Source Code ZIP Download Card */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-2 border-emerald-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileArchive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
              دریافت بسته کامل سورس‌کد پروژه (فایل ZIP)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              شامل تمامی کامپوننت‌های فرانت‌اند، تنظیمات بیلد، تایپ‌ها، ابزارهای فارسی و داده‌های کامل سامانه
            </p>
          </div>
        </div>

        <a
          href="/school_app_source_code.zip"
          download="school_app_source_code.zip"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>دانلود فایل زیپ کدها (ZIP)</span>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Creator & Developer Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">طراح و سازنده برنامه</h3>
              <p className="text-xs text-slate-500">مشخصات صاحب اثر و برنامه‌نویس سامانه</p>
            </div>
          </div>

          {/* Developer Profile */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">نام و نام خانوادگی:</span>
              <span className="text-sm font-extrabold text-slate-900">{developerName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">نقش در پروژه:</span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
                طراح، معمار و توسعه‌دهنده
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>ایمیل پشتیبانی:</span>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${developerEmail}`}
                  className="font-mono text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline dir-ltr"
                >
                  {developerEmail}
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  title="کپی کردن آدرس ایمیل"
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                >
                  {copiedEmail ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            {copiedEmail && (
              <p className="text-[11px] text-emerald-600 font-bold text-left dir-rtl animate-in fade-in">
                ✓ آدرس ایمیل با موفقیت کپی شد.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <a
              href={`mailto:${developerEmail}?subject=Classroom%20Manager%20App%20Inquiry`}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>ارسال پیام مستقیم به سازنده ({developerName})</span>
            </a>
          </div>
        </div>

        {/* Technical Specs Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">مشخصات فنی و استقرار</h3>
              <p className="text-xs text-slate-500">اطلاعات بستر اجرایی و پایگاه داده</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-slate-400" />
                <span>سازگاری استقرار:</span>
              </span>
              <span className="font-bold text-slate-800">گیت‌هاب پیجز (GitHub Pages) و نتلیفای</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <span>فناوری ساخت:</span>
              </span>
              <span className="font-bold text-slate-800">React ۱۹ + Vite + Tailwind CSS</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>حفظ حریم خصوصی:</span>
              </span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                ذخیره‌سازی امن محلی (Local-First)
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>تقویم و تاریخ:</span>
              </span>
              <span className="font-bold text-slate-800">تقویم هجری شمسی دقیق با ارقام فارسی</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-600 leading-relaxed border border-slate-200">
            💡 تمامی اطلاعات دانش‌آموزان و نمرات بر روی حافظه دستگاه ثبت می‌شود و بدون نیاز به اینترنت نیز به صورت آفلاین در دسترس خواهد بود.
          </div>
        </div>
      </div>

      {/* Overview of App Sections */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>بخش‌های مختلف این سامانه</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onNavigateTab('student-attendance')}
            className="text-right p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
          >
            <span className="text-xs font-bold text-blue-700 group-hover:underline">۱. فرم ثبت حضور کلاسی</span>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              ورود سریع دانش‌آموز با انتخاب کلاس، درس و ثبت تاریخ و ساعت دقیق شمسی.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('student-assignments')}
            className="text-right p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
          >
            <span className="text-xs font-bold text-blue-700 group-hover:underline">۲. تکالیف و نمرات</span>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              مشاهده تمرین‌ها، دانلود فایل‌های پیوست دبیر و رویت کارنامه و نمرات ثبت‌شده.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('admin')}
            className="text-right p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
          >
            <span className="text-xs font-bold text-blue-700 group-hover:underline">۳. پنل مدیریت دبیر</span>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              مدیریت لیست حضور، انتشار تکالیف جدید، ثبت نمرات، قرعه‌کشی کلاسی و خروجی اکسل.
            </p>
          </button>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-xs text-slate-500 py-3 space-y-1">
        <p className="flex items-center justify-center gap-1.5">
          <span>طراحی و پیاده‌سازی شده توسط</span>
          <span className="font-bold text-slate-700">{developerName}</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
        </p>
        <p className="text-[11px] text-slate-400">
          تمامی حقوق محفوظ است • سال تحصیلی {toPersianDigits(config.academicYear)}
        </p>
      </div>
    </div>
  );
};
