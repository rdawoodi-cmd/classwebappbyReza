import React from 'react';
import { 
  ClipboardCheck, 
  BookOpen, 
  ShieldCheck, 
  Clock, 
  Calendar,
  Database,
  Lock,
  Info,
  ShieldAlert,
  CloudCheck,
  Cloud
} from 'lucide-react';
import { MainTab, AppConfig } from '../types';
import { toPersianDigits } from '../utils/persianDate';
import { APP_VERSION_FA } from '../version';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  config: AppConfig;
  currentTimeString: string;
  currentDateString: string;
  isAdminLoggedIn: boolean;
  isManagerLoggedIn: boolean;
  activeSubject: string;
  onSelectActiveSubject: (subj: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  currentTimeString,
  currentDateString,
  isAdminLoggedIn,
  isManagerLoggedIn,
  activeSubject,
  onSelectActiveSubject,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top Info Bar */}
        <div className="py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-b border-slate-100">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
                    {config.schoolName || 'سامانه هوشمند مدرسه'}
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    نسخه {APP_VERSION_FA}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  سال تحصیلی {toPersianDigits(config.academicYear)}
                </p>
              </div>
            </div>

            <div className="sm:hidden flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{toPersianDigits(currentTimeString)}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{toPersianDigits(currentDateString)}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{toPersianDigits(currentTimeString)}</span>
            </div>

            {isSupabaseConfigured() ? (
              <div 
                title="پایگاه‌داده ابری Supabase متصل و همگام است"
                className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>دیتابیس ابری Supabase متصل</span>
              </div>
            ) : (
              <div 
                title="داده‌ها در حافظه محلی مرورگر ذخیره می‌شوند"
                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
              >
                <Database className="w-3 h-3 text-slate-500" />
                <span>حافظه محلی مرورگر</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="py-2 flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
            {/* ۱. ورود دانش‌آموز */}
            <button
              onClick={() => setActiveTab('student' as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeTab === ('student' as any)
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>ورود دانش‌آموز</span>
            </button>

            {/* ۲. پنل دبیر */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>پنل دبیر</span>
            </button>

            {/* ۳. پنل مدیریت */}
            <button
              onClick={() => setActiveTab('manager')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'manager'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>پنل مدیریت</span>
            </button>

            {/* ۴. پنل مشخصات برنامه */}
            <button
              onClick={() => setActiveTab('app-info')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'app-info'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>پنل مشخصات برنامه</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
