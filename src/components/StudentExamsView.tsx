import React, { useState, useEffect, useRef } from 'react';
import { 
  FileQuestion, 
  Clock, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  X, 
  Award, 
  Download, 
  Eye, 
  Sparkles,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Calendar,
  Lock,
  MessageSquare
} from 'lucide-react';
import { Exam, QuizQuestion, ExamSubmission, AppConfig, StudentProfile } from '../types';
import { toPersianDigits, getTodayShamsi } from '../utils/persianDate';
import { getDeviceId, getSavedEitaaId } from '../utils/deviceIdentifier';
import confetti from 'canvas-confetti';

interface StudentExamsViewProps {
  config: AppConfig;
  students?: StudentProfile[];
  exams: Exam[];
  selectedClass: string;
  selectedSubject?: string;
  filterSubject?: string;
  onFilterSubjectChange?: (sub: string) => void;
  studentId?: string;
  studentName: string;
  onSubmitExam: (examId: string, submission: ExamSubmission) => void;
}

export const calculateScore20 = (correctCount: number, totalQuestions: number): number => {
  if (!totalQuestions || totalQuestions <= 0) return 0;
  // اگر عدد اعشاری شود، طبق درخواست کاربر گرد به بالا می‌شود
  return Math.ceil((correctCount / totalQuestions) * 20);
};

export const getDisplayScore20 = (submission: ExamSubmission, totalQuestions?: number): number => {
  if (submission.calculatedScore20 !== undefined) {
    return submission.calculatedScore20;
  }
  if (submission.correctCount !== undefined && totalQuestions && totalQuestions > 0) {
    return calculateScore20(submission.correctCount, totalQuestions);
  }
  if (submission.scorePercent !== undefined) {
    return Math.ceil((submission.scorePercent / 100) * 20);
  }
  return 0;
};

export const getScheduleStatus = (ex: Exam) => {
  if (!ex.hasSchedule) return { canStart: true, message: '', badge: '' };

  const today = getTodayShamsi();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (ex.scheduledDate && ex.scheduledDate.trim() && ex.scheduledDate !== today.dateString) {
    return {
      canStart: false,
      status: 'date_mismatch',
      badge: `تاریخ برگزاری: ${toPersianDigits(ex.scheduledDate)}`,
      message: `این آزمون برای تاریخ ${toPersianDigits(ex.scheduledDate)} برنامه‌ریزی شده است.`
    };
  }

  if (ex.startTime && ex.startTime.trim()) {
    const [sH, sM] = ex.startTime.split(':').map(Number);
    if (!isNaN(sH) && !isNaN(sM)) {
      const startTotalMin = sH * 60 + sM;
      if (currentMinutes < startTotalMin) {
        return {
          canStart: false,
          status: 'not_started',
          badge: `شروع ورود: از ساعت ${toPersianDigits(ex.startTime)}`,
          message: `مهلت ورود به این آزمون از ساعت ${toPersianDigits(ex.startTime)} آغاز می‌شود.`
        };
      }
    }
  }

  if (ex.endTime && ex.endTime.trim()) {
    const [eH, eM] = ex.endTime.split(':').map(Number);
    if (!isNaN(eH) && !isNaN(eM)) {
      const endTotalMin = eH * 60 + eM;
      if (currentMinutes > endTotalMin) {
        return {
          canStart: false,
          status: 'ended',
          badge: `مهلت ورود پایان یافته (${toPersianDigits(ex.endTime)})`,
          message: `مهلت ورود به این آزمون در ساعت ${toPersianDigits(ex.endTime)} به پایان رسیده است.`
        };
      }
    }
  }

  return {
    canStart: true,
    status: 'open',
    badge: ex.endTime ? `مهلت ورود تا ساعت ${toPersianDigits(ex.endTime)}` : 'فعال برای ورود',
    message: ''
  };
};

export const getStudentSubmission = (
  exam?: Exam,
  sId?: string,
  sName?: string,
  sList?: StudentProfile[]
): ExamSubmission | undefined => {
  if (!exam || !exam.submissions) return undefined;
  const cleanName = sName ? sName.trim() : '';
  const targetStudent = (sList || []).find((s) => (sId && s.id === sId) || (cleanName && s.name.trim() === cleanName));
  const targetId = targetStudent?.id || sId;
  
  if (targetId && exam.submissions[targetId]) {
    return exam.submissions[targetId];
  }
  if (cleanName && exam.submissions[cleanName]) {
    return exam.submissions[cleanName];
  }
  return Object.values(exam.submissions).find(
    (sub) => (targetId && sub.studentId === targetId) || (cleanName && sub.studentName.trim() === cleanName)
  );
};

