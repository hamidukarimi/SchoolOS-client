import { describe, expect, it } from "vitest";
import { canManageLibrary } from "./display";
import { normalizeBook, normalizeBorrow, normalizeBorrowList } from "./normalize";
import { borrowListQueryForPersona, parseBookListQuery, bookListSearch } from "./query";
import { toBookPayload, toBorrowPayload } from "./schemas";

const book = {
  _id: "book-1",
  title: "Algebra",
  author: "Noori",
  isbn: "ISBN-1",
  category: "Mathematics",
  totalCopies: 2,
  availableCopies: 1,
  description: "Intro",
  publishedYear: 2020,
  status: "available",
};

describe("library records", () => {
  it("reads a book and a loan with the borrower profile", () => {
    expect(normalizeBook(book)).toMatchObject({
      id: "book-1",
      title: "Algebra",
      availableCopies: 1,
      publishedYear: 2020,
      status: "available",
    });
    expect(
      normalizeBorrow({
        _id: "borrow-1",
        bookId: { _id: "book-1", title: "Algebra", author: "Noori", isbn: "ISBN-1" },
        borrowerId: { _id: "64b000000000000000000001", firstName: "Omar", lastName: "Khan", studentId: "STU-1" },
        borrowerType: "student",
        borrowDate: "2026-10-01T00:00:00.000Z",
        dueDate: "2026-12-01T00:00:00.000Z",
        status: "borrowed",
      }),
    ).toMatchObject({
      id: "borrow-1",
      book: { id: "book-1", title: "Algebra" },
      borrower: { id: "64b000000000000000000001", code: "STU-1" },
      status: "borrowed",
    });
  });

  it("rejects an unknown loan status and an invalid book list", () => {
    expect(() => normalizeBorrow({ _id: "borrow-1", borrowerType: "student", status: "lost", bookId: null, borrowerId: null })).toThrow(/status/);
    expect(() => normalizeBorrowList({ books: [] })).toThrow(/not valid/);
  });

  it("keeps catalog filters and hides another borrower filter from a student", () => {
    const books = parseBookListQuery(new URLSearchParams("search=algebra&category=Mathematics&status=available&page=2"));
    expect(bookListSearch(books)).toBe("?search=algebra&category=Mathematics&status=available&page=2");
    const loans = { borrowerId: "student-1", bookId: "book-1", status: "borrowed" as const, page: 1 };
    expect(borrowListQueryForPersona(loans, "student").borrowerId).toBe("");
    expect(borrowListQueryForPersona(loans, "teacher").borrowerId).toBe("student-1");
  });

  it("limits catalog changes and lending to administrators", () => {
    expect(canManageLibrary("admin")).toBe(true);
    expect(canManageLibrary("teacher")).toBe(false);
    expect(canManageLibrary("student")).toBe(false);
    expect(canManageLibrary("unscoped")).toBe(false);
    expect(
      toBorrowPayload({
        borrowerId: "64b000000000000000000001",
        borrowerType: "student",
        dueDate: "2026-12-01",
      }).borrowerId,
    ).not.toBe("STU-1");
    expect(
      toBookPayload({
        title: "Algebra",
        author: "Noori",
        isbn: "",
        category: "Mathematics",
        totalCopies: 2,
        availableCopies: 1,
        description: "",
        publishedYear: "",
        status: "available",
      }),
    ).not.toHaveProperty("isbn");
  });
});
