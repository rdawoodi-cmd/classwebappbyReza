import React, { useState, useRef, useEffect } from 'react';
import { 
  FileQuestion, 
  Clock, 
  Upload, 
  CheckCircle2, 
  Eye, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  FileText, 
  Image as ImageIcon, 
  HelpCircle, 
  Award, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Download,
  Users,
  Search,
  Sparkles,
  BookOpen,
  Pencil,
  Filter,
  Smartphone,
  ShieldAlert,
  Calendar,
  ArrowUpDown,
  MessageSquare
} from 'lucide-react';
import { Exam, QuizQuestion, ExamSubmission, AppConfig, Student, AcademicTerm } from '../types';
import { toPersianDigits, toEnglishDigits, getTodayShamsi } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';

interface ExamManagerProps {
  config: AppConfig;
  exams: Exam[];
  students?: Student[];
  activeSubject?: string;
  activeClass?: string;
  activeTerm?: AcademicTerm;
  assignedClasses?: string[];
  assignedSubjects?: string[];
  onCreateExam: (exam: Omit<Exam, 'id' | 'createdAt' | 'submissions'>) => void;
  onUpdateExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onGradeSubmission: (examId: string, studentName: string, teacherScore: string, teacherFeedback: string) => void;
}

export const ExamManager: React.FC<ExamManagerProps> = ({
  config,
  exams,
  students = [],
  activeSubject,
  activeClass,
  activeTerm = 'ترم اول',
  assignedClasses,
  assignedSubjects,
  onCreateExam,
  onUpdateExam,
  onDeleteExam,
  onGradeSubmission,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examType, setExamType] = useState<'descriptive' | 'multiple-choice'>('descriptive');
  
  // Form fields
  const [title, setTitle] = useState('');
  const [targetClass, setTargetClass] = useState(
    activeClass && activeClass !== 'all' ? activeClass : 'همه کلاس‌ها'
  );
  const [subject, setSubject] = useState(
    activeSubject && activeSubject !== 'all' ? activeSubject : (config.subjects[0] || 'فرهنگ و هنر')
  );
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(20);

  // Scheduling fields
  const [hasSchedule, setHasSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(getTodayShamsi().dateString);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');

  // Filters for exam list
  const [filterClass, setFilterClass] = useState(activeClass || 'all');
  const [filterSubject, setFilterSubject] = useState(activeSubject || 'all');

  // Submissions sorting: 'family_asc' | 'score_desc' | 'time_desc'
  const [submissionSortBy, setSubmissionSortBy] = useState<'family_asc' | 'score_desc' | 'time_desc'>('family_asc');

  // Sync with activeSubject and activeClass props
  useEffect(() => {
    if (activeSubject && activeSubject !== 'all') {
      setFilterSubject(activeSubject);
      setSubject(activeSubject);
    }
  }, [activeSubject]);

  useEffect(() => {
    if (activeClass) {
      setFilterClass(activeClass);
      if (activeClass !== 'all') {
        setTargetClass(activeClass);
      }
    }
  }, [activeClass]);
  
  // Descriptive file upload
  const [examFile, setExamFile] = useState<{ name: string; size: string; data: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Multiple-choice questions builder
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qText, setQText] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctOpt, setCorrectOpt] = useState<number>(0);
  const [qExplanation, setQExplanation] = useState('');

  // Selected Exam for viewing submissions
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  // Modal for viewing student uploaded photo full-size
  const [previewPhoto, setPreviewPhoto] = useState<{ studentName: string; photoUrl: string } | null>(null);
  // Modal for confirming exam deletion
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);

  // Grading states for descriptive exam
  const [gradingScores, setGradingScores] = useState<Record<string, string>>({});
  const [gradingFeedbacks, setGradingFeedbacks] = useState<Record<string, string>>({});
  const [savedStudentName, setSavedStudentName] = useState<string | null>(null);
  const [savedStudentSet, setSavedStudentSet] = useState<Record<string, boolean>>({});

  // Notification
  const [notice, setNotice] = useState<{ title: string; desc: string } | null>(null);

  const handleOpenCreateModal = () => {
    setEditingExamId(null);
    setTitle('');
    setExamType('descriptive');
    setTargetClass(config.classes[0] || 'همه کلاس‌ها');
    setSubject(activeSubject && activeSubject !== 'all' ? activeSubject : (config.subjects[0] || 'فرهنگ و هنر'));
    setDescription('');
    setDurationMinutes(20);
    setHasSchedule(false);
    setScheduledDate(getTodayShamsi().dateString);
    setStartTime('08:00');
    setEndTime('12:00');
    setExamFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setQuestions([]);
    setShowCreateModal(true);
  };

  const handleStartEditExam = (item: Exam) => {
    setEditingExamId(item.id);
    setTitle(item.title);
    setExamType(item.type);
    setTargetClass(item.className);
    setSubject(item.subject);
    setDescription(item.description || '');
    setDurationMinutes(item.durationMinutes || 20);
    setHasSchedule(!!item.hasSchedule);
    setScheduledDate(item.scheduledDate || getTodayShamsi().dateString);
    setStartTime(item.startTime || '08:00');
    setEndTime(item.endTime || '12:00');
    if (item.fileName) {
      setExamFile({
        name: item.fileName,
        size: item.fileSize || '',
        type: item.fileType || '',
        data: item.fileData || '',
      });
    } else {
      setExamFile(null);
    }
    setQuestions(item.questions ? [...item.questions] : []);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingExamId(null);
    setTitle('');
    setDescription('');
    setHasSchedule(false);
    setExamFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setQuestions([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3.5 * 1024 * 1024) {
      alert('حجم فایل برگه سوال نباید بیش از ۳.۵ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setExamFile({
        name: file.name,
        size: (file.size / 1024).toFixed(0) + ' KB',
        data: reader.result as string,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !opt0.trim() || !opt1.trim()) {
      alert('لطفاً متن سوال و حداقل دو گزینه اول را وارد کنید.');
      return;
    }

    const newQ: QuizQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      questionText: qText.trim(),
      options: [opt0.trim(), opt1.trim(), opt2.trim() || '-', opt3.trim() || '-'],
      correctOptionIndex: correctOpt,
      explanation: qExplanation.trim() || undefined,
    };

    setQuestions([...questions, newQ]);
    // Reset question inputs
    setQText('');
    setOpt0('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setCorrectOpt(0);
    setQExplanation('');
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSaveExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('لطفاً عنوان آزمون را وارد کنید.');
      return;
    }

    if (examType === 'descriptive' && !examFile && !description.trim()) {
      alert('لطفاً برگه سوال را آپلود کنید یا متن سوالات را در توضیحات بنویسید.');
      return;
    }

    if (examType === 'multiple-choice' && questions.length === 0) {
      alert('لطفاً حداقل یک سوال تستی به این آزمون اضافه نمایید.');
      return;
    }

    if (editingExamId) {
      const existingExam = exams.find((e) => e.id === editingExamId);
      if (!existingExam) return;

      const updated: Exam = {
        ...existingExam,
        title: title.trim(),
        type: examType,
        className: targetClass,
        subject,
        description: description.trim(),
        durationMinutes: Number(durationMinutes) || 15,
        hasSchedule: hasSchedule,
        scheduledDate: hasSchedule ? scheduledDate : undefined,
        startTime: hasSchedule ? startTime : undefined,
        endTime: hasSchedule ? endTime : undefined,
        fileName: examFile?.name,
        fileSize: examFile?.size,
        fileData: examFile?.data,
        fileType: examFile?.type,
        questions: examType === 'multiple-choice' ? questions : undefined,
      };

      onUpdateExam(updated);

      try {
        sounds.playCheer();
      } catch (err) {}

      setNotice({
        title: 'تغییرات آزمون ذخیره شد!',
        desc: `مشخصات و سوالات آزمون «${title.trim()}» برای کلاس (${targetClass}) و درس (${subject}) با موفقیت به‌روزرسانی و ذخیره گردید.`
      });

      // هشدار به دبیر جهت اطمینان از ذخیره شدن تغییرات
      alert(`تغییرات آزمون «${title.trim()}» با موفقیت ذخیره شد.`);
    } else {
      const today = getTodayShamsi();
      onCreateExam({
        title: title.trim(),
        type: examType,
        className: targetClass,
        subject,
        term: activeTerm,
        description: description.trim(),
        durationMinutes: Number(durationMinutes) || 15,
        hasSchedule: hasSchedule,
        scheduledDate: hasSchedule ? scheduledDate : undefined,
        startTime: hasSchedule ? startTime : undefined,
        endTime: hasSchedule ? endTime : undefined,
        isActive: true,
        shamsiDate: today.dateString,
        fileName: examFile?.name,
        fileSize: examFile?.size,
        fileData: examFile?.data,
        fileType: examFile?.type,
        questions: examType === 'multiple-choice' ? questions : undefined,
      });

      setNotice({
        title: 'آزمون جدید با موفقیت منتشر شد!',
        desc: `آزمون «${title.trim()}» برای کلاس (${targetClass}) و درس (${subject}) با تایمر ${toPersianDigits(durationMinutes)} دقیقه ثبت گردید.`
      });

      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      } catch (err) {}
    }

    handleCloseModal();

    setTimeout(() => {
      setNotice(null);
    }, 7000);
  };

  const handleToggleExamStatus = (exam: Exam) => {
    onUpdateExam({
      ...exam,
      isActive: !exam.isActive,
    });
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  // Filtered exams list
  const filteredExams = exams.filter((item) => {
    if (filterClass !== 'all' && item.className !== 'همه کلاس‌ها' && item.className !== filterClass) {
      return false;
    }
    if (filterSubject !== 'all' && item.subject !== filterSubject) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-indigo-700 via-blue-700 to-slate-800 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>سامانه آزمون‌ساز و تصحیح هوشمند</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black">
            پنل آزمون‌ها و کوئیز آنلاین دانش‌آموزی
          </h2>
          <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
            تعریف آزمون‌های تشریحی با بارگذاری عکس برگه سوال و دریافت پاسخ دست‌نویس به صورت عکس، و ساخت آزمون‌های تستی چهار گزینه‌ای با تایمر زنده و تصحیح خودکار آنی.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-900 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-blue-700" />
          <span>طراحی آزمون جدید</span>
        </button>
      </div>

      {/* Success Notification */}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">{notice.title}</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">{notice.desc}</p>
            </div>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal: Create or Edit Exam */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  {editingExamId ? <Pencil className="w-5 h-5" /> : <FileQuestion className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {editingExamId ? 'ویرایش و اصلاح مشخصات آزمون' : 'طراحی و انتشار آزمون جدید'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingExamId 
                      ? 'اصلاح کلاس هدف (مثلاً انتقال از هفتم به هشتم)، تغییر درس، زمان یا سوالات' 
                      : 'مشخصات آزمون، زمان و نوع پاسخگویی را تنظیم نمایید'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExamSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {editingExamId && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>حالت ویرایش فعال است:</strong> در صورتی که این آزمون اشتباهاً برای کلاسی دیگر (مانند هفتم الف به جای هشتم ب) یا درس دیگری (مانند هنر به جای ریاضی) ثبت شده بود، از کادرهای زیر می‌توانید آن را تصحیح و ذخیره نمایید. پاسخ‌های ثبت‌شده دانش‌آموزان محفوظ خواهند ماند.
                  </span>
                </div>
              )}
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">نوع آزمون را انتخاب کنید:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExamType('descriptive')}
                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex items-start gap-3 ${
                      examType === 'descriptive'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      examType === 'descriptive' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">۱. آزمون تشریحی (آپلود عکس برگه)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        دبیر برگه سوالات را آپلود می‌کند و دانش‌آموز پاسخ دست‌نویس را به صورت عکس ارسال می‌کند.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExamType('multiple-choice')}
                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex items-start gap-3 ${
                      examType === 'multiple-choice'
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      examType === 'multiple-choice' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">۲. آزمون تستی (چند گزینه‌ای)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        تعریف سوالات تستی با کلید پاسخ؛ سامانه در پایان خودکار نمره و درصد را محاسبه می‌کند.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Title & Timing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان آزمون:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: آزمون میان‌ترم فصل سوم ریاضی"
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">کلاس هدف:</label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-slate-50 cursor-pointer"
                  >
                    <option value="همه کلاس‌ها">همه کلاس‌ها</option>
                    {(assignedClasses && assignedClasses.length > 0 ? assignedClasses : config.classes).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">درس:</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-slate-50 cursor-pointer"
                  >
                    {(assignedSubjects && assignedSubjects.length > 0 ? assignedSubjects : config.subjects).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مدت آزمون (تایمر به دقیقه):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600 font-mono text-center"
                  />
                </div>
              </div>

              {/* Scheduling Section: Date and Time Window for Student Entry */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={hasSchedule}
                      onChange={(e) => setHasSchedule(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>تنظیم زمان‌بندی و بازه مجاز ورود به آزمون (ساعت شروع و پایان)</span>
                  </label>
                  {hasSchedule && (
                    <span className="text-[11px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-md">
                      زمان‌بندی فعال است
                    </span>
                  )}
                </div>

                {hasSchedule && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">تاریخ برگزاری (شمسی):</label>
                      <input
                        type="text"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        placeholder="مثال: ۱۴۰۳/۰۹/۱۰"
                        className="w-full text-xs font-bold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-blue-600 font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ساعت شروع ورود (از):</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full text-xs font-bold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-blue-600 font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ساعت پایان ورود (تا):</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full text-xs font-bold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-blue-600 font-mono text-center"
                      />
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-slate-500">
                  {hasSchedule
                    ? 'دانش‌آموزان فقط در این تاریخ و بازه زمانی مشخص شده مجاز به فشردن دکمه شروع آزمون خواهند بود.'
                    : 'در صورت عدم فعال‌سازی، آزمون بلافاصله و در هر ساعتی برای دانش‌آموزان فعال خواهد بود.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و راهنمای حل:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="نکات مهم برای دانش‌آموزان هنگام آزمون..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                />
              </div>

              {/* Conditional Section: Descriptive Upload */}
              {examType === 'descriptive' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-800">
                    آپلود فایل برگه سوالات امتحانی (عکس یا PDF):
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-xl bg-white file:mr-0 file:ml-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {examFile && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">{examFile.name}</span>
                        <span className="text-[10px] text-slate-400">({examFile.size})</span>
                      </div>
                      {examFile.data && examFile.type.includes('image') && (
                        <img src={examFile.data} alt="پیش‌نمایش" className="w-10 h-10 object-cover rounded-lg border" />
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">
                    دانش‌آموز این برگه سوال را در صفحه خود می‌بیند و پس از حل روی برگه کاغذ، تصویر پاسخنامه خود را ارسال می‌کند.
                  </p>
                </div>
              )}

              {/* Conditional Section: Multiple-Choice Questions Builder */}
              {examType === 'multiple-choice' && (
                <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-800">
                      سوالات تستی ({toPersianDigits(questions.length)} سوال ثبت شده)
                    </span>
                    <span className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                      تصحیح خودکار با کلید
                    </span>
                  </div>

                  {/* List of Added Questions */}
                  {questions.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {questions.map((q, idx) => (
                        <div key={q.id} className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs space-y-1 relative">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-800">
                              {toPersianDigits(idx + 1)}. {q.questionText}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(idx)}
                              className="text-rose-500 hover:text-rose-700 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 pt-1">
                            {q.options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                className={`px-1.5 py-0.5 rounded-md truncate ${
                                  oIdx === q.correctOptionIndex
                                    ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                                    : 'bg-slate-50'
                                }`}
                              >
                                {toPersianDigits(oIdx + 1)}) {opt} {oIdx === q.correctOptionIndex && '✓'}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Question Sub-Form */}
                  <div className="p-3 bg-white border border-indigo-200 rounded-xl space-y-2.5">
                    <p className="text-xs font-bold text-indigo-900">افزودن سوال جدید:</p>
                    <input
                      type="text"
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      placeholder="متن سوال را بنویسید..."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-indigo-600"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={correctOpt === 0}
                          onChange={() => setCorrectOpt(0)}
                          className="cursor-pointer"
                          title="انتخاب به عنوان پاسخ صحیح"
                        />
                        <input
                          type="text"
                          value={opt0}
                          onChange={(e) => setOpt0(e.target.value)}
                          placeholder="گزینه ۱ (الف)"
                          className="w-full text-xs px-2 py-1 border rounded-md"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={correctOpt === 1}
                          onChange={() => setCorrectOpt(1)}
                          className="cursor-pointer"
                          title="انتخاب به عنوان پاسخ صحیح"
                        />
                        <input
                          type="text"
                          value={opt1}
                          onChange={(e) => setOpt1(e.target.value)}
                          placeholder="گزینه ۲ (ب)"
                          className="w-full text-xs px-2 py-1 border rounded-md"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={correctOpt === 2}
                          onChange={() => setCorrectOpt(2)}
                          className="cursor-pointer"
                          title="انتخاب به عنوان پاسخ صحیح"
                        />
                        <input
                          type="text"
                          value={opt2}
                          onChange={(e) => setOpt2(e.target.value)}
                          placeholder="گزینه ۳ (ج)"
                          className="w-full text-xs px-2 py-1 border rounded-md"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={correctOpt === 3}
                          onChange={() => setCorrectOpt(3)}
                          className="cursor-pointer"
                          title="انتخاب به عنوان پاسخ صحیح"
                        />
                        <input
                          type="text"
                          value={opt3}
                          onChange={(e) => setOpt3(e.target.value)}
                          placeholder="گزینه ۴ (د)"
                          className="w-full text-xs px-2 py-1 border rounded-md"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      * با دکمه رادیویی کنار هر گزینه، گزینه صحیح را علامت بزنید.
                    </span>

                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 cursor-pointer"
                    >
                      + ثبت این سوال در آزمون
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingExamId ? 'ذخیره تغییرات آزمون' : 'انتشار نهایی آزمون'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List of Created Exams */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-blue-600" />
            <span>آزمون‌های تعریف شده کلاسی ({toPersianDigits(exams.length)})</span>
          </h3>

          {/* Quick Filter Bar for Class & Subject */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>فیلتر:</span>
            </span>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="text-xs font-bold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 cursor-pointer shadow-xs"
            >
              <option value="all">همه دروس</option>
              {config.subjects.map((s) => (
                <option key={s} value={s}>
                  درس {s}
                </option>
              ))}
            </select>

            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="text-xs font-bold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 cursor-pointer shadow-xs"
            >
              <option value="all">همه کلاس‌ها</option>
              {config.classes.map((c) => (
                <option key={c} value={c}>
                  کلاس {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredExams.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs space-y-2">
            <p>آزمونی با این مشخصات یا فیلترهای انتخابی یافت نشد.</p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs hover:bg-blue-100 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>طراحی آزمون جدید برای این درس</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExams.map((item) => {
              const submissionCount = Object.keys(item.submissions || {}).length;
              const isSelected = selectedExamId === item.id;

              // Calculate class participants statistics
              const targetStudents = item.className === 'همه کلاس‌ها'
                ? students
                : students.filter((s) => s.className === item.className);
              const totalClassCount = targetStudents.length > 0 ? targetStudents.length : Math.max(submissionCount, 1);
              const notParticipatedCount = Math.max(0, totalClassCount - submissionCount);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all p-5 space-y-3.5 ${
                    isSelected ? 'border-blue-600 ring-2 ring-blue-600/10 shadow-md' : 'border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.type === 'descriptive'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {item.type === 'descriptive' ? 'تشریحی (ارسال عکس)' : 'تستی چند گزینه‌ای'}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {item.className}
                        </span>

                        <span className="text-[10px] text-slate-500 font-medium">
                          درس {item.subject}
                        </span>

                        {item.hasSchedule && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>
                              ورود: {toPersianDigits(item.startTime || '۰۸:۰۰')} تا {toPersianDigits(item.endTime || '۱۲:۰۰')}
                            </span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-800 leading-snug">
                        {item.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleExamStatus(item)}
                      title={item.isActive ? 'آزمون فعال است (کلیک برای غیرفعال کردن)' : 'آزمون متوقف است (کلیک برای فعال‌سازی)'}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {item.isActive ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>فعال در سایت</span>
                        </>
                      ) : (
                        <span>متوقف شده</span>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description || 'توضیحاتی برای این آزمون ثبت نشده است.'}
                  </p>

                  {/* تاریخ دقیق انتشار و آمار شرکت‌کنندگان */}
                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-slate-600 font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <strong>تاریخ دقیق انتشار:</strong>{' '}
                        <span className="font-mono text-slate-800 font-bold">{toPersianDigits(item.shamsiDate || '۱۴۰۳/۰۹/۱۰')}</span>
                      </span>

                      <span className="flex items-center gap-1 font-mono text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>مدت: <strong>{toPersianDigits(item.durationMinutes)}</strong> دقیقه</span>
                      </span>
                    </div>

                    {/* آمار سبز و قرمز */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 flex-wrap">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[11px] rounded-lg flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        <span>شرکت کرده‌اند: <strong>{toPersianDigits(submissionCount)}</strong> نفر</span>
                      </span>

                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[11px] rounded-lg flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                        <span>هنوز شرکت نکرده‌اند: <strong>{toPersianDigits(notParticipatedCount)}</strong> نفر</span>
                      </span>

                      {item.type === 'multiple-choice' && (
                        <span className="text-[11px] text-slate-500 mr-auto font-medium">
                          {toPersianDigits(item.questions?.length || 0)} سوال تستی
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedExamId(isSelected ? null : item.id)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        {isSelected ? 'بستن لیست برگه‌ها' : `مشاهده پاسخ‌های دانش‌آموزان (${toPersianDigits(submissionCount)})`}
                      </span>
                    </button>

                    {/* دکمه اختصاصی ویرایش آزمون (کلاس، درس، سوالات) */}
                    <button
                      type="button"
                      onClick={() => handleStartEditExam(item)}
                      className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                      title="ویرایش مشخصات آزمون (کلاس هدف، نام درس، مدت زمان یا سوالات)"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>ویرایش</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingExam(item)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="حذف آزمون"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submissions Section for Selected Exam */}
      {selectedExam && (
        <div className="bg-white rounded-2xl border border-blue-300 shadow-md p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <FileQuestion className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800">
                  کارنامه و برگه‌های امتحانی: {selectedExam.title}
                </h4>
                <p className="text-xs text-slate-500">
                  کلاس: {selectedExam.className} • درس: {selectedExam.subject} • مدت: {toPersianDigits(selectedExam.durationMinutes)} دقیقه • نوع: {selectedExam.type === 'descriptive' ? 'تشریحی (ارسال عکس)' : 'تستی چند گزینه‌ای'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* مرتب‌سازی پاسخ‌ها بر اساس الفبا، نمره یا زمان */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-bold text-slate-600">مرتب‌سازی:</span>
                <select
                  value={submissionSortBy}
                  onChange={(e) => setSubmissionSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-800 cursor-pointer focus:outline-none"
                >
                  <option value="family_asc">الفبایی (نام و نام خانوادگی)</option>
                  <option value="score_desc">نمره (از بیشترین به کمترین)</option>
                  <option value="time_desc">زمان ارسال (جدیدترین)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedExamId(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 bg-slate-100 rounded-lg cursor-pointer"
              >
                بستن پنل
              </button>
            </div>
          </div>

          {/* In-Panel Success Alert for Teacher Grading */}
          {savedStudentName && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">
                    نمره و بازخورد دبیر برای دانش‌آموز «{savedStudentName}» با موفقیت ثبت شد.
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    این بازخورد در کارنامه آنلاین این دانش‌آموز ذخیره شد و برای او قابل مشاهده است.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSavedStudentName(null)}
                className="text-emerald-700 hover:text-emerald-950 p-1 text-xs cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {(() => {
            const rawSubsList = (Object.values(selectedExam.submissions || {}) as ExamSubmission[]);
            if (rawSubsList.length === 0) {
              return (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                  هنوز هیچ دانش‌آموزی پاسخی برای این آزمون ارسال نکرده است. به محض ارسال توسط دانش‌آموز، تصویر پاسخنامه یا درصد تستی در اینجا نمایش داده خواهد شد.
                </div>
              );
            }

            // Sort submissions
            const subsList = [...rawSubsList].sort((a, b) => {
              if (submissionSortBy === 'family_asc') {
                return a.studentName.trim().localeCompare(b.studentName.trim(), 'fa');
              } else if (submissionSortBy === 'score_desc') {
                const getScoreValue = (sub: ExamSubmission) => {
                  if (sub.calculatedScore20 !== undefined) return sub.calculatedScore20;
                  if (sub.teacherScore) return Number(sub.teacherScore) || 0;
                  if (sub.scorePercent !== undefined) return Math.ceil((sub.scorePercent / 100) * 20);
                  return 0;
                };
                return getScoreValue(b) - getScoreValue(a);
              } else {
                return (b.id || '').localeCompare(a.id || '');
              }
            });

            // Identify duplicate Eitaa IDs or Device IDs
            const eitaaCounts = new Map<string, number>();
            const deviceCounts = new Map<string, number>();
            const eitaaToNames = new Map<string, Set<string>>();
            const deviceToNames = new Map<string, Set<string>>();

            subsList.forEach((sub) => {
              const cleanName = sub.studentName.trim();
              if (sub.eitaaId && sub.eitaaId.trim()) {
                const key = sub.eitaaId.trim().toLowerCase();
                eitaaCounts.set(key, (eitaaCounts.get(key) || 0) + 1);
                if (!eitaaToNames.has(key)) {
                  eitaaToNames.set(key, new Set());
                }
                eitaaToNames.get(key)!.add(cleanName);
              }
              if (sub.deviceId && sub.deviceId.trim()) {
                const key = sub.deviceId.trim();
                deviceCounts.set(key, (deviceCounts.get(key) || 0) + 1);
                if (!deviceToNames.has(key)) {
                  deviceToNames.set(key, new Set());
                }
                deviceToNames.get(key)!.add(cleanName);
              }
            });

            return (
              <div className="space-y-3">
                {subsList.map((sub) => {
                  const eKey = sub.eitaaId?.trim().toLowerCase();
                  const eNames = eKey ? eitaaToNames.get(eKey) : undefined;
                  const isMultiStudentEitaa = !!(eNames && eNames.size > 1);
                  const isEitaaDup = !!(eKey && (eitaaCounts.get(eKey) || 0) > 1);

                  const dKey = sub.deviceId?.trim();
                  const dNames = dKey ? deviceToNames.get(dKey) : undefined;
                  const isMultiStudentDev = !!(dNames && dNames.size > 1);
                  const isDeviceDup = !!(dKey && (deviceCounts.get(dKey) || 0) > 1);

                  const isSuspicious = isMultiStudentEitaa || isEitaaDup || isMultiStudentDev || isDeviceDup;

                  const totalQuestions = selectedExam.questions?.length || 1;
                  const score20 = sub.calculatedScore20 !== undefined 
                    ? sub.calculatedScore20 
                    : sub.correctCount !== undefined 
                      ? Math.ceil((sub.correctCount / totalQuestions) * 20)
                      : sub.scorePercent !== undefined 
                        ? Math.ceil((sub.scorePercent / 100) * 20)
                        : 0;

                  return (
                    <div
                      key={sub.id}
                      className={`border rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                        isMultiStudentEitaa
                          ? 'bg-rose-100/70 border-rose-400 font-medium'
                          : isSuspicious
                            ? 'bg-rose-50/70 border-rose-300'
                            : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-extrabold text-sm text-slate-900">{sub.studentName}</h5>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium">
                            کلاس {sub.className}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ارسال در: {toPersianDigits(sub.submittedAt)}
                          </span>

                          {/* شناسه ایتا یا دستگاه با علامت‌گذاری قرمز در صورت تکراری بودن */}
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-mono font-medium ${
                            isMultiStudentEitaa
                              ? 'bg-rose-200 text-rose-950 border-rose-400 font-black'
                              : isSuspicious
                                ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                                : 'bg-white text-slate-700 border-slate-200'
                          }`}>
                            <Smartphone className={`w-3.5 h-3.5 ${isSuspicious ? 'text-rose-600' : 'text-slate-500'}`} />
                            <span dir="ltr">
                              {sub.eitaaId ? `${sub.eitaaId}` : (sub.deviceId ? `دستگاه: ${sub.deviceId.substring(0, 8)}` : 'شناسه ثبت‌نشده')}
                            </span>
                            {isMultiStudentEitaa && eNames && (
                              <span className="bg-rose-600 text-white font-sans text-[10.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" />
                                <span>هشدار تقلب: آزمون با {toPersianDigits(eNames.size)} نام مختلف با همین اکانت ایتا ({Array.from(eNames).join(' و ')})</span>
                              </span>
                            )}
                            {!isMultiStudentEitaa && isSuspicious && (
                              <span className="bg-rose-500 text-white font-sans text-[10.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" />
                                <span>اکانت یا شناسه تکراری</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* If multiple choice */}
                        {selectedExam.type === 'multiple-choice' && (
                          <div className="flex items-center gap-2.5 text-xs pt-1 flex-wrap">
                            <span className="font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                              نمره: {toPersianDigits(score20)} از ۲۰ ({toPersianDigits(sub.scorePercent ?? 0)}٪)
                            </span>
                            <span className="text-emerald-600 font-bold">
                              ✓ {toPersianDigits(sub.correctCount ?? 0)} درست
                            </span>
                            <span className="text-rose-600 font-bold">
                              ✗ {toPersianDigits(sub.wrongCount ?? 0)} نادرست
                            </span>
                            <span className="text-slate-500">
                              - {toPersianDigits(sub.unansweredCount ?? 0)} نزده
                            </span>
                            {sub.teacherFeedback && (
                              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                نظر ثبت‌شده دبیر: {sub.teacherFeedback}
                              </span>
                            )}
                          </div>
                        )}

                        {/* If descriptive photo answer */}
                        {selectedExam.type === 'descriptive' && (
                          <div className="flex items-center gap-2 pt-1 text-xs flex-wrap">
                            {sub.photoAnswer ? (
                              <button
                                type="button"
                                onClick={() => setPreviewPhoto({ studentName: sub.studentName, photoUrl: sub.photoAnswer! })}
                                className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>مشاهده تصویر برگه پاسخنامه ارسالی</span>
                              </button>
                            ) : (
                              <span className="text-slate-400">عکس ارسال نشده</span>
                            )}
                            {sub.teacherScore && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                                نمره دبیر: {toPersianDigits(sub.teacherScore)} از ۲۰
                              </span>
                            )}
                            {sub.teacherFeedback && (
                              <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                بازخورد: {sub.teacherFeedback}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Teacher Grading & Feedback Box for Both Types */}
                      {(() => {
                        const isGraded = Boolean(
                          sub.teacherFeedback ||
                          sub.teacherScore ||
                          savedStudentSet[sub.studentName] ||
                          savedStudentName === sub.studentName
                        );

                        return (
                          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            {(() => {
                              const subKey = sub.studentId || sub.studentName;
                              return (
                                <>
                                  <input
                                    type="text"
                                    placeholder={selectedExam.type === 'descriptive' ? 'نمره از ۲۰ (مثال: ۱۹)' : 'اصلاح نمره'}
                                    defaultValue={sub.teacherScore || (selectedExam.type === 'multiple-choice' ? String(score20) : '')}
                                    onChange={(e) => setGradingScores({ ...gradingScores, [subKey]: e.target.value })}
                                    className="w-24 text-xs font-bold px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-center focus:outline-blue-600"
                                  />
                                  <input
                                    type="text"
                                    placeholder="توضیحات و بازخورد دبیر برای دانش‌آموز..."
                                    defaultValue={sub.teacherFeedback || ''}
                                    onChange={(e) => setGradingFeedbacks({ ...gradingFeedbacks, [subKey]: e.target.value })}
                                    className="w-52 text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-blue-600"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const sc = gradingScores[subKey] ?? sub.teacherScore ?? (selectedExam.type === 'multiple-choice' ? String(score20) : '');
                                      const fb = gradingFeedbacks[subKey] ?? sub.teacherFeedback ?? '';
                                      if (sc && sc.trim() !== '') {
                                        const parsed = parseFloat(toEnglishDigits(sc));
                                        if (isNaN(parsed) || parsed < 0 || parsed > 20) {
                                          alert('خطا: نمره عددی باید مقداری بین ۰ تا ۲۰ باشد.');
                                          return;
                                        }
                                      }
                                      onGradeSubmission(selectedExam.id, subKey, sc, fb);
                                      setSavedStudentSet((prev) => ({ ...prev, [subKey]: true }));
                                      setSavedStudentName(sub.studentName);
                                      setNotice({
                                        title: 'بازخورد دبیر با موفقیت ثبت شد',
                                        desc: `نمره (${toPersianDigits(sc || 'ثبت شده')}) و نظر دبیر برای دانش‌آموز «${sub.studentName}» با موفقیت ذخیره شد.`
                                      });
                                      try {
                                        sounds.playCheer();
                                      } catch {}
                                    }}
                                    className={`px-3 py-1.5 font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1 transition-all duration-200 ${
                                      isGraded
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-1 ring-emerald-300'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                  >
                                    {isGraded ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
                                        <span>✓ نظر و نمره ثبت شد</span>
                                      </>
                                    ) : (
                                      <>
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>ثبت نظر و نمره</span>
                                      </>
                                    )}
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Delete Exam Confirmation Modal */}
      {deletingExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-800">حذف آزمون</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              آیا از حذف آزمون <strong className="text-slate-800">«{deletingExam.title}»</strong> اطمینان دارید؟
            </p>
            <p className="text-[11px] text-rose-500 bg-rose-50/70 p-2.5 rounded-xl border border-rose-100">
              ⚠️ این عملیات غیرقابل بازگشت است و تمامی پاسخ‌ها و برگه‌های ثبت‌شده برای این آزمون نیز حذف خواهند شد.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingExam(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deletingExam) {
                    const examTitle = deletingExam.title;
                    onDeleteExam(deletingExam.id);
                    if (selectedExamId === deletingExam.id) setSelectedExamId(null);
                    setDeletingExam(null);
                    alert(`آزمون «${examTitle}» با موفقیت حذف شد.`);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                بله، آزمون حذف شود
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800">
                برگه پاسخنامه ارسالی: {previewPhoto.studentName}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewPhoto.photoUrl}
                  download={`پاسخنامه_${previewPhoto.studentName}.png`}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود فایل</span>
                </a>
                <button
                  onClick={() => setPreviewPhoto(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-900/5">
              <img
                src={previewPhoto.photoUrl}
                alt="پاسخنامه دانش‌آموز"
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
