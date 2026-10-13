export const BOOK_STATUSES = ["available", "unavailable"] as const;
export const BORROW_STATUSES = ["borrowed", "returned", "overdue"] as const;
export const BORROWER_TYPES = ["student", "teacher"] as const;

export type BookStatus = (typeof BOOK_STATUSES)[number];
export type BorrowStatus = (typeof BORROW_STATUSES)[number];
export type BorrowerType = (typeof BORROWER_TYPES)[number];

export interface BookRecord {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  description: string;
  publishedYear: number | null;
  status: BookStatus;
}

export interface BookListResult {
  books: BookRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface BookListQuery {
  search: string;
  category: string;
  status: BookStatus | "";
  page: number;
}

export interface BookWritePayload {
  title: string;
  author: string;
  isbn?: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  description?: string;
  publishedYear?: number;
  status?: BookStatus;
}

export interface BorrowerRef {
  id: string;
  firstName: string;
  lastName: string;
  code: string;
}

export interface BorrowBookRef {
  id: string;
  title: string;
  author: string;
  isbn: string;
}

export interface BorrowRecord {
  id: string;
  book: BorrowBookRef | null;
  borrower: BorrowerRef | null;
  borrowerType: BorrowerType;
  borrowDate: string;
  dueDate: string;
  returnDate: string;
  status: BorrowStatus;
}

export interface BorrowListResult {
  borrows: BorrowRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface BorrowListQuery {
  borrowerId: string;
  bookId: string;
  status: BorrowStatus | "";
  page: number;
}

export interface BorrowPayload {
  borrowerId: string;
  borrowerType: BorrowerType;
  dueDate: string;
}

export interface ReturnPayload {
  returnDate?: string;
}
