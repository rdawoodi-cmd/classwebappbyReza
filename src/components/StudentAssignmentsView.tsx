import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Download, 
  Calendar, 
  Award, 
  CheckCircle2, 
  FileText, 
  UserCheck, 
  AlertCircle,
  Star,
  PlusCircle,
  MinusCircle,
  FileQuestion,
  Smartphone
} from 'lucide-react';
import { Assignment, AppConfig, Exam, ExamSubmission, StudentProfile } from '../types';
import { toPersianDigits } from '../utils/persianDate';
import { getSavedEitaaId, saveEitaaId } from '../utils/deviceIdentifier';
import { StudentExamsView } from './StudentExamsView';

interface StudentAssignmentsViewProps {
  config: AppConfig;
  students: StudentProfile[];
  assignments: Assignment[];
  exams?: Exam[];
  onSubmitExam?: (examId: string, submission: ExamSubmission) => void;
  studentId?: string;
  studentName: string;
  selectedClass: string;
  selectedSubject: string;
}

export const StudentAssignmentsView: React.FC<StudentAssignmentsViewProps> = ({
  config,
  students,
  assignments,
  exams = [],
  onSubmitExam,
  studentId,
  studentName,
  selectedClass,
  selectedSubject,
}) => {
  const [viewMode, setViewMode] = useState<'assignments' | 'exams'>('assignments');
  const [filterSubject, setFilterSubject] = useState<string>(selectedSubject || 'all');

  useEffect(() => {
    if (selectedSubject) {
      setFilterSubject(selectedSubject);
    }
  }, [selectedSubject]);

  const filteredAssignments = assignments.filter((a) => {
    const classMatch = a.className === 'همه کلاس‌ها' || a.className === selectedClass;
    const subjectMatch = filterSubject === 'all' || a.subject === filterSubject;
    return classMatch && subjectMatch;
  });

  const activeExamsCount = exams.filter(
    (e) => e.isActive && 
      (e.className === 'همه کلاس‌ها' || e.className === selectedClass) &&
      (filterSubject === 'all' || e.subject === filterSubject)
  ).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        {/* سوییچر بین تکالیف و آزمون‌ها */}
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
          <button
            type="button"
            onClick={() => setViewMode('assignments')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'assignments'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>تکالیف و کارنامه ({toPersianDigits(filteredAssignments.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('exams')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
              viewMode === 'exams'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            <span>آزمون‌های آنلاین کلاسی</span>
            {activeExamsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-black">
                {toPersianDigits(activeExamsCount)}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
          <span className="text-xs text-slate-400 whitespace-nowrap pl-1">فیلتر درس:</span>
          <button
            onClick={() => setFilterSubject('all')}
            className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              filterSubject === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            همه دروس
          </button>
          {config.subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setFilterSubject(sub)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterSubject === sub
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'exams' ? (
        <StudentExamsView
          config={config}
          students={students}
          exams={exams}
          selectedClass={selectedClass}
          selectedSubject={selectedSubject}
          filterSubject={filterSubject}
          onFilterSubjectChange={setFilterSubject}
          studentId={studentId}
          studentName={studentName}
          onSubmitExam={onSubmitExam || (() => {})}
        />
      ) : (
        /* لیست تکالیف */
        <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-700">
              {filterSubject !== 'all' 
                ? `تکلیفی برای درس «${filterSubject}» در این کلاس ثبت نشده است.` 
                : 'تکلیفی برای این کلاس ثبت نشده است.'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              به محض ثبت تمرین جدید توسط دبیر، در این بخش نمایش داده خواهد شد.
            </p>
          </div>
        ) : (
          filteredAssignments.map((item) => {
            const cleanName = studentName.trim();
            const targetStudent = students.find((s) => (studentId && s.id === studentId) || s.name.trim() === cleanName);
            const studentGrade = (targetStudent && item.grades ? (item.grades[targetStudent.id] || item.grades[targetStudent.name]) : null) || (cleanName && item.grades ? item.grades[cleanName] : null);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3.5 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {item.title}
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {item.subject}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {item.className}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>تاریخ انتشار: {toPersianDigits(item.shamsiDate)}</span>
                    </p>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {item.description}
                  </p>
                )}

                {/* فایل پیوست */}
                {item.fileName && item.fileData && (
                  <div>
                    <a
                      href={item.fileData}
                      download={item.fileName}
                      className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>دانلود فایل پیوست: {item.fileName}</span>
                      {item.fileSize && <span className="text-[10px] text-blue-500 font-normal">({item.fileSize})</span>}
                    </a>
                  </div>
                )}

                {/* بخش نمایش نمره دانش‌آموز */}
                {item.gradesPublished ? (
                  studentGrade ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-emerald-900">
                            نمره ارزشیابی شما ({cleanName}):
                          </span>
                          <span className="text-sm font-black px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white">
                            {toPersianDigits(studentGrade.score)}
                          </span>

                          {studentGrade.badge === 'positive' && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md">
                              <PlusCircle className="w-3.5 h-3.5" /> مثبت
                            </span>
                          )}
                          {studentGrade.badge === 'star' && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> ستاره طلایی
                            </span>
                          )}
                          {studentGrade.badge === 'negative' && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 bg-rose-200 text-rose-900 rounded-md">
                              <MinusCircle className="w-3.5 h-3.5" /> منفی
                            </span>
                          )}
                        </div>

                        {studentGrade.note && (
                          <p className="text-xs text-emerald-800 mt-2 pr-7">
                            <span className="font-semibold">نظر دبیر: </span>
                            {studentGrade.note}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-medium whitespace-nowrap">
                        ارزشیابی نهایی دبیر
                      </span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          {cleanName
                            ? `هنوز نمره‌ای برای «${cleanName}» در این تکلیف ثبت نشده است.`
                            : 'نمرات این تکلیف توسط دبیر منتشر شده است. نام خود را در بالای صفحه وارد کنید.'}
                        </span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-500 text-[11px] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>نمرات این تکلیف هنوز از سوی دبیر منتشر نشده است.</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      )}
    </div>
  );
};
