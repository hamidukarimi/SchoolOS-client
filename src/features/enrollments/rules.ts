export interface EnrollmentStudentChoice {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

export function enrollStudentBody(studentId: string): { studentId: string } {
  return { studentId };
}

export const enrollmentInvalidationKey = ["classes"] as const;

export function isClassFull(studentCount: number, capacity: number): boolean {
  return studentCount >= capacity;
}

export function availableStudentChoices(
  students: EnrollmentStudentChoice[],
  enrolledIds: readonly string[],
): { id: string; label: string }[] {
  return students
    .filter((student) => !enrolledIds.includes(student.id))
    .map((student) => ({
      id: student.id,
      label: student.studentId
        ? `${student.firstName} ${student.lastName} · ${student.studentId}`
        : `${student.firstName} ${student.lastName}`,
    }));
}

export function canSubmitEnrollment(input: {
  studentId: string;
  pending: boolean;
  studentCount: number;
  capacity: number;
  enrolledIds: readonly string[];
}): boolean {
  if (!input.studentId.trim() || input.pending) return false;
  if (isClassFull(input.studentCount, input.capacity)) return false;
  return !input.enrolledIds.includes(input.studentId);
}
