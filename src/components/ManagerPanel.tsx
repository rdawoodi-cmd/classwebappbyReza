import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  ShieldAlert, 
  Lock, 
  Key, 
  Users, 
  BookOpen, 
  GraduationCap, 
  MessageSquare, 
  Check, 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  Globe, 
  Sparkles, 
  ArrowRightLeft, 
  HardDrive, 
  CheckCircle2, 
  GitBranch, 
  LogOut,
  UserCheck,
  Building,
  School,
  FileSpreadsheet,
  Edit3,
  Search,
  ExternalLink,
  Printer,
  X,
  AlertCircle,
  Smartphone,
  Phone,
  FileArchive,
  Database,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { AppConfig, StudentProfile, TeacherAccount, AttendanceRecord, Assignment, Exam } from '../types';
import { ClassManageModal } from './ClassManageModal';
import { APP_VERSION_FA, APP_VERSION, APP_BUILD_DATE_FA, APP_BUILD_NOTES } from '../version';
import { exportBackupJSON } from '../utils/storage';
import { toPersianDigits, sortClassesCustom } from '../utils/persianDate';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';

interface ManagerPanelProps {
  config: AppConfig;
  students: StudentProfile[];
  attendance: AttendanceRecord[];
  assignments: Assignment[];
  exams: Exam[];
  isManagerLoggedIn: boolean;
  onManagerLogin: (pin: string) => boolean;
  onManagerLogout: () => void;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onUpdateStudents: (updatedStudents: StudentProfile[]) => void;
  onRestoreBackup: (parsedData: any) => void;
  onSaveChanges?: () => void;
}

type ManagerSubTab = 'classes-students' | 'teachers' | 'school-security' | 'deploy-backup';

