import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfig, StudentProfile, AttendanceRecord, Assignment, Exam } from '../types';
import { getTodayShamsi, getCurrentTimeString } from '../utils/persianDate';

// Safe environment variable retrieval
const getEnvVar = (name: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const val = (import.meta as any).env[name];
      if (val) return String(val).trim();
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[name];
      if (val) return String(val).trim();
    }
  } catch {}
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseUrl !== '' && supabaseAnonKey && supabaseAnonKey !== '');
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

/**
 * تست اتصال به دیتابیس سوپابیس
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'تنظیمات VITE_SUPABASE_URL یا VITE_SUPABASE_ANON_KEY در متغیرهای محیطی تعریف نشده‌اند.',
    };
  }

  try {
    const { error } = await client.from('app_config').select('id').limit(1);
    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "app_config" does not exist')) {
        return {
          success: false,
          message: 'اتصال به سوپابیس برقرار است ولی جدول‌های دیتابیس هنوز ساخته نشده‌اند. فایل supabase-schema.sql را در SQL Editor سوپابیس اجرا کنید.',
        };
      }
      return { success: false, message: `خطا در اتصال به سوپابیس: ${error.message}` };
    }
    return { success: true, message: 'اتصال به دیتابیس سوپابیس با موفقیت برقرار است و داده‌ها همگام هستند.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'خطای ناشناخته در اتصال به سوپابیس' };
  }
}

/**
 * دریافت تمامی اطلاعات از جداول سوپابیس
 */
export async function fetchFullStateFromSupabase(): Promise<{
  config?: AppConfig;
  students?: StudentProfile[];
  attendance?: AttendanceRecord[];
  assignments?: Assignment[];
  exams?: Exam[];
} | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    // 1. Config
    const configRes = await client.from('app_config').select('data').limit(1).maybeSingle();
    const config: AppConfig | undefined = configRes.data?.data;

    // 2. Students
    const studentsRes = await client.from('students').select('*').order('created_at', { ascending: true });
    let students: StudentProfile[] | undefined;
    if (studentsRes.data) {
      students = studentsRes.data.map((row: any) => ({
        id: row.id,
        name: row.name,
        firstName: row.first_name || undefined,
        lastName: row.last_name || undefined,
        className: row.class_name,
        code: row.national_code || row.code || undefined,
        fatherName: row.father_name || undefined,
        mobile: row.parent_phone || row.mobile || undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at || new Date().toISOString(),
      }));
    }

    // 3. Attendance
    const attRes = await client.from('attendance_records').select('*').order('created_at', { ascending: false });
    let attendance: AttendanceRecord[] | undefined;
    if (attRes.data) {
      attendance = attRes.data.map((row: any) => ({
        id: row.id,
        studentId: row.student_id || undefined,
        studentName: row.student_name,
        className: row.class_name,
        subject: row.subject,
        term: row.term || undefined,
        shamsiDate: row.date_shamsi || row.shamsi_date || getTodayShamsi().dateString,
        timeString: row.time_tehran || row.time_string || getCurrentTimeString(),
        timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
        notes: row.notes || undefined,
        eitaaId: row.eitaa_id || undefined,
        deviceId: row.device_id || undefined,
      }));
    }

    // 4. Assignments
    const assignRes = await client.from('assignments').select('*').order('created_at', { ascending: false });
    let assignments: Assignment[] | undefined;
    if (assignRes.data) {
      assignments = assignRes.data.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        className: row.class_name,
        subject: row.subject,
        term: row.term || undefined,
        shamsiDate: row.date_shamsi || row.shamsi_date || getTodayShamsi().dateString,
        createdAt: row.created_at || new Date().toISOString(),
        fileName: row.file_name || undefined,
        fileSize: row.file_size || undefined,
        fileData: row.file_data || undefined,
        fileType: row.file_type || undefined,
        gradingType: row.grading_type || 'descriptive',
        gradesPublished: row.grades_published !== false,
        grades: row.grades || {},
      }));
    }

    // 5. Exams
    const examsRes = await client.from('exams').select('*').order('created_at', { ascending: false });
    let exams: Exam[] | undefined;
    if (examsRes.data) {
      exams = examsRes.data.map((row: any) => ({
        id: row.id,
        title: row.title,
        type: row.type || 'multiple-choice',
        className: row.class_name,
        subject: row.subject,
        term: row.term || undefined,
        description: row.description || '',
        durationMinutes: row.duration_minutes || 20,
        isActive: row.is_active !== false,
        shamsiDate: row.date_shamsi || row.shamsi_date || getTodayShamsi().dateString,
        createdAt: row.created_at || new Date().toISOString(),
        hasSchedule: Boolean(row.has_schedule),
        scheduledDate: row.scheduled_date || undefined,
        startTime: row.start_time || undefined,
        endTime: row.end_time || undefined,
        fileName: row.file_name || undefined,
        fileSize: row.file_size || undefined,
        fileData: row.file_data || undefined,
        fileType: row.file_type || undefined,
        questions: row.questions || [],
        submissions: row.submissions || {},
      }));
    }

    return { config, students, attendance, assignments, exams };
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
    return null;
  }
}

