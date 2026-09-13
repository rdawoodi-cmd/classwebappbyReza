import { AttendanceRecord, Assignment, StudentProfile, AppConfig, Exam } from '../types';
import { getInitialConfig, getInitialStudents, getInitialAttendance, getInitialAssignments, getInitialExams } from '../data/initialData';

export interface FullAppState {
  config: AppConfig;
  students: StudentProfile[];
  attendance: AttendanceRecord[];
  assignments: Assignment[];
  exams: Exam[];
}

const STORAGE_KEY = 'smart_school_manager_v4_0';

export function loadLocalState(): FullAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const initialStudents = getInitialStudents();
    if (!raw) {
      return {
        config: getInitialConfig(),
        students: initialStudents,
        attendance: getInitialAttendance(),
        assignments: getInitialAssignments(),
        exams: getInitialExams(),
      };
    }
    const parsed = JSON.parse(raw);
    const initialCfg = getInitialConfig();
    const loadedConfig: AppConfig = { ...initialCfg, ...(parsed.config || {}) };
    if (!loadedConfig.managerPin) loadedConfig.managerPin = initialCfg.managerPin;
    if (!loadedConfig.teachers || loadedConfig.teachers.length === 0) {
      loadedConfig.teachers = initialCfg.teachers;
    } else if (loadedConfig.teachers.length < initialCfg.teachers.length) {
      const existingIds = new Set(loadedConfig.teachers.map((t) => t.id || t.username));
      const missing = initialCfg.teachers.filter((t) => !existingIds.has(t.id) && !existingIds.has(t.username));
      loadedConfig.teachers = [...loadedConfig.teachers, ...missing];
    }
    if (!loadedConfig.classEitaaLinks) loadedConfig.classEitaaLinks = initialCfg.classEitaaLinks;
    if (!loadedConfig.classSubjectEitaaLinks) loadedConfig.classSubjectEitaaLinks = initialCfg.classSubjectEitaaLinks || {};
    loadedConfig.academicYear = '۱۴۰۵ - ۱۴۰۶';
    if (loadedConfig.schoolName === 'دبیرستان دوره اول نمونه دولتی شهید چمران') {
      loadedConfig.schoolName = 'دبیرستان امام خمینی سمیرم';
    }

    // Sanitize teacher subjectClasses mapping strictly without fallback to all classes
    if (loadedConfig.teachers && loadedConfig.classes) {
      const classSet = new Set(loadedConfig.classes);
      loadedConfig.teachers = loadedConfig.teachers.map((t) => {
        const subMap: Record<string, string[]> = {};
        if (t.subjectClasses && typeof t.subjectClasses === 'object') {
          Object.entries(t.subjectClasses).forEach(([sub, clsList]) => {
            if (Array.isArray(clsList)) {
              subMap[sub] = clsList.filter((c) => classSet.has(c));
            }
          });
        }

        const allowed = Array.from(new Set(Object.values(subMap).flat()));

        return {
          ...t,
          allowedClasses: allowed,
          subjectClasses: subMap,
        };
      });
    }

    // Filter out dummy sample students, keep user created or 8-B students
    const dummyNames = new Set([
      'علی رضایی', 'محمد حسینی', 'سارا احمدی', 'امیرمهدی کریمی',
      'فاطمه موسوی', 'پارسا صادقی', 'نیلوفر مرادی', 'حسین کاظمی'
    ]);

    const rawStudents: StudentProfile[] = Array.isArray(parsed.students) && parsed.students.length > 0 
      ? parsed.students.filter((s: StudentProfile) => !dummyNames.has(s.name.trim()))
      : [];

    const existingCodes = new Set(rawStudents.map(s => s.code).filter(Boolean));
    const existingNames = new Set(rawStudents.map(s => s.name.trim()));

    const mergedStudents = [...rawStudents];
    initialStudents.forEach(st => {
      if ((st.code && existingCodes.has(st.code)) || existingNames.has(st.name.trim())) {
        const idx = mergedStudents.findIndex(s => (st.code && s.code === st.code) || s.name.trim() === st.name.trim());
        if (idx !== -1) {
          mergedStudents[idx] = {
            ...mergedStudents[idx],
            fatherName: mergedStudents[idx].fatherName || st.fatherName,
            code: mergedStudents[idx].code || st.code,
            className: 'هشتم ب'
          };
        }
      } else {
        mergedStudents.push(st);
      }
    });

    // Remove dummy records from attendance
    const attendance = (parsed.attendance || []).filter((a: AttendanceRecord) => !dummyNames.has(a.studentName.trim()));

    return {
      config: loadedConfig,
      students: mergedStudents.length > 0 ? mergedStudents : initialStudents,
      attendance: attendance,
      assignments: parsed.assignments || getInitialAssignments(),
      exams: parsed.exams && parsed.exams.length > 0 ? parsed.exams : getInitialExams(),
    };
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return {
      config: getInitialConfig(),
      students: getInitialStudents(),
      attendance: getInitialAttendance(),
      assignments: getInitialAssignments(),
      exams: getInitialExams(),
    };
  }
}

export function saveLocalState(state: FullAppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
}

/**
 * خروجی کل اطلاعات سیستم به فرمت JSON جهت پشتیبان‌گیری مطمئن
 */
export function exportBackupJSON(state: FullAppState): void {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  a.download = `School_Backup_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * خروجی اکسل سوابق حضور و غیاب با انکودینگ UTF-8 و کاراکتر BOM برای باز شدن صحیح در اکسل فارسی
 */
export function exportAttendanceToCSV(records: AttendanceRecord[]): void {
  if (records.length === 0) {
    alert('رکوردی برای صدور فایل اکسل موجود نیست.');
    return;
  }

  const headers = ['ردیف', 'نام دانش‌آموز', 'کلاس', 'درس', 'تاریخ شمسی', 'ساعت ثبت', 'یادداشت دبیر'];
  const rows: string[][] = [headers];

  records.forEach((r, idx) => {
    rows.push([
      (idx + 1).toString(),
      r.studentName,
      r.className,
      r.subject,
      r.shamsiDate,
      r.timeString,
      r.notes || '-',
    ]);
  });

  const csvContent =
    '\uFEFF' +
    rows.map((r) => r.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  a.download = `حضور_و_غیاب_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * خروجی اکسل نمرات و تکالیف
 */
export function exportGradesToCSV(assignment: Assignment, students: StudentProfile[]): void {
  const headers = ['ردیف', 'نام دانش‌آموز', 'کلاس', 'عنوان تکلیف', 'نمره', 'نشان', 'نظر دبیر'];
  const rows: string[][] = [headers];

  const targetStudents = students.filter(
    (s) => assignment.className === 'همه کلاس‌ها' || s.className === assignment.className
  );

  targetStudents.forEach((st, idx) => {
    const g = (st.id && assignment.grades[st.id]) || assignment.grades[st.name] || Object.values(assignment.grades || {}).find(item => (st.id && item.studentId === st.id) || item.studentName === st.name);
    rows.push([
      (idx + 1).toString(),
      st.name,
      st.className,
      assignment.title,
      g?.score || 'ثبت نشده',
      g?.badge ? (g.badge === 'positive' ? '+ مثبت' : g.badge === 'star' ? 'ستاره' : '- منفی') : '-',
      g?.note || '-',
    ]);
  });

  const csvContent =
    '\uFEFF' +
    rows.map((r) => r.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `نمرات_${assignment.title.replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
