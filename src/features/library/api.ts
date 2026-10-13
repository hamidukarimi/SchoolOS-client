import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { normalizeBook, normalizeBookList, normalizeBorrowList } from "./normalize";
import { LIBRARY_PAGE_SIZE } from "./query";
import type {
  BookListQuery,
  BookListResult,
  BookRecord,
  BookWritePayload,
  BorrowListQuery,
  BorrowListResult,
  BorrowPayload,
  ReturnPayload,
} from "./types";

export function bookListKey(query: BookListQuery) {
  return ["library", "books", query] as const;
}

export function bookDetailKey(id: string) {
  return ["library", "books", "detail", id] as const;
}

export function borrowListKey(query: BorrowListQuery) {
  return ["library", "borrows", query] as const;
}

export const libraryInvalidationKey = ["library"] as const;

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchBooks(query: BookListQuery): Promise<BookListResult> {
  const params: Record<string, string | number> = { page: query.page, limit: LIBRARY_PAGE_SIZE };
  if (query.search) params.search = query.search;
  if (query.category) params.category = query.category;
  if (query.status) params.status = query.status;
  const response = await http.get<ApiSuccess<unknown>>("/library/books", { params });
  return normalizeBookList(requireData(response.data.data, "Book list"));
}

export async function fetchBook(id: string): Promise<BookRecord> {
  const response = await http.get<ApiSuccess<unknown>>(`/library/books/${id}`);
  return normalizeBook(requireData(response.data.data, "Book"));
}

export async function createBook(input: BookWritePayload): Promise<{ book: BookRecord; message: string }> {
  const response = await http.post<ApiSuccess<unknown>>("/library/books", input);
  return {
    book: normalizeBook(requireData(response.data.data, "Create book")),
    message: response.data.message ?? "Book created successfully",
  };
}

export async function updateBook(id: string, input: BookWritePayload): Promise<{ book: BookRecord; message: string }> {
  const response = await http.put<ApiSuccess<unknown>>(`/library/books/${id}`, input);
  return {
    book: normalizeBook(requireData(response.data.data, "Book update")),
    message: response.data.message ?? "Book updated successfully",
  };
}

export async function deleteBook(id: string): Promise<string> {
  const response = await http.delete<ApiSuccess<null>>(`/library/books/${id}`);
  return response.data.message ?? "Book deleted successfully";
}

export async function fetchBorrows(query: BorrowListQuery): Promise<BorrowListResult> {
  const params: Record<string, string | number> = { page: query.page, limit: LIBRARY_PAGE_SIZE };
  if (query.borrowerId) params.borrowerId = query.borrowerId;
  if (query.bookId) params.bookId = query.bookId;
  if (query.status) params.status = query.status;
  const response = await http.get<ApiSuccess<unknown>>("/library/borrows", { params });
  return normalizeBorrowList(requireData(response.data.data, "Borrow list"));
}

export async function borrowBook(bookId: string, input: BorrowPayload): Promise<string> {
  const response = await http.post<ApiSuccess<unknown>>(`/library/books/${bookId}/borrow`, input);
  return response.data.message ?? "Book borrowed successfully";
}

export async function returnBook(borrowId: string, input: ReturnPayload): Promise<string> {
  const response = await http.patch<ApiSuccess<unknown>>(`/library/borrows/${borrowId}/return`, input);
  return response.data.message ?? "Book returned successfully";
}