// ----------------- SYNC / CRUD HELPERS -----------------

export async function upsertConfigToSupabase(config: AppConfig): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const today = getTodayShamsi();
    const { error } = await client.from('app_config').upsert({
      id: 1,
      data: config,
      updated_at: new Date().toISOString(),
      updated_at_shamsi: `${today.dateString} ${today.timeString}`,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to sync config to Supabase:', err);
    return false;
  }
}

export async function upsertStudentToSupabase(student: StudentProfile): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const today = getTodayShamsi();
    const { error } = await client.from('students').upsert({
      id: student.id,
      name: student.name,
      first_name: student.firstName || null,
      last_name: student.lastName || null,
      class_name: student.className,
      national_code: student.code || null,
      father_name: student.fatherName || null,
      parent_phone: student.mobile || null,
      notes: student.notes || null,
      created_at_shamsi: today.dateString,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to save student to Supabase:', err);
    return false;
  }
}

export async function upsertStudentsBatchToSupabase(students: StudentProfile[]): Promise<boolean> {
  const client = getSupabase();
  if (!client || students.length === 0) return false;
  try {
    const today = getTodayShamsi();
    const rows = students.map((s) => ({
      id: s.id,
      name: s.name,
      first_name: s.firstName || null,
      last_name: s.lastName || null,
      class_name: s.className,
      national_code: s.code || null,
      father_name: s.fatherName || null,
      parent_phone: s.mobile || null,
      notes: s.notes || null,
      created_at_shamsi: today.dateString,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from('students').upsert(rows);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to batch save students to Supabase:', err);
    return false;
  }
}

export async function deleteStudentFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('students').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete student from Supabase:', err);
    return false;
  }
}

export async function insertAttendanceToSupabase(
  record: AttendanceRecord,
  student?: StudentProfile
): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    if (student) {
      // Ensure student profile is stored in Supabase
      await upsertStudentToSupabase(student).catch((e) =>
        console.warn('Silent student sync warning in attendance insert:', e)
      );
    }

    const payload = {
      id: record.id,
      student_id: record.studentId || null,
      student_name: record.studentName,
      class_name: record.className,
      subject: record.subject,
      term: record.term || null,
      date_shamsi: record.shamsiDate,
      time_tehran: record.timeString,
      timestamp: record.timestamp || new Date().toISOString(),
      notes: record.notes || null,
      eitaa_id: record.eitaaId || null,
      device_id: record.deviceId || null,
    };

    const { error } = await client.from('attendance_records').insert(payload);
    if (error) {
      // If foreign key constraint (23503) triggered because student_id is not in students table:
      if (error.code === '23503') {
        console.warn(
          'Foreign key violation for student_id in Supabase. Retrying insert with student_id: null so record is preserved:',
          error.message
        );
        const retryRes = await client.from('attendance_records').insert({
          ...payload,
          student_id: null,
        });
        if (retryRes.error) throw retryRes.error;
        return true;
      }
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Failed to insert attendance to Supabase:', err);
    return false;
  }
}

export async function deleteAttendanceFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('attendance_records').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete attendance from Supabase:', err);
    return false;
  }
}

export async function upsertAssignmentToSupabase(assignment: Assignment): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const today = getTodayShamsi();
    const { error } = await client.from('assignments').upsert({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description || '',
      class_name: assignment.className,
      subject: assignment.subject,
      term: assignment.term || null,
      grading_type: assignment.gradingType,
      grades_published: assignment.gradesPublished,
      file_name: assignment.fileName || null,
      file_size: assignment.fileSize || null,
      file_data: assignment.fileData || null,
      file_type: assignment.fileType || null,
      grades: assignment.grades || {},
      created_at_shamsi: assignment.shamsiDate || today.dateString,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to upsert assignment to Supabase:', err);
    return false;
  }
}

export async function deleteAssignmentFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('assignments').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete assignment from Supabase:', err);
    return false;
  }
}

export async function upsertExamToSupabase(exam: Exam): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const today = getTodayShamsi();
    const { error } = await client.from('exams').upsert({
      id: exam.id,
      title: exam.title,
      type: exam.type,
      class_name: exam.className,
      subject: exam.subject,
      term: exam.term || null,
      description: exam.description || '',
      duration_minutes: exam.durationMinutes,
      is_active: exam.isActive,
      has_schedule: exam.hasSchedule || false,
      scheduled_date: exam.scheduledDate || null,
      start_time: exam.startTime || null,
      end_time: exam.endTime || null,
      file_name: exam.fileName || null,
      file_size: exam.fileSize || null,
      file_data: exam.fileData || null,
      file_type: exam.fileType || null,
      questions: exam.questions || [],
      submissions: exam.submissions || {},
      created_at_shamsi: exam.shamsiDate || today.dateString,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to upsert exam to Supabase:', err);
    return false;
  }
}

export async function deleteExamFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('exams').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete exam from Supabase:', err);
    return false;
  }
}
