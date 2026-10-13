import { describe, expect, it } from "vitest";
import { canManageFees, feeOutstanding, formatFeeAmount } from "./display";
import { normalizeFee, normalizeFeeList, normalizeFeeSummary } from "./normalize";
import { feeListQueryForPersona, feeListSearch, parseFeeListQuery } from "./query";
import { paymentFormSchema, toFeeCreatePayload, toPaymentPayload } from "./schemas";

const record = {
  _id: "fee-1",
  studentId: { _id: "64b000000000000000000001", firstName: "Omar", lastName: "Khan", studentId: "STU-1" },
  title: "Tuition",
  description: "Term charge",
  amount: 100,
  paidAmount: 40,
  dueDate: "2026-11-01T00:00:00.000Z",
  paidDate: "2026-10-13T00:00:00.000Z",
  status: "partial",
  academicYear: "2026",
  term: "1",
};

describe("normalizeFee", () => {
  it("reads the student profile id separately from the school student ID", () => {
    expect(normalizeFee(record)).toMatchObject({
      id: "fee-1",
      student: { id: "64b000000000000000000001", studentId: "STU-1", firstName: "Omar" },
      title: "Tuition",
      amount: 100,
      paidAmount: 40,
      status: "partial",
      academicYear: "2026",
      term: "1",
    });
    expect(feeOutstanding(normalizeFee(record))).toBe(60);
  });

  it("rejects a fee without an amount or with an unknown status", () => {
    expect(() => normalizeFee({ ...record, amount: "100" })).toThrow(/amount/);
    expect(() => normalizeFee({ ...record, status: "void" })).toThrow(/status/);
  });
});

describe("fee list, summary, and permissions", () => {
  it("reads the fees collection and summary totals", () => {
    expect(normalizeFeeList({ fees: [record], total: 1, page: 1, totalPages: 1 }).fees).toHaveLength(1);
    expect(() => normalizeFeeList({ students: [] })).toThrow(/not valid/);
    expect(
      normalizeFeeSummary({
        totalAmount: 100,
        totalPaid: 40,
        totalPending: 60,
        overdue: 0,
        paid: 0,
        partial: 1,
        pending: 0,
        total: 1,
      }),
    ).toMatchObject({ totalPending: 60, partial: 1 });
  });

  it("keeps status, year, and term filters and hides another student filter from a student", () => {
    const query = parseFeeListQuery(new URLSearchParams("status=partial&academicYear=2026&term=1&studentId=student-1&page=2"));
    expect(feeListSearch(query)).toBe("?studentId=student-1&status=partial&academicYear=2026&term=1&page=2");
    expect(feeListQueryForPersona(query, "student").studentId).toBe("");
    expect(feeListQueryForPersona(query, "teacher").studentId).toBe("student-1");
  });

  it("shows fee management controls only to administrators", () => {
    expect(canManageFees("admin")).toBe(true);
    expect(canManageFees("teacher")).toBe(false);
    expect(canManageFees("student")).toBe(false);
    expect(canManageFees("unscoped")).toBe(false);
  });

  it("submits the selected student profile id and omits a blank payment date", () => {
    const payload = toFeeCreatePayload({
      studentId: "64b000000000000000000001",
      title: " Tuition ",
      description: "",
      amount: 100,
      dueDate: "2026-11-01",
      academicYear: "2026",
      term: "1",
      status: "pending",
    });
    expect(payload.studentId).toBe("64b000000000000000000001");
    expect(payload.studentId).not.toBe("STU-1");
    expect(payload).not.toHaveProperty("description");
    expect(toPaymentPayload({ paidAmount: 40, paidDate: "" })).toEqual({ paidAmount: 40 });
    expect(paymentFormSchema.safeParse({ paidAmount: 0, paidDate: "" }).success).toBe(false);
    expect(formatFeeAmount(100.5)).toContain("100");
  });
});