export const StudentExamsView: React.FC<StudentExamsViewProps> = ({
  config,
  students,
  exams,
  selectedClass,
  selectedSubject,
  filterSubject: propFilterSubject,
  onFilterSubjectChange,
  studentId,
  studentName,
  onSubmitExam,
}) => {
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [internalFilterSubject, setInternalFilterSubject] = useState<string>(
    propFilterSubject || selectedSubject || 'all'
  );

  useEffect(() => {
    if (propFilterSubject !== undefined) {
      setInternalFilterSubject(propFilterSubject);
    } else if (selectedSubject) {
      setInternalFilterSubject(selectedSubject);
    }
    // تغییر درس بلافاصله آزمون باز شده قبلی را می‌بندد تا کارت روی نتیجه درس قبلی نماند
    setActiveExamId(null);
    setTimerRunning(false);
    setSelectedAnswers({});
    setTestResult(null);
    setPhotoData(null);
  }, [propFilterSubject, selectedSubject]);

  const currentFilterSubject = propFilterSubject !== undefined ? propFilterSubject : internalFilterSubject;
  
  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // Photo submission state for descriptive exam
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Multiple-choice answers state: questionId -> selectedOptionIndex (0, 1, 2, 3)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [testResult, setTestResult] = useState<{
    score20: number;
    scorePercent: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
  } | null>(null);

  const [questionZoomUrl, setQuestionZoomUrl] = useState<string | null>(null);

  // Filter exams for student's class and subject
  const classExams = exams.filter(
    (e) => e.isActive && 
      (e.className === 'همه کلاس‌ها' || e.className === selectedClass) &&
      (currentFilterSubject === 'all' || e.subject === currentFilterSubject)
  );

  const activeExam = exams.find((e) => e.id === activeExamId);
  const existingSubmission = getStudentSubmission(activeExam, studentId, studentName, students);

  // Start exam and timer (or review submitted exam)
  const handleStartExam = (exam: Exam) => {
    const existing = getStudentSubmission(exam, studentId, studentName, students);

    if (!existing) {
      const schedule = getScheduleStatus(exam);
      if (!schedule.canStart) {
        alert(schedule.message || 'ورود به این آزمون در حال حاضر مقدور نیست.');
        return;
      }
    }

    setActiveExamId(exam.id);
    setSelectedAnswers({});
    setTestResult(null);
    setPhotoData(null);
    setPhotoName(null);

    if (existing) {
      if (existing.selectedOptions) {
        setSelectedAnswers(existing.selectedOptions);
      }
      const totalQ = exam.questions?.length || 1;
      const s20 = getDisplayScore20(existing, totalQ);

      setTestResult({
        score20: s20,
        scorePercent: existing.scorePercent ?? Math.round((s20 / 20) * 100),
        correctCount: existing.correctCount || 0,
        wrongCount: existing.wrongCount || 0,
        unansweredCount: existing.unansweredCount || 0,
      });

      if (existing.photoAnswer) {
        setPhotoData(existing.photoAnswer);
        setPhotoName(existing.photoAnswerName || 'پاسخنامه.jpg');
      }
      setTimerRunning(false);
      setSecondsRemaining(0);
    } else {
      const initialSeconds = exam.durationMinutes * 60;
      setSecondsRemaining(initialSeconds);
      setTimerRunning(true);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!timerRunning || secondsRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerRunning(false);
          alert('زمان آزمون به پایان رسید! لطفاً پاسخنامه خود را ارسال کنید.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, secondsRemaining]);

  // Handle Photo Upload from mobile camera or file
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('حجم عکس ارسالی نباید بیشتر از ۴ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoData(reader.result as string);
      setPhotoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Submit Descriptive Exam
  const handleSubmitDescriptive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam) return;

    if (!studentName.trim()) {
      alert('لطفاً ابتدا نام و نام خانوادگی خود را در بالای صفحه وارد نمایید.');
      return;
    }

    if (!photoData) {
      alert('لطفاً ابتدا عکس برگه پاسخنامه خود را بارگذاری نمایید.');
      return;
    }

    setIsSubmitting(true);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = getTodayShamsi();
    const savedEitaa = getSavedEitaaId();
    const deviceId = getDeviceId();

    const targetStudent = (students || []).find((s) => (studentId && s.id === studentId) || (studentName.trim() && s.name.trim() === studentName.trim()));

    const submission: ExamSubmission = {
      id: `sub-${Date.now()}`,
      examId: activeExam.id,
      studentId: studentId || targetStudent?.id,
      studentName: studentName.trim(),
      className: selectedClass,
      submittedAt: `${today.dateString} - ساعت ${timeStr}`,
      photoAnswer: photoData,
      photoAnswerName: photoName || 'پاسخنامه.jpg',
      eitaaId: savedEitaa || undefined,
      deviceId: deviceId || undefined,
    };

    onSubmitExam(activeExam.id, submission);
    setIsSubmitting(false);
    setTimerRunning(false);

    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch (err) {}
  };

  // Submit Multiple Choice Exam
  const handleSubmitMultipleChoice = () => {
    if (!activeExam || !activeExam.questions) return;

    if (!studentName.trim()) {
      alert('لطفاً ابتدا نام و نام خانوادگی خود را در بالای صفحه وارد نمایید.');
      return;
    }

    const questions = activeExam.questions;
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    questions.forEach((q) => {
      const chosen = selectedAnswers[q.id];
      if (chosen === undefined) {
        unanswered++;
      } else if (chosen === q.correctOptionIndex) {
        correct++;
      } else {
        wrong++;
      }
    });

    const percent = Math.round((correct / questions.length) * 100);
    const score20 = calculateScore20(correct, questions.length);

    const resultObj = {
      score20: score20,
      scorePercent: percent,
      correctCount: correct,
      wrongCount: wrong,
      unansweredCount: unanswered,
    };
    setTestResult(resultObj);
    setTimerRunning(false);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = getTodayShamsi();
    const savedEitaa = getSavedEitaaId();
    const deviceId = getDeviceId();
    const targetStudent = (students || []).find((s) => (studentId && s.id === studentId) || (studentName.trim() && s.name.trim() === studentName.trim()));

    const submission: ExamSubmission = {
      id: `sub-${Date.now()}`,
      examId: activeExam.id,
      studentId: studentId || targetStudent?.id,
      studentName: studentName.trim(),
      className: selectedClass,
      submittedAt: `${today.dateString} - ساعت ${timeStr}`,
      selectedOptions: selectedAnswers,
      scorePercent: percent,
      calculatedScore20: score20,
      correctCount: correct,
      wrongCount: wrong,
      unansweredCount: unanswered,
      eitaaId: savedEitaa || undefined,
      deviceId: deviceId || undefined,
    };

    onSubmitExam(activeExam.id, submission);

    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch (err) {}
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* If an exam is currently being taken */}
      {activeExam ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden animate-in fade-in duration-200">
          {/* Exam Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white">
                  {activeExam.type === 'descriptive' ? 'آزمون تشریحی' : 'آزمون تستی چهارگزینه‌ای'}
                </span>
                <span className="text-xs text-blue-100">درس: {activeExam.subject}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black">{activeExam.title}</h3>
              <p className="text-xs text-blue-100">
                دانش‌آموز: <span className="font-bold text-white">{studentName || '(نام وارد نشده)'}</span> • کلاس: {selectedClass}
              </p>
            </div>

            {/* Countdown Timer Widget */}
            <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 shadow-sm ${
              secondsRemaining < 180 && timerRunning
                ? 'bg-rose-500 text-white border-rose-300 animate-pulse'
                : 'bg-white text-slate-900 border-white'
            }`}>
              <Clock className="w-5 h-5 text-blue-600" />
              <div className="text-center">
                <span className="text-[10px] font-bold block uppercase tracking-wider text-slate-500">
                  زمان باقیمانده:
                </span>
                <span className="text-xl font-mono font-black tracking-widest">
                  {toPersianDigits(formatTimer(secondsRemaining))}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Exam Description / Guide */}
            {activeExam.description && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 leading-relaxed">
                <strong className="block font-bold mb-1">راهنمای آزمون:</strong>
                {activeExam.description}
              </div>
            )}

            {/* If Student has already submitted */}
            {existingSubmission && !testResult && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>پاسخنامه شما قبلاً با موفقیت ثبت شده است</span>
                </div>
                <p className="text-xs text-emerald-800">
                  زمان ثبت: {toPersianDigits(existingSubmission.submittedAt)}
                </p>

                {existingSubmission.photoAnswer && (
                  <div className="pt-2">
                    <span className="text-xs font-bold block mb-1">تصویر برگه ارسالی شما:</span>
                    <img
                      src={existingSubmission.photoAnswer}
                      alt="پاسخنامه ارسالی"
                      className="max-h-48 rounded-xl border border-emerald-200 object-cover"
                    />
                  </div>
                )}

                {existingSubmission.teacherScore && (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 text-xs mt-2 space-y-1">
                    <p className="font-extrabold text-emerald-900">
                      نمره ثبت‌شده توسط دبیر: {toPersianDigits(existingSubmission.teacherScore)}
                    </p>
                    {existingSubmission.teacherFeedback && (
                      <p className="text-slate-600">بازخورد دبیر: {existingSubmission.teacherFeedback}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* CASE 1: DESCRIPTIVE EXAM (WITH PHOTO UPLOAD) */}
            {activeExam.type === 'descriptive' && (
              <div className="space-y-6">
                {/* Teacher's Question Sheet */}
                {activeExam.fileData && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-800">برگه سوالات آزمون دبیر:</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuestionZoomUrl(activeExam.fileData!)}
                        className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>مشاهده تصویر بزرگ / تمام‌صفحه</span>
                      </button>
                    </div>

                    <div className="flex justify-center bg-white p-2 rounded-xl border border-slate-200">
                      <img
                        src={activeExam.fileData}
                        alt="برگه سوالات امتحانی"
                        className="max-h-72 w-auto object-contain rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => setQuestionZoomUrl(activeExam.fileData!)}
                      />
                    </div>
                  </div>
                )}

                {/* Answer Upload Section */}
                <form onSubmit={handleSubmitDescriptive} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800">
                        ارسال تصویر پاسخنامه دست‌نویس شما:
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        پاسخ سوالات را روی کاغذ نوشته و با دوربین گوشی یا فایل عکس، آن را آپلود کنید.
                      </p>
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-white file:mr-0 file:ml-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                  </div>

                  {photoData && (
                    <div className="p-3 bg-white border border-emerald-300 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img src={photoData} alt="پیش‌نمایش پاسخنامه" className="w-12 h-12 object-cover rounded-lg border" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">✓ عکس پاسخنامه آماده ارسال است</p>
                          <p className="text-[10px] text-slate-400">{photoName}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoData(null);
                          setPhotoName(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                      >
                        حذف و انتخاب مجدد
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !photoData}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'در حال ارسال پاسخنامه...' : 'ثبت و ارسال نهایی پاسخنامه تشریحی'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* CASE 2: MULTIPLE-CHOICE EXAM (WITH AUTO-GRADING) */}
            {activeExam.type === 'multiple-choice' && (
              <div className="space-y-6">
                {/* Live Test Result Card */}
                {testResult ? (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 rounded-3xl p-6 text-center space-y-4 shadow-sm animate-in zoom-in-95">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                      <Award className="w-8 h-8" />
                    </div>

                    <div>
                      <span className="text-xs font-bold text-emerald-700 block uppercase tracking-wider">
                        نتیجه و کارنامه آزمون تستی شما
                      </span>
                      <h4 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
                        نمره شما: <span className="text-emerald-700 font-mono font-black">{toPersianDigits(testResult.score20)}</span> از ۲۰
                      </h4>
                      <p className="text-xs text-emerald-800 mt-1 font-mono">
                        (درصد: {toPersianDigits(testResult.scorePercent)}٪)
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto pt-2">
                      <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-slate-500 block">پاسخ درست</span>
                        <span className="text-base font-bold text-emerald-600">
                          {toPersianDigits(testResult.correctCount)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-rose-200">
                        <span className="text-[10px] text-slate-500 block">پاسخ نادرست</span>
                        <span className="text-base font-bold text-rose-600">
                          {toPersianDigits(testResult.wrongCount)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">پاسخ نداده</span>
                        <span className="text-base font-bold text-slate-600">
                          {toPersianDigits(testResult.unansweredCount)}
                        </span>
                      </div>
                    </div>

                    {existingSubmission?.teacherFeedback && (
                      <div className="max-w-md mx-auto p-3 bg-white border border-emerald-300 rounded-xl text-xs text-right space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <span>نظر و بازخورد اختصاصی دبیر:</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed pr-5">
                          {existingSubmission.teacherFeedback}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Questions List */}
                <div className="space-y-4">
                  {activeExam.questions?.map((q, qIdx) => {
                    const chosen = selectedAnswers[q.id];
                    const isGraded = !!testResult;

                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isGraded
                            ? chosen === q.correctOptionIndex
                              ? 'bg-emerald-50/50 border-emerald-300'
                              : 'bg-rose-50/50 border-rose-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug">
                            {toPersianDigits(qIdx + 1)}. {q.questionText}
                          </h4>

                          {isGraded && (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                              chosen === q.correctOptionIndex
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                            }`}>
                              {chosen === q.correctOptionIndex ? '✓ درست' : '✗ نادرست'}
                            </span>
                          )}
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = chosen === oIdx;
                            const isCorrectAnswer = oIdx === q.correctOptionIndex;

                            let btnStyle = 'bg-white border-slate-200 hover:border-slate-300 text-slate-800';
                            if (isGraded) {
                              if (isCorrectAnswer) {
                                btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold';
                              } else if (isSelected && !isCorrectAnswer) {
                                btnStyle = 'bg-rose-100 border-rose-400 text-rose-950 line-through';
                              }
                            } else if (isSelected) {
                              btnStyle = 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold';
                            }

                            return (
                              <button
                                key={oIdx}
                                type="button"
                                disabled={isGraded}
                                onClick={() => {
                                  setSelectedAnswers({
                                    ...selectedAnswers,
                                    [q.id]: oIdx,
                                  });
                                }}
                                className={`p-3 rounded-xl border text-right text-xs transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                              >
                                <span className="leading-snug">
                                  <span className="font-bold ml-1.5">{toPersianDigits(oIdx + 1)})</span>
                                  {opt}
                                </span>
                                {isSelected && <Check className="w-4 h-4 shrink-0" />}
                                {isGraded && isCorrectAnswer && !isSelected && (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-1.5 py-0.5 rounded">
                                    پاسخ صحیح
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {isGraded && q.explanation && (
                          <p className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-200 mt-2.5 leading-relaxed">
                            💡 <strong>توضیح پاسخ:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Final Submit Button for Multiple Choice */}
                {!testResult && (
                  <button
                    type="button"
                    onClick={handleSubmitMultipleChoice}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>پایان آزمون و تصحیح خودکار کارنامه</span>
                  </button>
                )}
              </div>
            )}

            {/* Back Button */}
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveExamId(null);
                  setTimerRunning(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>بازگشت به لیست آزمون‌ها</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* List of Available Exams */
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-blue-600" />
              <span>
                آزمون‌های آنلاین فعال {currentFilterSubject !== 'all' ? `(درس ${currentFilterSubject})` : ''} ({toPersianDigits(classExams.length)})
              </span>
            </h3>
            <span className="text-xs text-slate-500">کلاس: {selectedClass}</span>
          </div>

          {classExams.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs space-y-2">
              <p className="font-bold text-slate-700">
                {currentFilterSubject !== 'all'
                  ? `در حال حاضر آزمون فعالی برای درس «${currentFilterSubject}» در کلاس ${selectedClass} تعریف نشده است.`
                  : `در حال حاضر آزمون فعالی برای کلاس ${selectedClass} در دسترس نیست.`}
              </p>
              {currentFilterSubject !== 'all' && onFilterSubjectChange && (
                <div>
                  <button
                    type="button"
                    onClick={() => onFilterSubjectChange('all')}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-xs cursor-pointer inline-flex items-center gap-1 mt-1"
                  >
                    <span>مشاهده آزمون‌های همه دروس</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {classExams.map((ex) => {
                const submission = getStudentSubmission(ex, studentId, studentName, students);
                const isSubmitted = !!submission;
                const schedule = getScheduleStatus(ex);
                const totalQ = ex.questions?.length || 1;
                const score20 = submission ? getDisplayScore20(submission, totalQ) : 0;

                return (
                  <div
                    key={ex.id}
                    className={`bg-white rounded-2xl border shadow-xs p-5 space-y-3.5 transition-all ${
                      isSubmitted ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ex.type === 'descriptive'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {ex.type === 'descriptive' ? 'آزمون تشریحی (ارسال عکس)' : 'آزمون تستی (تصحیح خودکار)'}
                          </span>

                          <span className="text-[10px] font-semibold text-slate-500">
                            درس: {ex.subject}
                          </span>

                          {ex.hasSchedule && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              schedule.canStart
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                            }`}>
                              {schedule.badge}
                            </span>
                          )}

                          {isSubmitted && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>تکمیل شده</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-800">{ex.title}</h4>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{toPersianDigits(ex.durationMinutes)} دقیقه</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {ex.description || 'بدون توضیحات اضافی.'}
                    </p>

                    {/* بنر اختصاصی نمره و وضعیت شرکت در آزمون */}
                    {isSubmitted && submission && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-extrabold text-emerald-950">
                              ✓ شما در این آزمون شرکت کرده‌اید.
                            </span>
                            {ex.type === 'multiple-choice' && (
                              <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                                نمره شما: {toPersianDigits(score20)} از ۲۰
                              </span>
                            )}
                            {ex.type === 'descriptive' && submission.teacherScore && (
                              <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                                نمره دبیر: {toPersianDigits(submission.teacherScore)} از ۲۰
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-emerald-700 font-mono font-medium">
                            زمان ثبت: {toPersianDigits(submission.submittedAt)}
                          </span>
                        </div>

                        <div className="text-xs text-emerald-900 leading-relaxed">
                          {ex.type === 'multiple-choice' && (
                            <p className="flex items-center gap-2 flex-wrap text-[11px]">
                              <span>تعداد پاسخ‌های صحیح: <strong>{toPersianDigits(submission.correctCount || 0)}</strong> از {toPersianDigits(ex.questions?.length || 0)}</span>
                              <span>•</span>
                              <span>پاسخ‌های نادرست: <strong>{toPersianDigits(submission.wrongCount || 0)}</strong></span>
                              <span>•</span>
                              <span>بی‌پاسخ: <strong>{toPersianDigits(submission.unansweredCount || 0)}</strong></span>
                            </p>
                          )}

                          {ex.type === 'descriptive' && (
                            <div className="text-[11px] space-y-1">
                              {submission.teacherScore ? (
                                <p>
                                  <strong>نمره ثبت‌شده:</strong> {toPersianDigits(submission.teacherScore)} از ۲۰
                                </p>
                              ) : (
                                <p className="text-amber-800 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                                  ⏳ پاسخنامه دست‌نویس شما ارسال شده و در انتظار تصحیح و ثبت نمره توسط دبیر است.
                                </p>
                              )}
                            </div>
                          )}

                          {submission.teacherFeedback && (
                            <div className="p-2 bg-white/90 rounded-lg border border-emerald-300 text-slate-700 mt-1.5 flex items-start gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <div>
                                <strong className="font-bold text-slate-900">بازخورد دبیر: </strong>
                                <span>{submission.teacherFeedback}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>تاریخ انتشار: {toPersianDigits(ex.shamsiDate)}</span>
                        {ex.hasSchedule && ex.startTime && (
                          <span className="text-indigo-600 font-bold">
                            (مهلت ورود: {toPersianDigits(ex.startTime)} تا {toPersianDigits(ex.endTime || '۲۴:۰۰')})
                          </span>
                        )}
                      </div>

                      {isSubmitted ? (
                        <button
                          type="button"
                          onClick={() => handleStartExam(ex)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>مشاهده کارنامه و بررسی پاسخنامه</span>
                        </button>
                      ) : !schedule.canStart ? (
                        <button
                          type="button"
                          disabled
                          title={schedule.message}
                          className="px-4 py-2 bg-slate-100 text-slate-400 border border-slate-200 font-bold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span>{schedule.badge || 'خارج از بازه مجاز ورود'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!studentName.trim()) {
                              alert('لطفاً ابتدا نام و نام خانوادگی خود را در کادر بالای صفحه وارد کنید.');
                              return;
                            }
                            handleStartExam(ex);
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <FileQuestion className="w-4 h-4" />
                          <span>شروع آزمون با تایمر</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Question Sheet Modal */}
      {questionZoomUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800">برگه سوالات آزمون</span>
              <button
                onClick={() => setQuestionZoomUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-900/5">
              <img
                src={questionZoomUrl}
                alt="برگه سوالات"
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
