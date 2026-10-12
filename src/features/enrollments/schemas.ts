import { z } from "zod";

export const enrollStudentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
});

export type EnrollStudentValues = z.infer<typeof enrollStudentSchema>;
