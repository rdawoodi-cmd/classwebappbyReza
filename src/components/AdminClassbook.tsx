import React, { useState } from 'react';
import { 
  StudentProfile, 
  AttendanceRecord, 
  Assignment, 
  Exam,
  GradeEntry,
  ExamSubmission
} from '../types';
import { toPersianDigits, toEnglishDigits } from '../utils/persianDate';
import { FileSpreadsheet, Calculator, Settings, CheckCircle2, UserCheck, Calendar } from 'lucide-react';

interface AdminClassbookProps {
  students: StudentProfile[];
  attendance: AttendanceRecord[];
  assignments: Assignment[];
  exams: Exam[];
  classes: string[];
  activeSubject: string;
  activeTerm?: string;
}

export const AdminClassbook: React.FC<AdminClassbookProps> = ({
  students,
  attendance,
  assignments,
  exams,
  classes,
  activeSubject,
  activeTerm = 'ترم اول',
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(classes[0] || 'هشتم ب');

  React.useEffect(() => {
    if (classes.length > 0 && !classes.includes(selectedClass)) {
      setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  // Qualitative grade conversion mapping (default standards)
  const [qualitativeMapping, setQualitativeMapping] = useState<Record<string, number>>({
    'a': 20,
    'b': 17,
    'c': 14,
    'd': 10,
    'عالی': 20,
    'بسیار خوب': 18,
    'خوب': 16,
    'متوسط': 13,
    'نیاز به تلاش': 10,
    'ضعیف': 8,
  });

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempMapping, setTempMapping] = useState<Record<string, number>>(qualitativeMapping);

  // Filter students for selected class
  const classStudents = students.filter((s) => s.className === selectedClass).sort((a, b) => {
    const la = a.lastName || a.name;
    const lb = b.lastName || b.name;
    return la.localeCompare(lb, 'fa');
  });

  // Gather all unique dates and their corresponding activities (attendance / assignments / exams) for this class & subject
  const dateMap = new Map<string, {
    date: string;
    attendanceCount: number;
    activities: { title: string; type: 'assignment' | 'exam' | 'attendance'; id: string }[];
  }>();

  // 1. Attendance dates
  attendance
    .filter((r) => r.className === selectedClass && (activeSubject === 'all' || r.subject === activeSubject))
    .forEach((att) => {
      if (!dateMap.has(att.shamsiDate)) {
        dateMap.set(att.shamsiDate, { date: att.shamsiDate, attendanceCount: 0, activities: [] });
      }
      const entry = dateMap.get(att.shamsiDate)!;
      entry.attendanceCount++;
    });

  // 2. Assignment dates
  assignments
    .filter((a) => (a.className === 'همه کلاس‌ها' || a.className === selectedClass) && (activeSubject === 'all' || a.subject === activeSubject))
    .forEach((ass) => {
      const d = ass.shamsiDate || 'متفرقه';
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, attendanceCount: 0, activities: [] });
      }
      dateMap.get(d)!.activities.push({ title: ass.title, type: 'assignment', id: ass.id });
    });

  // 3. Exam dates
  exams
    .filter((e) => (e.className === 'همه کلاس‌ها' || e.className === selectedClass) && (activeSubject === 'all' || e.subject === activeSubject))
    .forEach((ex) => {
      const d = ex.shamsiDate || 'متفرقه';
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, attendanceCount: 0, activities: [] });
      }
      dateMap.get(d)!.activities.push({ title: ex.title, type: 'exam', id: ex.id });
    });

  const sortedDates = Array.from(dateMap.keys()).sort((a, b) => a.localeCompare(b));

  // Helper to parse grade score to number
  const parseScoreToNumber = (scoreStr: string | undefined): number | null => {
    if (!scoreStr) return null;
    const clean = toEnglishDigits(scoreStr.trim());
    const num = parseFloat(clean);
    if (!isNaN(num)) return num;

    const lower = scoreStr.trim().toLowerCase();
    if (qualitativeMapping[lower] !== undefined) return qualitativeMapping[lower];
    if (qualitativeMapping[scoreStr.trim()] !== undefined) return qualitativeMapping[scoreStr.trim()];

    return null;
  };

  // Calculate year average for a student
  const calculateStudentAverage = (student: StudentProfile): { avg: number | null; count: number } => {
    let total = 0;
    let count = 0;

    assignments
      .filter((a) => (a.className === 'همه کلاس‌ها' || a.className === selectedClass) && (activeSubject === 'all' || a.subject === activeSubject))
      .forEach((ass) => {
        const gradeEntry = (student.id && ass.grades[student.id]) || ass.grades[student.name] || (Object.values(ass.grades || {}) as GradeEntry[]).find(g => (student.id && g.studentId === student.id) || g.studentName === student.name);
        if (gradeEntry && gradeEntry.score) {
          const val = parseScoreToNumber(gradeEntry.score);
          if (val !== null) {
            total += val;
            count++;
          }
        }
      });

    exams
      .filter((e) => (e.className === 'همه کلاس‌ها' || e.className === selectedClass) && (activeSubject === 'all' || e.subject === activeSubject))
      .forEach((ex) => {
        const sub = (student.id && ex.submissions[student.id]) || ex.submissions[student.name] || (Object.values(ex.submissions || {}) as ExamSubmission[]).find(s => (student.id && s.studentId === student.id) || s.studentName === student.name);
        if (sub) {
          const scoreText = sub.calculatedScore20 !== undefined ? String(sub.calculatedScore20) : sub.teacherScore;
          const val = parseScoreToNumber(scoreText);
          if (val !== null) {
            total += val;
            count++;
          }
        }
      });

    if (count === 0) return { avg: null, count: 0 };
    return { avg: Number((total / count).toFixed(2)), count };
  };

  const handleSaveMapping = (e: React.FormEvent) => {
    e.preventDefault();
    setQualitativeMapping(tempMapping);
    setShowConfigModal(false);
  };

  return (
    <div className="space-y-4">
      {/* سربرگ و ابزار انتخاب کلاس */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-800">دفتر کلاسی و کارنامه تجمیعی</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {activeTerm}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              نمایش جامع وضعیت حضور و غیاب، نمرات تکالیف، آزمون‌ها و میانگین {activeTerm} دانش‌آموزان
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-slate-500 font-bold">انتخاب کلاس:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-sky-700 cursor-pointer focus:outline-none"
            >
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  کلاس {cls}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setTempMapping(qualitativeMapping);
              setShowConfigModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            title="تبدیل نمرات کیفی به عددی برای محاسبه میانگین"
          >
            <Settings className="w-4 h-4 text-sky-600" />
            <span>تنظیم نمرات کیفی</span>
          </button>
        </div>
      </div>

      {/* جدول دفتر کلاسی */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {classStudents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">هیچ دانش‌آموزی در کلاس «{selectedClass}» ثبت نشده است.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                  <th className="p-3.5 sticky right-0 bg-slate-50 z-10 border-l border-slate-200 min-w-[180px]">
                    نام دانش‌آموز
                  </th>
                  {sortedDates.length === 0 ? (
                    <th className="p-3.5 text-center text-slate-400 font-normal">هیچ تاریخ یا رویدادی ثبت نشده است</th>
                  ) : (
                    sortedDates.map((dateStr) => {
                      const info = dateMap.get(dateStr)!;
                      return (
                        <th key={dateStr} className="p-3 border-l border-slate-200 min-w-[150px] align-top">
                          <div className="flex items-center gap-1 text-sky-800 font-bold mb-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{toPersianDigits(dateStr)}</span>
                          </div>
                          <div className="space-y-1 text-[10px] font-normal text-slate-500">
                            {info.attendanceCount > 0 && (
                              <div className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                                حضور و غیاب ثبت‌شده
                              </div>
                            )}
                            {info.activities.map((act, i) => (
                              <div key={i} className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200 truncate" title={act.title}>
                                {act.type === 'assignment' ? '📌 تکلیف: ' : '📝 آزمون: '}
                                {act.title}
                              </div>
                            ))}
                          </div>
                        </th>
                      );
                    })
                  )}
                  <th className="p-3.5 bg-sky-50 text-sky-900 border-r border-sky-200 text-center min-w-[120px]">
                    میانگین کل سال
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((st, idx) => {
                  const studentAttendance = attendance.filter(
                    (r) => (r.studentId && r.studentId === st.id) || (r.studentName.trim() === st.name.trim() && r.className === selectedClass)
                  );
                  const { avg, count } = calculateStudentAverage(st);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 sticky right-0 bg-white z-10 border-l border-slate-200 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px]">
                            {toPersianDigits(idx + 1)}
                          </span>
                          <span className="truncate">{st.name}</span>
                        </div>
                      </td>

                      {sortedDates.map((dateStr) => {
                        const attRec = studentAttendance.find((r) => r.shamsiDate === dateStr);
                        const dayActs = dateMap.get(dateStr)?.activities || [];

                        return (
                          <td key={dateStr} className="p-3 border-l border-slate-200 align-top text-[11px]">
                            <div className="space-y-1.5">
                              {attRec ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[10px]">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>حاضر ({attRec.timeString})</span>
                                </span>
                              ) : (
                                <span className="text-slate-300 text-[10px]">-</span>
                              )}

                              {dayActs.map((act, i) => {
                                let scoreText = '';
                                let noteText = '';
                                if (act.type === 'assignment') {
                                  const ass = assignments.find((a) => a.id === act.id);
                                  const g = ass ? ((st.id && ass.grades[st.id]) || ass.grades[st.name] || (Object.values(ass.grades || {}) as GradeEntry[]).find(item => (st.id && item.studentId === st.id) || item.studentName === st.name)) : undefined;
                                  if (g) {
                                    scoreText = g.score;
                                    noteText = g.note || '';
                                  }
                                } else {
                                  const ex = exams.find((e) => e.id === act.id);
                                  const sub = ex ? ((st.id && ex.submissions[st.id]) || ex.submissions[st.name] || (Object.values(ex.submissions || {}) as ExamSubmission[]).find(item => (st.id && item.studentId === st.id) || item.studentName === st.name)) : undefined;
                                  if (sub) {
                                    scoreText = sub.calculatedScore20 !== undefined ? `${sub.calculatedScore20} از ۲۰` : (sub.teacherScore || '');
                                    noteText = sub.teacherFeedback || '';
                                  }
                                }

                                return scoreText ? (
                                  <div key={i} className="bg-sky-50/80 border border-sky-200 p-1.5 rounded-lg space-y-0.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] text-sky-900 font-extrabold truncate max-w-[100px]" title={act.title}>
                                        {act.title}
                                      </span>
                                      <span className="font-mono font-extrabold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[10px]">
                                        {scoreText}
                                      </span>
                                    </div>
                                    {noteText && <p className="text-[10px] text-slate-500 truncate">{noteText}</p>}
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </td>
                        );
                      })}

                      <td className="p-3.5 bg-sky-50/50 border-r border-sky-200 text-center font-mono font-black text-slate-900">
                        {avg !== null ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-sm text-sky-800 bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-300">
                              {toPersianDigits(avg)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                              ({toPersianDigits(count)} نمره ثبت‌شده)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal text-xs">بدون نمره</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* مدال تنظیم تبدیل نمرات کیفی به عددی */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-sky-600" />
                <span>تعیین ارزش عددی نمرات کیفی برای میانگین</span>
              </h4>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              از آنجایی که برخی تکالیف یا آزمون‌ها دارای نمره توصیفی یا کیفی (مانند A, B, عالی، خوب و غیره) هستند، سیستم برای محاسبه میانگین کل سال از جدول زیر برای تبدیل آن‌ها به عدد (از ۲۰) استفاده می‌کند:
            </p>

            <form onSubmit={handleSaveMapping} className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {Object.entries(tempMapping).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 min-w-[90px] text-center">
                    {key}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">معادل عددی:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      value={val}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value) || 0;
                        setTempMapping({ ...tempMapping, [key]: n });
                      }}
                      className="w-20 text-xs font-mono font-bold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-center focus:outline-sky-600"
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  ذخیره و بروزرسانی میانگین‌ها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
