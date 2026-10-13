import type { SchoolPersona } from "../access/types";
import { BOOK_STATUSES, BORROW_STATUSES, type BookListQuery, type BorrowListQuery } from "./types";

export const LIBRARY_PAGE_SIZE = 20;

export function parseBookListQuery(params: URLSearchParams): BookListQuery {
  const rawPage = Number(params.get("page"));
  const rawStatus = params.get("status") ?? "";
  return {
    search: (params.get("search") ?? "").trim(),
    category: (params.get("category") ?? "").trim(),
    status: (BOOK_STATUSES as readonly string[]).includes(rawStatus) ? (rawStatus as BookListQuery["status"]) : "",
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function bookListSearch(query: BookListQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  if (query.status) params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function parseBorrowListQuery(params: URLSearchParams): BorrowListQuery {
  const rawPage = Number(params.get("page"));
  const rawStatus = params.get("status") ?? "";
  return {
    borrowerId: (params.get("borrowerId") ?? "").trim(),
    bookId: (params.get("bookId") ?? "").trim(),
    status: (BORROW_STATUSES as readonly string[]).includes(rawStatus) ? (rawStatus as BorrowListQuery["status"]) : "",
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function borrowListQueryForPersona(query: BorrowListQuery, persona: SchoolPersona | undefined): BorrowListQuery {
  if (persona === "student") return { ...query, borrowerId: "" };
  return query;
}

export function borrowListSearch(query: BorrowListQuery): string {
  const params = new URLSearchParams();
  if (query.borrowerId) params.set("borrowerId", query.borrowerId);
  if (query.bookId) params.set("bookId", query.bookId);
  if (query.status) params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}
