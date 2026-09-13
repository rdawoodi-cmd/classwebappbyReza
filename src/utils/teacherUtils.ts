import { AppConfig, TeacherAccount } from '../types';
import { sortClassesCustom } from './persianDate';

/**
 * Returns the list of subject names assigned to the given teacher account.
 * If no teacher is logged in (null), returns all configured school subjects.
 */
export function getTeacherAssignedSubjects(tch: TeacherAccount | null, config: AppConfig): string[] {
  if (!tch) return config.subjects || [];

  const assignedSet = new Set<string>();

  // 1. Check subjectClasses mapping (only include subjects present in school config)
  if (tch.subjectClasses && typeof tch.subjectClasses === 'object') {
    Object.entries(tch.subjectClasses).forEach(([subName, classes]) => {
      if (Array.isArray(classes) && classes.length > 0 && config.subjects.includes(subName)) {
        assignedSet.add(subName);
      }
    });
  }

  // 2. Fallback to subjects array or single subject property if subjectClasses was empty
  if (assignedSet.size === 0) {
    const list = tch.subjects || (tch.subject ? [tch.subject] : []);
    list.forEach((s) => {
      if (config.subjects.includes(s)) assignedSet.add(s);
    });
  }

  // 3. Last fallback if still empty
  if (assignedSet.size === 0) {
    if (tch.subject && config.subjects.includes(tch.subject)) {
      assignedSet.add(tch.subject);
    } else if (config.subjects.length > 0) {
      return config.subjects;
    }
  }

  return Array.from(assignedSet);
}

/**
 * Returns the list of class names assigned to the given teacher for a specific subject.
 * Strict Single Source of Truth: ONLY tch.subjectClasses[subjectName].
 * If no teacher is logged in (null, e.g. manager), returns all configured school classes.
 * If subjectClasses[subjectName] is undefined, empty, or not an array, strictly returns [].
 */
export function getTeacherAssignedClassesForSubject(
  tch: TeacherAccount | null,
  subjectName: string,
  config: AppConfig
): string[] {
  if (!tch) {
    return sortClassesCustom(config.classes || []);
  }

  // Strict: only tch.subjectClasses[subjectName]
  if (tch.subjectClasses && typeof tch.subjectClasses === 'object') {
    const classesForSub = tch.subjectClasses[subjectName];
    if (classesForSub && Array.isArray(classesForSub) && classesForSub.length > 0) {
      return sortClassesCustom(classesForSub.filter((c) => config.classes.includes(c)));
    }
  }

  return [];
}
