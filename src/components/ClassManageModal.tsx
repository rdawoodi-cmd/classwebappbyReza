import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  MessageSquare,
  ExternalLink,
  Check,
  Users,
  Plus,
  FileSpreadsheet,
  Sparkles,
  Upload,
  Search,
  Printer,
  Trash2,
  Edit3,
  X
} from 'lucide-react';
import { AppConfig, StudentProfile } from '../types';
import { toPersianDigits, sortClassesCustom } from '../utils/persianDate';

interface ClassManageModalProps {
  isOpen: boolean;
  className: string | null;
  onClose: () => void;
  config: AppConfig;
  students: StudentProfile[];
  onUpdateConfig: (config: AppConfig) => void;
  onUpdateStudents: (students: StudentProfile[]) => void;
  onOpenEditStudent: (student: StudentProfile) => void;
  onSelectClass: (className: string) => void;
  showFeedback: (msg: string) => void;
}

export const ClassManageModal: React.FC<ClassManageModalProps> = ({
  isOpen,
  className,
  onClose,
  config,
  students,
  onUpdateConfig,
  onUpdateStudents,
  onOpenEditStudent,
  onSelectClass,
  showFeedback,
}) => {
  if (!isOpen || !className) return null;

  // Per-subject Eitaa links state
  const [subjectLinks, setSubjectLinks] = useState<Record<string, string>>({});
  const [generalClassLink, setGeneralClassLink] = useState(config.classEitaaLinks?.[className] || '');
  const [showAddSubjectInput, setShowAddSubjectInput] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Sync state whenever className or config changes
  useEffect(() => {
    const existingSubjectLinks = config.classSubjectEitaaLinks?.[className] || {};
    const merged: Record<string, string> = {};
    const baseSubjects = config.subjects || [
      'فرهنگ و هنر',
      'ریاضی',
      'علوم تجربی',
      'ادبیات فارسی',
      'زبان انگلیسی',
      'پیام‌های آسمان',
    ];

    baseSubjects.forEach((sub) => {
      merged[sub] = existingSubjectLinks[sub] || '';
    });

    Object.keys(existingSubjectLinks).forEach((sub) => {
      merged[sub] = existingSubjectLinks[sub] || '';
    });

    setSubjectLinks(merged);
    setGeneralClassLink(config.classEitaaLinks?.[className] || '');
    setStudentSearch('');
    setSelectedStudentIds(new Set());
    setShowBulkAdd(false);
  }, [className, config.classSubjectEitaaLinks, config.classEitaaLinks, config.subjects]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Single student form state
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addCode, setAddCode] = useState('');
  const [addFatherName, setAddFatherName] = useState('');
  const [addMobile, setAddMobile] = useState('');

  // Bulk add & AI state
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isExtractingAI, setIsExtractingAI] = useState(false);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  // Search and selection
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Students in this class
  const classStudents = students
    .filter((s) => s.className === className)
    .filter((s) => {
      if (!studentSearch.trim()) return true;
      const q = studentSearch.trim().toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.includes(q)) ||
        (s.mobile && s.mobile.includes(q)) ||
        (s.fatherName && s.fatherName.toLowerCase().includes(q))
      );
    });

  const subjectEntries = Object.keys(subjectLinks);
  const connectedSubjectsCount = Object.values(subjectLinks).filter(
    (l) => typeof l === 'string' && l.trim().length > 0
  ).length;

  const handleSubjectLinkChange = (sub: string, val: string) => {
    setSubjectLinks((prev) => ({
      ...prev,
      [sub]: val,
    }));
  };

  const handleSaveAllSubjectLinks = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanSubjectMap: Record<string, string> = {};
    Object.entries(subjectLinks).forEach(([sub, link]) => {
      if (typeof link === 'string' && link.trim()) {
        cleanSubjectMap[sub] = link.trim();
      }
    });

    const updatedClassSubjectLinks = {
      ...(config.classSubjectEitaaLinks || {}),
      [className]: cleanSubjectMap,
    };

    const updatedGeneralLinks = {
      ...(config.classEitaaLinks || {}),
    };
    if (generalClassLink.trim()) {
      updatedGeneralLinks[className] = generalClassLink.trim();
    } else {
      delete updatedGeneralLinks[className];
    }

    onUpdateConfig({
      ...config,
      classSubjectEitaaLinks: updatedClassSubjectLinks,
      classEitaaLinks: updatedGeneralLinks,
    });

    showFeedback(`لینک‌های گروه ایتا برای دروس کلاس «${className}» با موفقیت ذخیره شدند.`);
  };

  const handleSaveSingleSubjectLink = (subject: string) => {
    const cleanLink = (subjectLinks[subject] || '').trim();
    const currentClassMap = { ...(config.classSubjectEitaaLinks?.[className] || {}) };

    if (cleanLink) {
      currentClassMap[subject] = cleanLink;
    } else {
      delete currentClassMap[subject];
    }

    const updated = {
      ...(config.classSubjectEitaaLinks || {}),
      [className]: currentClassMap,
    };

    onUpdateConfig({
      ...config,
      classSubjectEitaaLinks: updated,
    });

    showFeedback(`لینک گروه ایتا برای درس «${subject}» کلاس «${className}» ذخیره شد.`);
  };

  const handleAddNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubjectName.trim();
    if (!trimmed) return;

    if (!subjectLinks[trimmed]) {
      setSubjectLinks((prev) => ({
        ...prev,
        [trimmed]: '',
      }));
    }

    if (!config.subjects.includes(trimmed)) {
      onUpdateConfig({
        ...config,
        subjects: [...config.subjects, trimmed],
      });
    }

    setNewSubjectName('');
    setShowAddSubjectInput(false);
    showFeedback(`درس «${trimmed}» به لیست دروس کلاس «${className}» افزوده شد.`);
  };

  // Add single student
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName.trim() || !addLastName.trim()) {
      alert('وارد کردن نام و نام‌خانوادگی دانش‌آموز الزامی است.');
      return;
    }

    const fullName = `${addFirstName.trim()} ${addLastName.trim()}`;
    const newSt: StudentProfile = {
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: fullName,
      firstName: addFirstName.trim(),
      lastName: addLastName.trim(),
      className,
      code: addCode.trim() || undefined,
      fatherName: addFatherName.trim() || undefined,
      mobile: addMobile.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onUpdateStudents([...students, newSt]);
    setAddFirstName('');
    setAddLastName('');
    setAddCode('');
    setAddFatherName('');
    setAddMobile('');
    showFeedback(`دانش‌آموز «${fullName}» به کلاس ${className} افزوده شد.`);
  };

  // Bulk add students
  const handleBulkAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n');
    const newStudents: StudentProfile[] = [];

    lines.forEach((line) => {
      const clean = line.trim();
      if (!clean) return;
      const parts = clean.split(/\t|,|-|–|\s{2,}/).map((p) => p.trim()).filter(Boolean);
      let name = clean;
      let code: string | undefined;
      let father: string | undefined;

      if (parts.length >= 2) {
        name = parts[0];
        if (parts[1].match(/^[0-9]+$/)) {
          code = parts[1];
          if (parts[2]) father = parts[2];
        } else {
          father = parts[1];
          if (parts[2]) code = parts[2];
        }
      }

      const nameParts = name.split(' ');
      const lastName = nameParts.length > 1 ? nameParts.pop()! : '';
      const firstName = nameParts.join(' ') || name;

      newStudents.push({
        id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        firstName,
        lastName,
        className,
        code,
        fatherName: father,
        createdAt: new Date().toISOString(),
      });
    });

    onUpdateStudents([...students, ...newStudents]);
    setBulkText('');
    setShowBulkAdd(false);
    showFeedback(`${newStudents.length} دانش‌آموز به کلاس «${className}» افزوده شدند.`);
  };

  // AI File Upload for bulk extraction
  const handleAIFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingAI(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const mimeType = file.type;

          const response = await fetch('/api/extract-students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileData: base64Data, mimeType }),
          });

          if (!response.ok) throw new Error('خطا در هوش مصنوعی');

          const data = await response.json();
          if (data.students && Array.isArray(data.students)) {
            const formatted = data.students
              .filter((s: any) => s.firstName || s.lastName)
              .map((s: any) => `${(s.firstName || '').trim()} ${(s.lastName || '').trim()}`.trim())
              .join('\n');

            setBulkText((prev) => (prev ? prev + '\n' + formatted : formatted));
            setShowBulkAdd(true);
            showFeedback('اسامی دانش‌آموزان توسط هوش مصنوعی با موفقیت استخراج شد.');
          }
        } catch {
          alert('هوش مصنوعی نتوانست فایل را بخواند. لطفاً اسامی را دستی وارد کنید.');
        } finally {
          setIsExtractingAI(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsExtractingAI(false);
    }
  };

  // Delete single student (کم کردن دانش‌آموز)
  const handleDeleteStudent = (id: string) => {
    const st = students.find((s) => s.id === id);
    onUpdateStudents(students.filter((s) => s.id !== id));
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showFeedback(`دانش‌آموز «${st?.name || ''}» با موفقیت حذف گردید.`);
  };

  // Move single student to another class
  const handleMoveStudentClass = (id: string, newClass: string) => {
    const updated = students.map((s) => (s.id === id ? { ...s, className: newClass } : s));
    onUpdateStudents(updated);
    showFeedback(`دانش‌آموز به کلاس «${newClass}» منتقل شد.`);
  };

  // Bulk delete selected students (کم کردن دسته‌جمعی)
  const handleBulkDelete = () => {
    if (selectedStudentIds.size === 0) return;
    const count = selectedStudentIds.size;
    onUpdateStudents(students.filter((s) => !selectedStudentIds.has(s.id)));
    setSelectedStudentIds(new Set());
    showFeedback(`${count} دانش‌آموز از کلاس حذف شدند.`);
  };

  // Bulk move selected students
  const handleBulkMoveClass = (targetClass: string) => {
    if (selectedStudentIds.size === 0) return;
    const count = selectedStudentIds.size;
    const updated = students.map((s) => (selectedStudentIds.has(s.id) ? { ...s, className: targetClass } : s));
    onUpdateStudents(updated);
    setSelectedStudentIds(new Set());
    showFeedback(`${count} دانش‌آموز به کلاس «${targetClass}» منتقل شدند.`);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-50 rounded-2xl sm:rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-300 flex flex-col my-auto max-h-[96vh] overflow-hidden"
      >
        {/* نوار باریک عنوان به سبک ویندوز با نوشته‌های کوچک و ضربدر بالا سمت راست */}
        <div
          dir="ltr"
          className="bg-amber-600 text-white px-3 py-2 flex items-center justify-between shrink-0 shadow-xs border-b border-amber-700/40 select-none"
        >
          {/* بخش عنوان و وضعیت کلاس به زبان فارسی */}
          <div dir="rtl" className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5 font-bold">
              <GraduationCap className="w-4 h-4 text-amber-100 shrink-0" />
              <span className="text-xs sm:text-sm font-black text-white">مدیریت کلاس {className}</span>
            </div>

            <span className="px-2 py-0.5 rounded-md bg-amber-700/60 text-amber-100 text-[11px] font-bold">
              {toPersianDigits(classStudents.length)} دانش‌آموز
            </span>

            {connectedSubjectsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-emerald-100 text-[10px] font-bold flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {toPersianDigits(connectedSubjectsCount)} گروه درسی ایتا
              </span>
            ) : generalClassLink ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-emerald-100 text-[10px] font-bold flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                ایتا عمومی متصل
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-black/20 text-white/80 text-[10px]">
                بدون لینک ایتا
              </span>
            )}

            {/* انتخابگر سریع کلاس */}
            <div className="flex items-center gap-1 text-[11px] bg-black/20 px-2 py-0.5 rounded-md">
              <span className="text-amber-200 hidden md:inline">کلاس:</span>
              <select
                value={className}
                onChange={(e) => onSelectClass(e.target.value)}
                className="bg-transparent text-white font-bold text-[11px] border-0 cursor-pointer focus:outline-none"
              >
                {sortClassesCustom(config.classes).map((c) => (
                  <option key={c} value={c} className="bg-slate-800 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ضربدر بستن بالا سمت راست به سبک ویندوز */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 -mr-1 rounded-md hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="بستن پنجره (Esc)"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* محتوای داخلی پنجره (اسکرول‌پذیر با فضای باز بیشتر) */}
        <div className="overflow-y-auto p-3 sm:p-5 space-y-4 flex-1">
          {/* ۱. قسمت اتصال لینک گروه‌های چت ایتا به تفکیک هر درس برای کلاس */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-300 shadow-xs bg-linear-to-l from-emerald-50/40 via-white to-white space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-slate-800">
                    لینک گروه‌های ایتا به تفکیک دروس (کلاس «{className}»)
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold shrink-0">
                    {toPersianDigits(connectedSubjectsCount)} از {toPersianDigits(subjectEntries.length)} درس متصل
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  لینک گروه چت ایتا برای هر درس جداست (مثلاً گروه درس <span className="font-bold text-slate-800">فرهنگ و هنر</span> جدا و درس <span className="font-bold text-slate-800">ریاضی</span> جدا). دانش‌آموز بعد از ورود به هر درس، مستقیماً به گروه همان درس متصل خواهد شد.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectInput(!showAddSubjectInput)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  <span>افزودن درس دیگر</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAllSubjectLinks}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره همه لینک‌های دروس</span>
                </button>
              </div>
            </div>

            {/* فرم افزودن درس جدید در صورت نیاز */}
            {showAddSubjectInput && (
              <form onSubmit={handleAddNewSubject} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <span className="text-xs font-bold text-emerald-900 shrink-0">نام درس جدید:</span>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="مثلاً: کار و فناوری، عربی، قرآن، تفکر..."
                  className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs flex-1 focus:outline-emerald-600"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg cursor-pointer shrink-0"
                >
                  افزودن درس
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSubjectInput(false)}
                  className="px-2.5 py-1.5 bg-slate-200 text-slate-600 font-bold text-xs rounded-lg cursor-pointer shrink-0"
                >
                  انصراف
                </button>
              </form>
            )}

            {/* لیست تمام دروس با فیلد اختصاصی لینک چت ایتا برای هر کدام */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subjectEntries.map((sub) => {
                const linkVal = subjectLinks[sub] || '';
                const isConnected = !!linkVal.trim();
                return (
                  <div
                    key={sub}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isConnected
                        ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        <span className="text-xs sm:text-sm font-black text-slate-800">
                          گروه درس «{sub}»
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isConnected ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                            متصل
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[10px] font-medium">
                            بدون لینک
                          </span>
                        )}
                        {isConnected && (
                          <a
                            href={linkVal}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg hover:bg-emerald-200 text-emerald-800 transition-colors"
                            title={`تست و باز کردن گروه درس ${sub} در ایتا`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={linkVal}
                        onChange={(e) => handleSubjectLinkChange(sub, e.target.value)}
                        placeholder={`لینک گروه ایتای درس ${sub} (مثلاً: https://eitaa.com/joinchat/...)`}
                        className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-emerald-600 text-left"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveSingleSubjectLink(sub)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
                        title={`ذخیره لینک درس ${sub}`}
                      >
                        ذخیره
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* بخش اختیاری: لینک عمومی پشتیبان برای کل کلاس */}
            <div className="pt-2 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <span className="text-[11px] text-slate-500">
                نکته: در صورتی که برای درسی لینک اختصاصی تعریف نشده باشد، سیستم می‌تواند از لینک عمومی کلاس یا مدرسه استفاده کند.
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={generalClassLink}
                  onChange={(e) => setGeneralClassLink(e.target.value)}
                  placeholder="لینک عمومی کلاس (اختیاری)"
                  className="text-xs font-mono px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white w-56 text-left"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleSaveAllSubjectLinks}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer shrink-0"
                >
                  ثبت
                </button>
              </div>
            </div>
          </div>

          {/* ۲. بخش اضافه کردن و کم کردن دانش‌آموزان و کادر اختصاصی به نام همین کلاس */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ستون راست: فرم اضافه کردن دانش‌آموز به کلاس */}
            <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>افزودن دانش‌آموز به «{className}»</span>
                </h4>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                  کلاس {className}
                </span>
              </div>

              {!showBulkAdd ? (
                <form onSubmit={handleAddSingleStudent} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        نام: <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: رضا"
                        value={addFirstName}
                        onChange={(e) => setAddFirstName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        نام خانوادگی: <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: حسینی"
                        value={addLastName}
                        onChange={(e) => setAddLastName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        نام پدر (اختیاری):
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: محمد"
                        value={addFatherName}
                        onChange={(e) => setAddFatherName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        کد دانش‌آموزی:
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: ۴۰۲۰۱۲"
                        value={addCode}
                        onChange={(e) => setAddCode(e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600 text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      شماره همراه / ایتا (اختیاری):
                    </label>
                    <input
                      type="tel"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={addMobile}
                      onChange={(e) => setAddMobile(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600 text-left"
                      dir="ltr"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت و افزودن دانش‌آموز به کلاس</span>
                  </button>

                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkAdd(true)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>ثبت دسته‌جمعی یا با هوش مصنوعی</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleBulkAddSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      متن لیست اسامی (هر دانش‌آموز در یک سطر):
                    </label>
                    <textarea
                      rows={5}
                      placeholder="علی رضایی&#10;محمد حسینی&#10;رضا محمدی"
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-blue-600 font-mono"
                      dir="rtl"
                    />
                  </div>

                  {/* استخراج خودکار با هوش مصنوعی */}
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>استخراج خودکار از عکس با هوش مصنوعی:</span>
                    </div>
                    <input
                      type="file"
                      ref={aiFileInputRef}
                      onChange={handleAIFileUpload}
                      accept="image/*,.pdf,.txt,.docx,.xlsx"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isExtractingAI}
                      onClick={() => aiFileInputRef.current?.click()}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isExtractingAI ? (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          درحال پردازش هوشمند فایل...
                        </span>
                      ) : (
                        'انتخاب عکس یا فایل لیست اسامی'
                      )}
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1.5 text-justify leading-relaxed">
                      عکس لیست کلاسی یا فایل اکسل را بارگذاری کنید تا هوش مصنوعی اسامی را استخراج نماید.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    افزودن تمام این اسامی به کلاس {className}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBulkAdd(false)}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-700 pt-1 cursor-pointer"
                  >
                    بازگشت به حالت تکی
                  </button>
                </form>
              )}
            </div>

            {/* ستون چپ: کادر اختصاصی به نام همین کلاس: لیست دانش‌آموزان کلاس [نام کلاس] */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              {/* هدر کادر به نام همین کلاس و جستجو */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
                    <span>لیست دانش‌آموزان کلاس «{className}»</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold">
                      {toPersianDigits(classStudents.length)} نفر
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    برای کم کردن یا حذف دانش‌آموز از کلاس، روی دکمه قرمز سطل زباله کلیک کنید.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-52">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="جستجوی نام، کد، شماره..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full text-xs pr-8 pl-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-blue-600"
                    />
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="چاپ لیست کلاسی"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* نوار عملیات گروهی */}
              {selectedStudentIds.size > 0 && (
                <div className="p-2.5 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-amber-900">
                    {toPersianDigits(selectedStudentIds.size)} دانش‌آموز انتخاب شدند:
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkMoveClass(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="text-xs bg-white border border-amber-300 rounded-lg px-2 py-1 font-bold cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>انتقال دسته‌جمعی به...</option>
                      {config.classes
                        .filter((c) => c !== className)
                        .map((c) => (
                          <option key={c} value={c}>
                            انتقال به {c}
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={handleBulkDelete}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      کم کردن و حذف دسته‌جمعی
                    </button>
                  </div>
                </div>
              )}

              {/* لیست اسامی با دکمه کم کردن (حذف)، ویرایش و انتقال */}
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto flex-1">
                {classStudents.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    {studentSearch
                      ? 'دانش‌آموزی مطابق با جستجوی شما یافت نشد.'
                      : `هنوز دانش‌آموزی برای کلاس «${className}» ثبت نشده است. از فرم روبرو برای افزودن استفاده نمایید.`}
                  </div>
                ) : (
                  classStudents.map((st, idx) => {
                    const isSelected = selectedStudentIds.has(st.id);
                    return (
                      <div
                        key={st.id}
                        className={`p-3 sm:p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-amber-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const next = new Set(selectedStudentIds);
                              if (e.target.checked) next.add(st.id);
                              else next.delete(st.id);
                              setSelectedStudentIds(next);
                            }}
                            className="rounded text-amber-600 cursor-pointer"
                          />
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                            {toPersianDigits(idx + 1)}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{st.name}</p>
                            <div className="flex flex-wrap gap-2.5 text-[11px] text-slate-500 mt-0.5">
                              {st.fatherName && (
                                <span>
                                  نام پدر: <strong className="text-slate-700">{st.fatherName}</strong>
                                </span>
                              )}
                              {st.code && (
                                <span>
                                  کد: <strong className="font-mono text-slate-700">{toPersianDigits(st.code)}</strong>
                                </span>
                              )}
                              {st.mobile && (
                                <span>
                                  همراه: <strong className="font-mono text-blue-700">{toPersianDigits(st.mobile)}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* انتقال سریع به کلاس دیگر */}
                          <select
                            value={st.className}
                            onChange={(e) => handleMoveStudentClass(st.id, e.target.value)}
                            className="text-[11px] font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg cursor-pointer text-slate-600 hover:border-slate-400"
                            title="انتقال دانش‌آموز به کلاس دیگر"
                          >
                            {sortClassesCustom(config.classes).map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>

                          {/* ویرایش مشخصات دانش‌آموز */}
                          <button
                            onClick={() => onOpenEditStudent(st)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="ویرایش مشخصات"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* کم کردن / حذف دانش‌آموز */}
                          <button
                            onClick={() => handleDeleteStudent(st.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="کم کردن و حذف دانش‌آموز از کلاس"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* فوتر وضعیت پنجره */}
        <div className="bg-white px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">وضعیت کلاس {className}:</span>
            <span>{toPersianDigits(classStudents.length)} دانش‌آموز ثبت‌شده</span>
            <span>•</span>
            <span>{connectedSubjectsCount > 0 ? `${toPersianDigits(connectedSubjectsCount)} گروه درسی ایتا متصل است` : (generalClassLink ? 'لینک عمومی ایتا متصل است' : 'گروه درسی ایتا هنوز ثبت نشده است')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