export const ManagerPanel: React.FC<ManagerPanelProps> = ({
  config,
  students,
  attendance,
  assignments,
  exams,
  isManagerLoggedIn,
  onManagerLogin,
  onManagerLogout,
  onUpdateConfig,
  onUpdateStudents,
  onRestoreBackup,
  onSaveChanges,
}) => {
  // Login States
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Supabase connection testing state
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setSupabaseTestResult(res);
    } catch (err: any) {
      setSupabaseTestResult({ success: false, message: err.message || 'خطا در ارتباط با دیتابیس سوپابیس' });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  // Active sub-tab
  const [subTab, setSubTab] = useState<ManagerSubTab>('classes-students');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(null), 3500);
  };

  // --- Classes & Students State ---
  const [activeClass, setActiveClass] = useState<string>(() => config.classes[0] || 'هشتم ب');
  const [classModalOpen, setClassModalOpen] = useState<string | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassNameInput, setNewClassNameInput] = useState('');
  const [newClassEitaaInput, setNewClassEitaaInput] = useState('');

  const handleOpenClassModal = (cls: string) => {
    setActiveClass(cls);
    setClassModalOpen(cls);
    setStudentSearch('');
    setSelectedStudentIds(new Set());
    const currentLink = config.classEitaaLinks?.[cls] || '';
    setActiveEitaaLinkInput(currentLink);
  };

  // Class renaming
  const [renamingClass, setRenamingClass] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Eitaa link for active class
  const [activeEitaaLinkInput, setActiveEitaaLinkInput] = useState<string>('');

  // Student search & filter inside active class
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Add single student state
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addCode, setAddCode] = useState('');
  const [addFatherName, setAddFatherName] = useState('');
  const [addMobile, setAddMobile] = useState('');

  // Bulk add students state
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isExtractingAI, setIsExtractingAI] = useState(false);
  const aiFileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit student modal
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editFatherName, setEditFatherName] = useState('');
  const [editMobile, setEditMobile] = useState('');

  // Deletion modal states
  const [deletingClass, setDeletingClass] = useState<string | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<string | null>(null);

  // Subjects
  const [newSubjectNameInput, setNewSubjectNameInput] = useState('');

  // --- Teachers State ---
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<TeacherAccount | null>(null);

  // Box 1 State: Teacher Account Creation/Editing
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherUsername, setNewTeacherUsername] = useState('');
  const [newTeacherPin, setNewTeacherPin] = useState('');

  // --- Security & School Settings States ---
  const [currentManagerPin, setCurrentManagerPin] = useState(config.managerPin || '9876');
  const [currentAdminPin, setCurrentAdminPin] = useState(config.adminPin || '1234');
  const [schoolName, setSchoolName] = useState(config.schoolName || 'دبیرستان امام خمینی سمیرم');
  const [academicYear, setAcademicYear] = useState(config.academicYear || '۱۴۰۵ - ۱۴۰۶');

  // Sync active class if removed
  useEffect(() => {
    if (!config.classes.includes(activeClass)) {
      setActiveClass(config.classes[0] || '');
    }
  }, [config.classes, activeClass]);

  // Sync active class Eitaa link input when activeClass or config changes
  useEffect(() => {
    const currentLink = config.classEitaaLinks?.[activeClass] || '';
    setActiveEitaaLinkInput(currentLink);
  }, [activeClass, config.classEitaaLinks]);

  // Handle Manager Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (onManagerLogin(pinInput)) {
      setLoginError('');
      setPinInput('');
    } else {
      setLoginError('رمز عبور مدیر سایت اشتباه است.');
    }
  };

  // If not logged in as manager, show login card
  if (!isManagerLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 border border-amber-200 px-3 py-0.5 rounded-full">
              بخش ویژه مدیریت عالی سایت
            </span>
            <h2 className="text-lg font-extrabold text-slate-800 mt-2">ورود به پنل مدیریت سایت</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              این پنل مخصوص مدیریت کلاس‌ها، لیست دانش‌آموزان، اتصال لینک‌های ایتا، دبیران، رمزها و استقرار سامانه است.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="رمز مدیر سایت را وارد کنید (پیش‌فرض: 9876)"
                  className="w-full text-center tracking-widest text-base font-bold py-3 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  {showPin ? 'مخفی' : 'نمایش'}
                </button>
              </div>
              {loginError && (
                <p className="text-xs text-rose-600 mt-2 font-medium">{loginError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>ورود به پنل مدیریت سایت</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            رمز پیش‌فرض اولیه مدیر سایت: <code className="font-mono font-bold text-slate-600">9876</code>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // --- HANDLERS: CLASSES & EITAA & STUDENTS ---
  // ==========================================

  // 1. Add new class
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newClassNameInput.trim();
    if (!name) return;
    if (config.classes.includes(name)) {
      alert(`کلاس «${name}» از قبل وجود دارد.`);
      return;
    }

    const updatedClasses = [...config.classes, name];
    const updatedLinks = {
      ...(config.classEitaaLinks || {}),
      [name]: newClassEitaaInput.trim(),
    };

    onUpdateConfig({
      ...config,
      classes: updatedClasses,
      classEitaaLinks: updatedLinks,
    });

    setActiveClass(name);
    setClassModalOpen(name);
    setNewClassNameInput('');
    setNewClassEitaaInput('');
    setIsAddingClass(false);
    showFeedback(`کلاس «${name}» با موفقیت افزوده شد و پنجره مدیریت آن باز شد.`);
  };

  // 2. Rename class
  const handleStartRename = (className: string) => {
    setRenamingClass(className);
    setRenameInput(className);
  };

  const handleSaveRename = () => {
    if (!renamingClass) return;
    const trimmedNew = renameInput.trim();
    if (!trimmedNew || trimmedNew === renamingClass) {
      setRenamingClass(null);
      return;
    }

    if (config.classes.includes(trimmedNew)) {
      alert(`کلاس دیگری با نام «${trimmedNew}» هم‌اکنون موجود است.`);
      return;
    }

    // A. Update config.classes
    const updatedClasses = config.classes.map((c) => (c === renamingClass ? trimmedNew : c));

    // B. Update config.classEitaaLinks
    const updatedLinks = { ...(config.classEitaaLinks || {}) };
    if (updatedLinks[renamingClass] !== undefined) {
      updatedLinks[trimmedNew] = updatedLinks[renamingClass];
      delete updatedLinks[renamingClass];
    }

    // C. Update allowedClasses for teachers
    const updatedTeachers = (config.teachers || []).map((t) => ({
      ...t,
      allowedClasses: t.allowedClasses?.map((c) => (c === renamingClass ? trimmedNew : c)),
    }));

    onUpdateConfig({
      ...config,
      classes: updatedClasses,
      classEitaaLinks: updatedLinks,
      teachers: updatedTeachers,
    });

    // D. Update className for all enrolled students
    const updatedStudents = students.map((s) =>
      s.className === renamingClass ? { ...s, className: trimmedNew } : s
    );
    onUpdateStudents(updatedStudents);

    if (activeClass === renamingClass) {
      setActiveClass(trimmedNew);
    }
    if (classModalOpen === renamingClass) {
      setClassModalOpen(trimmedNew);
    }

    setRenamingClass(null);
    showFeedback(`نام کلاس از «${renamingClass}» به «${trimmedNew}» تغییر یافت.`);
  };

  // 3. Remove class
  const handleRemoveClass = (className: string) => {
    setDeletingClass(className);
  };

  const confirmDeleteClass = () => {
    if (!deletingClass) return;
    const className = deletingClass;
    const updatedClasses = config.classes.filter((c) => c !== className);
    const updatedLinks = { ...(config.classEitaaLinks || {}) };
    delete updatedLinks[className];

    const updatedTeachers = (config.teachers || []).map((t) => ({
      ...t,
      allowedClasses: t.allowedClasses ? t.allowedClasses.filter((c) => c !== className) : updatedClasses,
    }));

    onUpdateConfig({
      ...config,
      classes: updatedClasses,
      teachers: updatedTeachers,
      classEitaaLinks: updatedLinks,
    });

    if (activeClass === className) {
      setActiveClass(updatedClasses[0] || '');
    }
    if (classModalOpen === className) {
      setClassModalOpen(null);
    }
    setDeletingClass(null);
    showFeedback(`کلاس «${className}» با موفقیت حذف شد.`);
    alert(`کلاس «${className}» با موفقیت حذف شد.`);
  };

  // 4. Save Eitaa link for active class
  const handleSaveActiveEitaaLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeClass) return;

    const updatedLinks = {
      ...(config.classEitaaLinks || {}),
      [activeClass]: activeEitaaLinkInput.trim(),
    };

    onUpdateConfig({
      ...config,
      classEitaaLinks: updatedLinks,
    });
    showFeedback(`لینک گروه ایتا برای کلاس «${activeClass}» با موفقیت ذخیره شد.`);
  };

  // 5. Add single student to active class
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName.trim() || !addLastName.trim()) {
      alert('وارد کردن نام و نام‌خانوادگی دانش‌آموز الزامی است.');
      return;
    }
    if (!activeClass) {
      alert('لطفاً ابتدا یک کلاس را انتخاب کنید.');
      return;
    }

    const fullName = `${addFirstName.trim()} ${addLastName.trim()}`;
    const newSt: StudentProfile = {
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: fullName,
      firstName: addFirstName.trim(),
      lastName: addLastName.trim(),
      className: activeClass,
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
    showFeedback(`دانش‌آموز «${fullName}» به کلاس ${activeClass} اضافه شد.`);
  };

  // 6. Bulk add students to active class
  const handleBulkAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim() || !activeClass) return;

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

      // split firstName / lastName
      const nameParts = name.split(' ');
      const lastName = nameParts.length > 1 ? nameParts.pop()! : '';
      const firstName = nameParts.join(' ') || name;

      newStudents.push({
        id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        firstName,
        lastName,
        className: activeClass,
        code,
        fatherName: father,
        createdAt: new Date().toISOString(),
      });
    });

    onUpdateStudents([...students, ...newStudents]);
    setBulkText('');
    setShowBulkAdd(false);
    showFeedback(`${newStudents.length} دانش‌آموز به کلاس «${activeClass}» افزوده شدند.`);
  };

  // 7. AI extraction for bulk students
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
          alert('هوش مصنوعی نتوانست فایل را بخواند. لطفاً متن را دستی کپی کنید.');
        } finally {
          setIsExtractingAI(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsExtractingAI(false);
    }
  };

  // 8. Delete student
  const handleDeleteStudent = (id: string) => {
    const st = students.find((s) => s.id === id);
    const studentName = st?.name || 'دانش‌آموز';
    onUpdateStudents(students.filter((s) => s.id !== id));
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showFeedback(`دانش‌آموز «${studentName}» با موفقیت حذف گردید.`);
  };

  // 9. Move student class
  const handleMoveStudentClass = (studentId: string, targetClass: string) => {
    const updated = students.map((s) => (s.id === studentId ? { ...s, className: targetClass } : s));
    onUpdateStudents(updated);
    showFeedback(`دانش‌آموز به کلاس «${targetClass}» منتقل شد.`);
  };

  // 10. Bulk transfer
  const handleBulkMoveClass = (targetClass: string) => {
    if (selectedStudentIds.size === 0) {
      showFeedback('هیچ دانش‌آموزی انتخاب نشده است.');
      return;
    }
    const updated = students.map((s) =>
      selectedStudentIds.has(s.id) ? { ...s, className: targetClass } : s
    );
    onUpdateStudents(updated);
    showFeedback(`${selectedStudentIds.size} دانش‌آموز به کلاس ${targetClass} منتقل شدند.`);
    setSelectedStudentIds(new Set());
  };

  // 11. Bulk delete
  const handleBulkDelete = () => {
    if (selectedStudentIds.size === 0) {
      showFeedback('هیچ دانش‌آموزی انتخاب نشده است.');
      return;
    }
    const count = selectedStudentIds.size;
    onUpdateStudents(students.filter((s) => !selectedStudentIds.has(s.id)));
    showFeedback(`${count} دانش‌آموز با موفقیت حذف شدند.`);
    setSelectedStudentIds(new Set());
  };

  // 12. Edit student modal handlers
  const handleOpenEditStudent = (st: StudentProfile) => {
    setEditingStudent(st);
    setEditFirstName(st.firstName || st.name.split(' ')[0] || '');
    setEditLastName(st.lastName || st.name.split(' ').slice(1).join(' ') || '');
    setEditCode(st.code || '');
    setEditFatherName(st.fatherName || '');
    setEditMobile(st.mobile || '');
  };

  const handleSaveEditedStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const fullName = `${editFirstName.trim()} ${editLastName.trim()}`;
    const updated = students.map((s) =>
      s.id === editingStudent.id
        ? {
            ...s,
            name: fullName,
            firstName: editFirstName.trim(),
            lastName: editLastName.trim(),
            code: editCode.trim() || undefined,
            fatherName: editFatherName.trim() || undefined,
            mobile: editMobile.trim() || undefined,
          }
        : s
    );
    onUpdateStudents(updated);
    setEditingStudent(null);
    showFeedback(`مشخصات دانش‌آموز «${fullName}» به‌روزرسانی شد.`);
  };

  // 13. Subject handlers
  const handleAddSubject = () => {
    const name = newSubjectNameInput.trim();
    if (!name || config.subjects.includes(name)) return;
    onUpdateConfig({
      ...config,
      subjects: [...config.subjects, name],
    });
    setNewSubjectNameInput('');
    showFeedback(`درس «${name}» افزوده شد.`);
  };

  const handleRemoveSubject = (s: string) => {
    setDeletingSubject(s);
  };

  const confirmDeleteSubject = () => {
    if (!deletingSubject) return;
    const s = deletingSubject;
    onUpdateConfig({
      ...config,
      subjects: config.subjects.filter((x) => x !== s),
    });
    setDeletingSubject(null);
    showFeedback(`درس «${s}» با موفقیت حذف شد.`);
    alert(`درس «${s}» با موفقیت حذف شد.`);
  };

  // ==========================================
  // --- HANDLERS: TEACHERS ---
  // ==========================================

  // Helper: Get classes assigned to a specific teacher for a specific subject (Strictly from subjectClasses)
  const getTeacherClassesForSubject = (tch: TeacherAccount, subjectName: string): string[] => {
    if (tch.subjectClasses && typeof tch.subjectClasses === 'object') {
      const list = tch.subjectClasses[subjectName];
      if (Array.isArray(list) && list.length > 0) {
        return list.filter((c) => config.classes.includes(c));
      }
    }
    return [];
  };

  const getConflictTeacher = (subjectName: string, className: string, currentTeacherId: string): string | null => {
    const otherTeachers = (config.teachers || []).filter((t) => t.id !== currentTeacherId);
    for (const tch of otherTeachers) {
      const tchAssignedClasses = getTeacherClassesForSubject(tch, subjectName);
      if (tchAssignedClasses.includes(className)) {
        return tch.name;
      }
    }
    return null;
  };

  // Handler: Matrix Toggle Class for a Teacher & Subject
  const handleMatrixToggleClass = (teacherId: string, subjectName: string, className: string) => {
    const conflictTeacher = getConflictTeacher(subjectName, className, teacherId);
    if (conflictTeacher) {
      alert(`درس «${subjectName}» در کلاس «${className}» قبلاً به آقای «${conflictTeacher}» اختصاص یافته است.`);
      return;
    }

    const currentTeachers = config.teachers || [];
    const updatedTeachers = currentTeachers.map((t) => {
      if (t.id !== teacherId) return t;

      const currentSubClassesMap: Record<string, string[]> = { ...(t.subjectClasses || {}) };

      const currentClassesForSub = currentSubClassesMap[subjectName] || [];
      let updatedClassesForSub: string[];

      if (currentClassesForSub.includes(className)) {
        updatedClassesForSub = currentClassesForSub.filter((c) => c !== className);
      } else {
        updatedClassesForSub = sortClassesCustom([...currentClassesForSub, className]);
      }

      if (updatedClassesForSub.length > 0) {
        currentSubClassesMap[subjectName] = updatedClassesForSub;
      } else {
        delete currentSubClassesMap[subjectName];
      }

      const activeSubjects = Object.keys(currentSubClassesMap);
      const allSelectedClasses = Array.from(new Set(Object.values(currentSubClassesMap).flat()));

      return {
        ...t,
        subjects: activeSubjects,
        subject: activeSubjects[0] || '',
        allowedClasses: allSelectedClasses,
        subjectClasses: currentSubClassesMap,
      };
    });

    onUpdateConfig({ ...config, teachers: updatedTeachers });
  };

  // Handler: Matrix Toggle All Available Classes for a Teacher & Subject
  const handleMatrixToggleAllClassesForSubject = (teacherId: string, subjectName: string) => {
    const targetTeacher = (config.teachers || []).find((t) => t.id === teacherId);
    if (!targetTeacher) return;

    const currentAssigned = getTeacherClassesForSubject(targetTeacher, subjectName);
    const sortedSchoolClasses = sortClassesCustom(config.classes);
    const availableClasses = sortedSchoolClasses.filter((cls) => {
      const conflict = getConflictTeacher(subjectName, cls, teacherId);
      return !conflict;
    });

    if (availableClasses.length === 0) {
      alert(`تمام کلاس‌های درس «${subjectName}» قبلاً به دبیران دیگر اختصاص داده شده‌اند.`);
      return;
    }

    const areAllAvailableAssigned = availableClasses.every((cls) => currentAssigned.includes(cls));

    const currentTeachers = config.teachers || [];
    const updatedTeachers = currentTeachers.map((t) => {
      if (t.id !== teacherId) return t;

      const currentSubClassesMap: Record<string, string[]> = { ...(t.subjectClasses || {}) };

      if (areAllAvailableAssigned) {
        delete currentSubClassesMap[subjectName];
      } else {
        currentSubClassesMap[subjectName] = [...availableClasses];
      }

      const activeSubjects = Object.keys(currentSubClassesMap);
      const allSelectedClasses = Array.from(new Set(Object.values(currentSubClassesMap).flat()));

      return {
        ...t,
        subjects: activeSubjects,
        subject: activeSubjects[0] || '',
        allowedClasses: allSelectedClasses,
        subjectClasses: currentSubClassesMap,
      };
    });

    onUpdateConfig({ ...config, teachers: updatedTeachers });
  };

  // Handler 1: Save Teacher Account (Box 1)
  const handleSaveTeacherAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !newTeacherPin.trim()) {
      alert('نام دبیر و رمز عبور اختصاصی الزامی است.');
      return;
    }

    const currentTeachers = config.teachers || [];
    let updatedTeachers: TeacherAccount[] = [];

    if (editingTeacherId) {
      updatedTeachers = currentTeachers.map((t) =>
        t.id === editingTeacherId
          ? {
              ...t,
              name: newTeacherName.trim(),
              username: newTeacherUsername.trim() || t.username,
              pin: newTeacherPin.trim(),
            }
          : t
      );
      showFeedback(`اطلاعات حساب و رمز دبیر «${newTeacherName.trim()}» با موفقیت ذخیره گردید.`);
    } else {
      const targetTeacherId = `tch-${Date.now()}`;
      const newTeacher: TeacherAccount = {
        id: targetTeacherId,
        name: newTeacherName.trim(),
        username: newTeacherUsername.trim() || `teacher_${Date.now().toString().slice(-4)}`,
        pin: newTeacherPin.trim(),
        subjects: [],
        subject: '',
        allowedClasses: [],
        subjectClasses: {},
      };
      updatedTeachers = [...currentTeachers, newTeacher];
      showFeedback(`حساب دبیر «${newTeacherName.trim()}» ایجاد شد. اکنون می‌توانید در جدول ماتریسی زیر کلاس‌های او را تعیین کنید.`);
    }

    onUpdateConfig({ ...config, teachers: updatedTeachers });

    // Reset Box 1 fields
    setEditingTeacherId(null);
    setNewTeacherName('');
    setNewTeacherUsername('');
    setNewTeacherPin('');
  };

  // Handler 2: Edit teacher account button click
  const handleEditTeacherAccount = (tch: TeacherAccount) => {
    setEditingTeacherId(tch.id);
    setNewTeacherName(tch.name);
    setNewTeacherUsername(tch.username);
    setNewTeacherPin(tch.pin);
    showFeedback(`اطلاعات دبیر «${tch.name}» جهت ویرایش در کادر بالا بارگذاری گردید.`);
  };

  // Handler 3: Cancel Box 1 edit
  const handleCancelEditTeacher = () => {
    setEditingTeacherId(null);
    setNewTeacherName('');
    setNewTeacherUsername('');
    setNewTeacherPin('');
  };

  const handleDeleteTeacher = (id: string) => {
    const tch = config.teachers?.find((t) => t.id === id);
    if (tch) {
      setDeletingTeacher(tch);
    }
  };

  const confirmDeleteTeacher = () => {
    if (!deletingTeacher) return;
    const teacherName = deletingTeacher.name;
    const updatedTeachers = (config.teachers || []).filter((t) => t.id !== deletingTeacher.id);
    onUpdateConfig({
      ...config,
      teachers: updatedTeachers,
    });
    setDeletingTeacher(null);
    showFeedback(`دبیر «${teacherName}» با موفقیت حذف شد.`);
    alert(`دبیر «${teacherName}» با موفقیت حذف شد.`);
  };

  // ==========================================
  // --- HANDLERS: SECURITY & SCHOOL ---
  // ==========================================
  const handleSaveSecuritySettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentManagerPin.trim() || !currentAdminPin.trim()) {
      alert('رمزها نباید خالی باشند.');
      return;
    }
    onUpdateConfig({
      ...config,
      schoolName: schoolName.trim(),
      academicYear: academicYear.trim(),
      managerPin: currentManagerPin.trim(),
      adminPin: currentAdminPin.trim(),
    });
    showFeedback('تنظیمات امنیتی و رمزهای ورود با موفقیت ذخیره شدند.');
  };

  // Filtered students of active class
  const activeClassStudents = students
    .filter((s) => s.className === activeClass)
    .filter((s) => {
      if (!studentSearch.trim()) return true;
      const q = studentSearch.trim().toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.fatherName && s.fatherName.toLowerCase().includes(q)) ||
        (s.code && s.code.includes(q)) ||
        (s.mobile && s.mobile.includes(q))
      );
    })
    .sort((a, b) => {
      const lastNameComparison = (a.lastName || '').localeCompare(b.lastName || '', 'fa');
      if (lastNameComparison !== 0) return lastNameComparison;
      return (a.firstName || a.name).localeCompare(b.firstName || b.name, 'fa');
    });

  const activeClassEitaaLink = config.classEitaaLinks?.[activeClass] || '';

  return (
    <div className="space-y-6">
      {/* سربرگ افقی و خلوت پنل مدیریت */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-800">
                پنل مدیریت سایت
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                مدیریت عالی
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onSaveChanges) onSaveChanges();
                showFeedback('تمامی تغییرات و تنظیمات مدیریت ذخیره و در سراسر سامانه (پنل دبیران و دانش‌آموزان) اعمال گردید.');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
              title="ذخیره و اعمال فوری تمامی تغییرات در کل برنامه"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ذخیره تغییرات</span>
            </button>
            <button
              onClick={onManagerLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از پنل</span>
            </button>
          </div>
        </div>

        {savedMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedMsg}</span>
          </div>
        )}

        {/* ساب‌تب‌های پنل مدیریت */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
          {[
            { id: 'classes-students', label: 'کلاس‌ها و دانش‌آموزان', icon: <GraduationCap className="w-4 h-4" /> },
            { id: 'teachers', label: 'دبیران و رمزها', icon: <UserCheck className="w-4 h-4" /> },
            { id: 'school-security', label: 'امنیت و رمزها', icon: <Key className="w-4 h-4" /> },
            { id: 'deploy-backup', label: 'استقرار و پشتیبان‌گیری', icon: <Globe className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as ManagerSubTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subTab === tab.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* =============================================================== */}
      {/* ۱. تب اصلی: مدیریت کلاس‌ها، دانش‌آموزان و اتصال لینک گروه ایتا */}
      {/* =============================================================== */}
      {subTab === 'classes-students' && (
        <div className="space-y-6">
          {/* بخش نوار انتخاب کلاس‌ها و دکمه افزودن کلاس جدید */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                  <span>انتخاب کلاس برای مدیریت دانش‌آموزان و تنظیم لینک ایتا</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  کلاس مورد نظر را انتخاب کنید تا لیست دانش‌آموزان و لینک گروه چت ایتا متصل به آن را ویرایش نمایید.
                </p>
              </div>

              <button
                onClick={() => setIsAddingClass(!isAddingClass)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن کلاس جدید</span>
              </button>
            </div>

            {/* فرم بازشونده ایجاد کلاس جدید */}
            {isAddingClass && (
              <form onSubmit={handleAddClass} className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-700" />
                    تعریف و ایجاد کلاس جدید در مدرسه
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingClass(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      نام کلاس جدید: <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: نهم الف، دهم تجربی، هفتم ۲"
                      value={newClassNameInput}
                      onChange={(e) => setNewClassNameInput(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-blue-600"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      لینک گروه چت ایتا برای این کلاس (اختیاری):
                    </label>
                    <input
                      type="url"
                      placeholder="https://eitaa.com/joinchat/..."
                      value={newClassEitaaInput}
                      onChange={(e) => setNewClassEitaaInput(e.target.value)}
                      className="w-full text-xs font-mono px-3.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingClass(false)}
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    ثبت و ساخت کلاس
                  </button>
                </div>
              </form>
            )}

            {/* کادرهای افقی زیر هم با طیف آبی برای مدیریت و انتخاب کلاس‌ها */}
            <div className="space-y-3 pt-2">
              {sortClassesCustom(config.classes).map((cls) => {
                const isActive = cls === activeClass;
                const count = students.filter((s) => s.className === cls).length;
                const eLink = config.classEitaaLinks?.[cls];
                const subjectLinksMap = config.classSubjectEitaaLinks?.[cls] || {};
                const connectedSubjectsCount = Object.values(subjectLinksMap).filter(
                  (l) => typeof l === 'string' && l.trim().length > 0
                ).length;
                const hasEitaa = connectedSubjectsCount > 0 || Boolean(eLink && eLink.trim());

                return (
                  <div
                    key={cls}
                    onClick={() => handleOpenClassModal(cls)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:shadow-md ${
                      isActive
                        ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-2 ring-blue-300/60'
                        : 'bg-white hover:bg-blue-50/40 border-slate-200 hover:border-blue-300 shadow-2xs'
                    }`}
                  >
                    {/* سمت راست: آیکون کلاس، عنوان و مشخصات */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-6 h-6 text-blue-600" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                            کلاس {cls}
                          </h4>
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                              کلاس فعال
                            </span>
                          )}
                        </div>

                        {/* اطلاعات مشخصات (تعداد دانش‌آموزان و وضعیت ایتا) */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-800 text-xs font-bold border border-sky-200/80">
                            <Users className="w-3.5 h-3.5 text-sky-600" />
                            <span>{toPersianDigits(count)} دانش‌آموز</span>
                          </span>

                          {connectedSubjectsCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{toPersianDigits(connectedSubjectsCount)} درس ایتا متصل</span>
                            </span>
                          ) : hasEitaa ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>ایتا عمومی متصل</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                              <span>بدون ایتا</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* سمت چپ: دکمه‌های عملیاتی (ویرایش نام، حذف، و ورود به مدیریت کلاس) */}
                    <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleStartRename(cls)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors cursor-pointer flex items-center gap-1"
                        title="تغییر نام کلاس"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>تغییر نام</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveClass(cls)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors cursor-pointer flex items-center gap-1"
                        title="حذف کامل این کلاس"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>حذف</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenClassModal(cls)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>مدیریت کلاس</span>
                        <span className="text-[10px]">←</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* راهنمای دسترسی به پنجره هر کلاس */}
            <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-900 mt-3">
              <div className="flex items-center gap-2.5 font-bold">
                <GraduationCap className="w-5 h-5 text-blue-600 shrink-0" />
                <span>برای افزودن یا کم کردن دانش‌آموزان و تنظیم لینک گروه ایتا، روی کادر افقی کلاس مورد نظر کلیک کنید تا پنجره اختصاصی آن باز شود.</span>
              </div>
            </div>
          </div>

          {/* ویرایش نام کلاس Modal/Inline */}
          {renamingClass && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-600" />
                    <span>تغییر نام کلاس «{renamingClass}»</span>
                  </h4>
                  <button onClick={() => setRenamingClass(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">نام جدید کلاس:</label>
                  <input
                    type="text"
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-amber-600"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                    با تغییر نام کلاس، تمام دانش‌آموزان ثبت‌شده در این کلاس نیز به نام جدید منتقل خواهند شد.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setRenamingClass(null)}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleSaveRename}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    ذخیره نام جدید
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* پنجره اختصاصی مدیریت کلاس انتخاب شده (Modal) */}
          <ClassManageModal
            isOpen={!!classModalOpen}
            className={classModalOpen}
            onClose={() => setClassModalOpen(null)}
            config={config}
            students={students}
            onUpdateConfig={onUpdateConfig}
            onUpdateStudents={onUpdateStudents}
            onOpenEditStudent={handleOpenEditStudent}
            onSelectClass={(cls) => handleOpenClassModal(cls)}
            showFeedback={showFeedback}
          />

          {/* مدال ویرایش اطلاعات دانش‌آموز */}
          {editingStudent && (
            <div className="fixed inset-0 z-70 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <span>ویرایش مشخصات دانش‌آموز</span>
                  </h4>
                  <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditedStudent} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">نام:</label>
                      <input
                        type="text"
                        required
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">نام خانوادگی:</label>
                      <input
                        type="text"
                        required
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">نام پدر:</label>
                      <input
                        type="text"
                        value={editFatherName}
                        onChange={(e) => setEditFatherName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">کد دانش‌آموزی:</label>
                      <input
                        type="text"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600 text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">شماره همراه / ایتا:</label>
                    <input
                      type="tel"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600 text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingStudent(null)}
                      className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      ذخیره تغییرات
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* مدیریت عناوین دروس مدرسه */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>مدیریت عناوین دروس آموزشگاه</span>
            </h4>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="درس جدید (مثلاً: علوم تجربی، زبان انگلیسی)"
                value={newSubjectNameInput}
                onChange={(e) => setNewSubjectNameInput(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
              />
              <button
                type="button"
                onClick={handleAddSubject}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 shadow-xs"
              >
                + افزودن درس
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {config.subjects.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-2 text-xs font-bold bg-blue-50/80 text-blue-900 px-3 py-1.5 rounded-xl border border-blue-200/80 shadow-2xs"
                >
                  <span>درس {s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(s)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 hover:bg-rose-50 rounded transition-colors"
                    title="حذف درس"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* ۲. تب دبیران و تخصیص درس و رمز ورود هر دبیر                     */}
      {/* =============================================================== */}
      {subTab === 'teachers' && (() => {
        const sortedTeachers = [...(config.teachers || [])].sort((a, b) => a.name.localeCompare(b.name, 'fa'));
        const sortedSchoolClasses = sortClassesCustom(config.classes);

        return (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span>تعیین دبیران، درس مربوطه و رمز عبور اختصاصی</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                در کادر اول نام دبیر جدید و رمز عبور او را ثبت کنید، سپس در جدول ماتریسی زیر، دروس و کلاس‌های تحت تدریس هر دبیر (مرتب‌شده بر اساس حروف الفبا) را تیک بزنید.
              </p>
            </div>

            {/* 📌 کادر اول: ثبت نام دبیر و رمز عبور اختصاصی */}
            <form onSubmit={handleSaveTeacherAccount} className="bg-slate-50/90 p-4.5 rounded-2xl border border-slate-200 space-y-3.5 shadow-2xs max-w-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] font-bold">۱</span>
                    <span>کادر اول: ثبت نام دبیر و رمز عبور اختصاصی</span>
                  </div>
                  {editingTeacherId && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                      حالت ویرایش
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">نام و نام‌خانوادگی دبیر:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: محمدرضا داودی"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-amber-600 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">رمز عبور اختصاصی دبیر:</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: 1234"
                        value={newTeacherPin}
                        onChange={(e) => setNewTeacherPin(e.target.value)}
                        className="w-full text-xs font-mono font-bold px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-amber-600 text-left"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">نام کاربری / شناسه (اختیاری):</label>
                      <input
                        type="text"
                        placeholder="مثال: davoodi"
                        value={newTeacherUsername}
                        onChange={(e) => setNewTeacherUsername(e.target.value)}
                        className="w-full text-xs font-mono px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-amber-600 text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  {editingTeacherId && (
                    <button
                      type="button"
                      onClick={handleCancelEditTeacher}
                      className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                    >
                      انصراف
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingTeacherId ? 'ذخیره نام و رمز عبور' : 'ذخیره حساب دبیر'}</span>
                  </button>
                </div>
              </form>

              {/* 📊 جدول ماتریسی تخصیص دروس و کلاس‌ها به دبیران */}
              <div className="space-y-3 pt-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100/90 p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span>جدول ماتریسی تخصیص دروس و کلاس‌ها به دبیران</span>
                      <span className="text-[11px] text-slate-500 font-normal mr-2">
                        (مرتب‌شده بر اساس حروف الفبا - {sortedTeachers.length} دبیر)
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    💡 با تیک زدن کلاس‌ها در مقابل نام هر دبیر، تغییرات به‌صورت آنی ذخیره می‌شود.
                  </div>
                </div>

                {sortedTeachers.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    هیچ دبیری هنوز تعریف نشده است. لطفاً از کادر بالا دبیر جدید را ثبت نمایید.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-extrabold">
                          <th className="p-3.5 min-w-[220px] max-w-[260px] border-l border-slate-200 sticky right-0 bg-slate-100 z-10 shadow-xs">
                            مشخصات دبیر (الفبایی)
                          </th>
                          {config.subjects.map((sub) => (
                            <th key={sub} className="p-3.5 min-w-[220px] border-l border-slate-200 text-center">
                              <div className="font-extrabold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300 inline-block">
                                درس {sub}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {sortedTeachers.map((tch) => {
                          return (
                            <tr key={tch.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* ستون ۱: مشخصات دبیر */}
                              <td className="p-3.5 border-l border-slate-200 sticky right-0 bg-white z-10 shadow-xs">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs shrink-0 border border-amber-200">
                                      {tch.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-extrabold text-slate-800 text-xs">{tch.name}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">@{tch.username}</div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
                                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                      رمز: {tch.pin}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleEditTeacherAccount(tch)}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                        title="ویرایش نام و رمز عبور در کادر بالا"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTeacher(tch.id)}
                                        className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="حذف حساب دبیر"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* ستون‌های دروس */}
                              {config.subjects.map((sub) => {
                                const assignedClasses = getTeacherClassesForSubject(tch, sub);
                                const visibleClasses = sortedSchoolClasses.filter((cls) => {
                                  const isAssignedToThisTch = assignedClasses.includes(cls);
                                  if (isAssignedToThisTch) return true;
                                  const conflictTeacherName = getConflictTeacher(sub, cls, tch.id);
                                  return !conflictTeacherName;
                                });

                                return (
                                  <td key={sub} className="p-3 border-l border-slate-200 align-top">
                                    <div className="space-y-2">
                                      {/* دکمه اقدام سریع */}
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                        <span className="text-[10px] font-extrabold text-slate-500">
                                          کلاس‌های {sub}:
                                        </span>
                                        {visibleClasses.length > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => handleMatrixToggleAllClassesForSubject(tch.id, sub)}
                                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                          >
                                            {assignedClasses.length > 0 ? 'پاکسازی / تغییر' : 'انتخاب همه'}
                                          </button>
                                        )}
                                      </div>

                                      {/* لیست کلاس‌ها */}
                                      {visibleClasses.length === 0 ? (
                                        <div className="text-[11px] text-slate-400 font-medium py-1 italic">
                                          تمام کلاس‌ها به سایر دبیران اختصاص یافته است
                                        </div>
                                      ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                          {visibleClasses.map((cls) => {
                                            const isAssignedToThisTch = assignedClasses.includes(cls);

                                            return (
                                              <label
                                                key={cls}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                                  isAssignedToThisTch
                                                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                                }`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isAssignedToThisTch}
                                                  onChange={() => handleMatrixToggleClass(tch.id, sub, cls)}
                                                  className="rounded text-blue-600 cursor-pointer"
                                                />
                                                <span>{cls}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* =============================================================== */}
      {/* ۳. تب مشخصات آموزشگاه و رمزها                                   */}
      {/* =============================================================== */}
      {subTab === 'school-security' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600" />
              <span>تنظیم رمزهای عبور و مشخصات آموزشگاه</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              در این بخش مدیر سایت می‌تواند رمز عبور خود و همچنین رمز عبور پیش‌فرض دبیران را تغییر دهد.
            </p>
          </div>

          <form onSubmit={handleSaveSecuritySettings} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام آموزشگاه / مدرسه:</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سال تحصیلی:</label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-amber-600"
                />
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  🔑 رمز ورود اختصاصی مدیر سایت (Manager PIN):
                </label>
                <input
                  type="text"
                  required
                  value={currentManagerPin}
                  onChange={(e) => setCurrentManagerPin(e.target.value)}
                  placeholder="پیش‌فرض: 9876"
                  className="w-full text-xs font-mono font-bold px-3.5 py-2 border border-amber-300 rounded-xl bg-white focus:outline-amber-600 text-left"
                  dir="ltr"
                />
                <span className="text-[10px] text-amber-700 mt-1 block">
                  این رمز برای ورود به همین پنل مدیریت سایت استفاده می‌شود.
                </span>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                <label className="block text-xs font-bold text-blue-900 mb-1">
                  🔒 رمز پیش‌فرض ورود دبیران (Default Admin PIN):
                </label>
                <input
                  type="text"
                  required
                  value={currentAdminPin}
                  onChange={(e) => setCurrentAdminPin(e.target.value)}
                  placeholder="پیش‌فرض: 1234"
                  className="w-full text-xs font-mono font-bold px-3.5 py-2 border border-blue-300 rounded-xl bg-white focus:outline-blue-600 text-left"
                  dir="ltr"
                />
                <span className="text-[10px] text-blue-700 mt-1 block">
                  رمز عمومی برای دبیرانی که رمز اختصاصی ندارند.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                ذخیره رمزها و مشخصات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =============================================================== */}
      {/* ۴. تب استقرار نتلیفای، گیت‌هاب و فایل پشتیبان کامل               */}
      {/* =============================================================== */}
      {subTab === 'deploy-backup' && (
        <div className="space-y-6">
          {/* راهنمای اختصاصی گیت‌هاب و نتلیفای */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-2xl border border-blue-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-blue-900">
              <Globe className="w-5 h-5 text-blue-700" />
              <h3 className="font-extrabold text-sm sm:text-base">راهنمای انتشار روی GitHub Pages یا Netlify</h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              این برنامه طوری طراحی شده است که به عنوان یک وب‌اپلیکیشن استاتیک مدرن (SPA) به طور مستقیم روی{' '}
              <strong className="font-bold text-blue-800">گیت‌هاب پیجز (GitHub Pages)</strong> یا{' '}
              <strong className="font-bold text-blue-800">نتلیفای (Netlify)</strong> بدون نیاز به هیچ سرور بک‌اند اختصاصی
              اجرا شود. تمام اطلاعات به صورت خودکار در حافظه مرورگر دستگاه شما (<code className="font-mono text-xs bg-white px-1 py-0.5 rounded border border-blue-200">LocalStorage</code>) ذخیره می‌گردند.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-blue-100">
                <span className="font-bold text-slate-800 block mb-1">روش بارگذاری در Netlify:</span>
                <p className="text-slate-600 leading-relaxed">
                  کافیست پوشه خروجی ساخت (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">dist</code>) را با قابلیت Drag & Drop درون تب Deploys نتلیفای بکشید و رها کنید تا در ۱۰ ثانیه آنلاین شود!
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-blue-100">
                <span className="font-bold text-slate-800 block mb-1">روش بارگذاری در GitHub Pages:</span>
                <p className="text-slate-600 leading-relaxed">
                  تنظیم مقدار <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">base: './'</code> در فایل <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">vite.config.ts</code> انجام شده است تا مسیر فایل‌های css و js بدون خطا لود شوند.
                </p>
              </div>
            </div>
          </div>

          {/* پایگاه داده آنلاین سوپابیس (Supabase PostgreSQL) */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50/30 to-white shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <span>پایگاه‌داده ابری سوپابیس (Supabase PostgreSQL)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                      منطقه زمانی تهران (Asia/Tehran) • تقویم جلالی
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    ذخیره‌سازی و همگام‌سازی ابری اطلاعات مدرسه، نمرات، حضور و غیاب، تکالیف و آزمون‌ها
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSupabaseConfigured() ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>متغیرهای Supabase تنظیم شده‌اند</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300 shadow-2xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>در انتظار کلیدهای Supabase (حالت LocalStorage فعال است)</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-emerald-100">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>📋 راهنمای اتصال دیتابیس Supabase:</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                <li>
                  اسکریپت کامل ساخت جداول با تایم‌زون ایران در فایل <code className="font-mono bg-emerald-50 text-emerald-900 px-1.5 py-0.5 rounded font-bold">supabase-schema.sql</code> قرار دارد.
                </li>
                <li>
                  وارد پنل Supabase شده و در بخش <strong>SQL Editor</strong> اسکریپت فوق را اجرا کنید تا جداول <code className="font-mono text-slate-700">students</code>، <code className="font-mono text-slate-700">attendance_records</code>، <code className="font-mono text-slate-700">assignments</code>، <code className="font-mono text-slate-700">exams</code> و <code className="font-mono text-slate-700">app_config</code> ساخته شوند.
                </li>
                <li>
                  مقادیر <code className="font-mono text-slate-700">VITE_SUPABASE_URL</code> و <code className="font-mono text-slate-700">VITE_SUPABASE_ANON_KEY</code> را در متغیرهای محیطی پروژه تنظیم کنید.
                </li>
              </ol>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={isTestingSupabase}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                <span>{isTestingSupabase ? 'در حال تست ارتباط...' : 'تست اتصال به Supabase'}</span>
              </button>

              <a
                href="/supabase-schema.sql"
                download="supabase-schema.sql"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>دانلود اسکریپت ساخت جداول (SQL)</span>
              </a>
            </div>

            {supabaseTestResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                  supabaseTestResult.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                {supabaseTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{supabaseTestResult.message}</span>
              </div>
            )}
          </div>

          {/* پشتیبان‌گیری و بازیابی داده‌ها */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>پشتیبان‌گیری کامل از اطلاعات سامانه (JSON Backup)</span>
            </h4>
            <p className="text-xs text-slate-500">
              برای جلوگیری از پاک شدن اطلاعات هنگام تغییر مرورگر یا گوشی، می‌توانید فایل پشتیبان کامل سامانه را دانلود کنید و هر زمان نیاز بود دوباره بارگذاری نمایید.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => exportBackupJSON({ config, students, attendance, assignments, exams })}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود فایل پشتیبان کامل (JSON)</span>
              </button>

              <label className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>بازیابی فایل پشتیبان</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      try {
                        const parsed = JSON.parse(reader.result as string);
                        onRestoreBackup(parsed);
                        alert('اطلاعات با موفقیت بازیابی شد ✅');
                      } catch {
                        alert('فایل انتخاب شده معتبر نیست.');
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>

          {/* شناسنامه نسخه */}
          <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50/40 to-white shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <span>شناسنامه و وضعیت نسخه وب‌اپلیکیشن</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px]">
                      نسخه {APP_VERSION_FA} ({APP_VERSION})
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    تاریخ آخرین به‌روزرسانی: {APP_BUILD_DATE_FA}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>آماده گیت‌هاب و نتلیفای</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {APP_BUILD_NOTES}
            </p>

            <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FileArchive className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>دریافت بسته کامل سورس‌کد پروژه با تمامی ماژول‌ها و ابزارها:</span>
              </div>
              <a
                href="/school_app_source_code.zip"
                download="school_app_source_code.zip"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>دانلود فایل کامل سورس کد (ZIP)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Teacher Modal Confirmation */}
      {deletingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-800">حذف دسترسی دبیر</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              آیا از حذف دسترسی دبیر <strong className="text-slate-800">«{deletingTeacher.name}»</strong> اطمینان دارید؟
            </p>
            <p className="text-[11px] text-rose-500 bg-rose-50/70 p-2.5 rounded-xl border border-rose-100">
              ⚠️ با حذف این دبیر، حساب کاربری و امکان ورود ایشان با رمز اختصاصی به سامانه لغو خواهد شد.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTeacher(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={confirmDeleteTeacher}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                بله، دبیر حذف شود
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Class Modal Confirmation */}
      {deletingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-800">حذف کامل کلاس</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              آیا از حذف کامل کلاس <strong className="text-slate-800">«{deletingClass}»</strong> اطمینان دارید؟
            </p>
            {students.filter((s) => s.className === deletingClass).length > 0 && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                ⚠️ <strong>هشدار:</strong> هم‌اکنون تعداد {toPersianDigits(students.filter((s) => s.className === deletingClass).length)} دانش‌آموز در این کلاس ثبت شده‌اند.
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingClass(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={confirmDeleteClass}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                بله، کلاس حذف شود
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Subject Modal Confirmation */}
      {deletingSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-800">حذف عنوان درس</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              آیا از حذف درس <strong className="text-slate-800">«{deletingSubject}»</strong> از لیست دروس آموزشگاه اطمینان دارید؟
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSubject(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={confirmDeleteSubject}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                بله، درس حذف شود
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
