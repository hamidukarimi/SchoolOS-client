import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { enrollStudentBody } from "./rules";

export async function enrollStudent(classId: string, studentId: string): Promise<string> {
  const response = await http.post<ApiSuccess<unknown>>(
    `/classes/${classId}/students`,
    enrollStudentBody(studentId),
  );
  return response.data.message ?? "Student added to class successfully";
}

export async function removeStudentFromClass(classId: string, studentId: string): Promise<string> {
  const response = await http.delete<ApiSuccess<null>>(`/classes/${classId}/students/${studentId}`);
  return response.data.message ?? "Student removed from class successfully";
}
