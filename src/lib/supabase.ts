import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfig, StudentProfile, AttendanceRecord, Assignment, Exam } from '../types';
import { getTodayShamsi, getCurrentTimeString } from '../utils/persianDate';

const supabaseUrl = 'https://dzbjznvdrrkfgycxqcnf.supabase.co';
const supabaseAnonKey = 'sb_publishable_hLm2YZ48fzg-IC_u3BHVSw_PKPVEz0L';

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

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'تنظیمات URL یا کلید سوپابیس وارد نشده است.',
    };
  }

  try {
    const { error } = await client.from('app_config').select('id').limit(1);
    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "app_config" does not exist')) {
        return {
          success: false,
          message: 'اتصال به سوپابیس برقرار است ولی جدول‌های دیتابیس هنوز ساخته نشده‌اند.',
        };
      }
      return { success: false, message: `خطا در اتصال به سوپابیس: ${error.message}` };
    }
    return { success: true, message: 'اتصال به دیتابیس سوپابیس با موفقیت برقرار است و داده‌ها همگام هستند.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'خطای ناشناخته در اتصال به سوپابیس' };
  }
}

export async function fetchFullStateFromSupabase() {
  const client = getSupabase();
  if (!client) return null;

  try {
    const configRes = await client.from('app_config').select('data').limit(1).maybeSingle();
    const config = configRes.data?.data;

    const studentsRes = await client.from('students').select('*').order('created_at', { ascending: true });
    let students = studentsRes.data?.map((row: any) => ({
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

    const attRes = await client.from('attendance_records').select('*').order('created_at', { ascending: false });
    let attendance = attRes.data?.map((row: any) => ({
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

    const assignRes = await client.from('assignments').select('*').order('created_at', { ascending: false });
    let assignments = assignRes.data?.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      className: row.class_name,
      subject: row.subject,
      term: row.term || undefined,
      shamsiDate: row.date_shamsi || row.shamsi_date || getTodayShamsi().dateString,
      createdAt: row.created_at || new Date().toISOString(),
      gradingType: row.grading_type || 'descriptive',
      gradesPublished: row.grades_published !== false,
      grades: row.grades || {},
    }));

    const examsRes = await client.from('exams').select('*').order('created_at', { ascending: false });
    let exams = examsRes.data?.map((row: any) => ({
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
      questions: row.questions || [],
      submissions: row.submissions || {},
    }));

    return { config, students, attendance, assignments, exams };
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
    return null;
  }
}

export async function upsertConfigToSupabase(config: AppConfig): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('app_config').upsert({
      id: 1,
      data: config,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    return false;
  }
}

export async function upsertStudentToSupabase(student: StudentProfile): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
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
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    return false;
  }
}

export async function upsertStudentsBatchToSupabase(students: StudentProfile[]): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const payload = students.map(student => ({
      id: student.id,
      name: student.name,
      first_name: student.firstName || null,
      last_name: student.lastName || null,
      class_name: student.className,
      national_code: student.code || null,
      father_name: student.fatherName || null,
      parent_phone: student.mobile || null,
      notes: student.notes || null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from('students').upsert(payload);
    if (error) throw error;
    return true;
  } catch (err) {
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
    return false;
  }
}

export async function insertAttendanceToSupabase(record: AttendanceRecord, student?: StudentProfile): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    if (student) {
      await upsertStudentToSupabase(student).catch(() => {});
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
      eitaaId: record.eitaaId || null,
      deviceId: record.deviceId || null,
    };
    const { error } = await client.from('attendance_records').insert(payload);
    if (error) {
      if (error.code === '23503') {
        const retryRes = await client.from('attendance_records').insert({ ...payload, student_id: null });
        if (retryRes.error) throw retryRes.error;
        return true;
      }
      throw error;
    }
    return true;
  } catch (err) {
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
    return false;
  }
}

export async function upsertAssignmentToSupabase(assignment: Assignment): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('assignments').upsert({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description || '',
      class_name: assignment.className,
      subject: assignment.subject,
      term: assignment.term || null,
      grading_type: assignment.gradingType,
      grades_published: assignment.gradesPublished,
      grades: assignment.grades || {},
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
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
    return false;
  }
}

export async function upsertExamToSupabase(exam: Exam): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
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
      questions: exam.questions || [],
      submissions: exam.submissions || {},
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
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
    return false;
  }
}
