export const FEE_STATUSES = ["pending", "partial", "paid", "overdue"] as const;

export type FeeStatus = (typeof FEE_STATUSES)[number];

export interface FeeStudentRef {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

export interface FeeRecord {
  id: string;
  student: FeeStudentRef | null;
  title: string;
  description: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paidDate: string;
  status: FeeStatus;
  academicYear: string;
  term: string;
}

export interface FeeListResult {
  fees: FeeRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FeeListQuery {
  studentId: string;
  status: FeeStatus | "";
  academicYear: string;
  term: string;
  page: number;
}

export interface FeeSummary {
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  overdue: number;
  paid: number;
  partial: number;
  pending: number;
  total: number;
}

export interface FeeWritePayload {
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  academicYear: string;
  term: string;
  status?: FeeStatus;
}

export interface FeeCreatePayload extends FeeWritePayload {
  studentId: string;
}

export interface FeePaymentPayload {
  paidAmount: number;
  paidDate?: string;
}
