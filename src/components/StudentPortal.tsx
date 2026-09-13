import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  GraduationCap, 
  Book, 
  User, 
  Sparkles,
  ShieldCheck,
  LogOut,
  Calendar,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { AppConfig, StudentProfile, Assignment, Exam, ExamSubmission } from '../types';
import { toPersianDigits, getTodayShamsi } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { getDeviceId, detectEitaaUser, EitaaUserInfo, getSavedEitaaId } from '../utils/deviceIdentifier';
import { getClassSubjectEitaaLink } from '../utils/eitaaHelper';
import { StudentAssignmentsView } from './StudentAssignmentsView';

interface StudentPortalProps {
  config: AppConfig;
  students: StudentProfile[];
  assignments: Assignment[];
  exams?: Exam[];
  onSubmitAttendance: (
    name: string,
    className: string,
    subject: string,
    eitaaId?: string,
    deviceId?: string,
    studentId?: string
  ) => { success: boolean; message: string; date: string; time: string };
  onSubmitExam?: (examId: string, submission: ExamSubmission) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  config,
  students,
  assignments,
  exams = [],
  onSubmitAttendance,
  onSubmitExam,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    return localStorage.getItem('last_selected_class') || config.classes[0] || '';
  });
  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    return localStorage.getItem('last_selected_subject') || config.subjects[0] || '';
  });
  const [studentId, setStudentId] = useState<string>(() => {
    return localStorage.getItem('last_student_id') || '';
  });
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('last_student_name') || '';
  });
  const [eitaaInfo, setEitaaInfo] = useState<EitaaUserInfo>(() => {
    return detectEitaaUser();
  });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const info = detectEitaaUser();
    setEitaaInfo(info);
    if (!studentName && info.fullName) {
      const found = students.find((s) => s.name.trim() === info.fullName?.trim());
      if (found) {
        setStudentId(found.id);
        setStudentName(found.name);
      } else {
        setStudentName(info.fullName);
      }
    }
  }, []);

  const today = getTodayShamsi();
  const classStudents = students
    .filter((s) => s.className === selectedClass)
    .sort((a, b) => {
      const lastNameComparison = (a.lastName || '').localeCompare(b.lastName || '', 'fa');
      if (lastNameComparison !== 0) return lastNameComparison;
      return (a.firstName || a.name).localeCompare(b.firstName || b.name, 'fa');
    });

  const handleClassChange = (newCls: string) => {
    setSelectedClass(newCls);
    setStudentId('');
    setStudentName('');
    localStorage.setItem('last_selected_class', newCls);
  };

  const handleSubjectChange = (newSub: string) => {
    setSelectedSubject(newSub);
    localStorage.setItem('last_selected_subject', newSub);
  };

  const handleStudentSelect = (id: string) => {
    setStudentId(id);
    const found = students.find((s) => s.id === id);
    if (found) {
      setStudentName(found.name);
    } else {
      setStudentName('');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = studentName.trim();
    if (!cleanName) {
      setErrorMsg('لطفاً نام خود را از لیست انتخاب کنید.');
      return;
    }

    setErrorMsg('');
    if (studentId) {
      localStorage.setItem('last_student_id', studentId);
    }
    localStorage.setItem('last_student_name', cleanName);
    const deviceId = getDeviceId();
    const finalEitaaId = eitaaInfo.displayId || getSavedEitaaId() || deviceId;

    // ثبت حضور در لحظه ورود
    const result = onSubmitAttendance(cleanName, selectedClass, selectedSubject, finalEitaaId, deviceId, studentId || undefined);

    if (result.success) {
      sounds.playCheer();
      setIsLoggedIn(true);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setStudentId('');
    setStudentName('');
    localStorage.removeItem('last_student_id');
    localStorage.removeItem('last_student_name');
  };

  if (isLoggedIn) {
    const eitaaLink = getClassSubjectEitaaLink(config, selectedClass, selectedSubject);
    return (
      <div className="space-y-6">
        {/* هدر پنل دانش‌آموز */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border border-blue-200">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">خوش آمدی، {studentName}</h2>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  {selectedClass}
                </span>
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  <Book className="w-3.5 h-3.5 text-blue-600" />
                  {selectedSubject}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {eitaaLink ? (
              <a
                href={eitaaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
                title={`بازگشت به گروه چت ایتا (درس ${selectedSubject})`}
              >
                <span>🔙 برگشت به گروه چت ایتا ({selectedSubject})</span>
              </a>
            ) : (
              <button
                onClick={() => {
                  try {
                    const w = window as any;
                    if (w.Eitaa?.WebApp?.close) {
                      w.Eitaa.WebApp.close();
                    } else if (w.Telegram?.WebApp?.close) {
                      w.Telegram.WebApp.close();
                    } else {
                      alert('حاضری شما با موفقیت ثبت شد. می‌توانید این پنجره را ببندید و به گروه چت ایتا بازگردید.');
                      handleLogout();
                    }
                  } catch {
                    handleLogout();
                  }
                }}
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
                title="بستن برنامک و بازگشت به گروه چت ایتا"
              >
                <span>🔙 برگشت به گروه چت ایتا</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-rose-200 bg-white px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              خروج از کلاس
            </button>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center justify-between gap-2 text-sm font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>حضور شما در کلاس {selectedClass} (درس {selectedSubject}) ثبت شد. برای بازگشت به گروه چت ایتا روی دکمه بالا کلیک کنید.</span>
          </div>
        </div>

        {/* پنل تکالیف و آزمون‌ها */}
        <StudentAssignmentsView
          config={config}
          students={students}
          assignments={assignments}
          exams={exams}
          onSubmitExam={onSubmitExam}
          studentId={studentId}
          studentName={studentName}
          selectedClass={selectedClass}
          selectedSubject={selectedSubject}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto relative space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-6 transform transition-all hover:shadow-2xl">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 sm:p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
            <Sparkles className="w-8 h-8 text-blue-50" />
          </div>
          <h2 className="text-lg font-extrabold text-white relative z-10">
            درگاه ورود دانش‌آموز
          </h2>
          <p className="text-xs text-blue-100 mt-1.5 opacity-90 font-medium relative z-10">
            لطفاً اطلاعات خود را انتخاب و وارد شوید.
          </p>
        </div>

        <div className="p-5 sm:p-6 text-left border-b border-slate-100 bg-slate-50/50 flex justify-center">
          <span className="text-xs font-bold text-blue-700 bg-white shadow-xs border border-blue-100 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {toPersianDigits(today.dateString)}
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-5">
            {/* انتخاب کلاس */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>کلاس خود را انتخاب کنید:</span>
              </label>
              <select
                required
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold px-3.5 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-blue-600 transition-all cursor-pointer"
              >
                <option value="">-- انتخاب کلاس --</option>
                {config.classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* انتخاب درس */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Book className="w-4 h-4 text-blue-600" />
                <span>درس مربوطه:</span>
              </label>
              <select
                required
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold px-3.5 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-blue-600 transition-all cursor-pointer"
              >
                <option value="">-- انتخاب درس --</option>
                {config.subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* نام و نام خانوادگی */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>نام خود را انتخاب کنید:</span>
                </label>
                {classStudents.length > 0 && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                    {toPersianDigits(classStudents.length)} دانش‌آموز
                  </span>
                )}
              </div>

              <select
                required
                value={studentId || (studentName ? classStudents.find(s => s.name === studentName)?.id || '' : '')}
                onChange={(e) => handleStudentSelect(e.target.value)}
                disabled={!selectedClass}
                className="w-full text-xs sm:text-sm font-bold px-3.5 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-blue-600 transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="">-- {selectedClass ? 'انتخاب نام از لیست' : 'ابتدا کلاس را انتخاب کنید'} --</option>
                {classStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} {st.code ? `(${toPersianDigits(st.code)})` : (st.fatherName ? `(فرزند ${st.fatherName})` : '')}
                  </option>
                ))}
              </select>
            </div>

            {/* مشخصات حساب کاربری ایتا */}
            <div className="pt-2">
              {eitaaInfo.isEitaaDetected ? (
                <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-4 text-emerald-950 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold">احراز هویت هوشمند برنامک</div>
                        <div className="text-[10px] font-medium opacity-80">تأیید شده خودکار</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold bg-white/60 px-3 py-2 rounded-xl text-center border border-emerald-200 flex justify-center gap-2">
                    <span dir="ltr" className="text-emerald-700">{eitaaInfo.displayId}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-slate-400" />
                  <p className="text-[10px] text-slate-500 font-medium">
                    در حال استفاده از مرورگر عادی. هویت به صورت ناشناس ثبت خواهد شد.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <CheckCircle2 className="w-5 h-5" />
              ثبت حضور و ورود به کلاس
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
