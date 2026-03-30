export type AcademicYear = number; // e.g. 2025 = 2025年度 (Apr 2025 - Mar 2026)

export interface Student {
  id: string;
  studentId: string;   // 学籍番号
  department: string;  // 学科名
  name: string;        // 氏名
}

export interface LibrarySchedule {
  id: string;
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  openTime: string; // HH:MM
  closeTime: string; // HH:MM
  note?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO string
  isPinned: boolean;
  academicYear: AcademicYear;
}

export interface ExtensionRequest {
  requestedAt: string; // ISO string
  requestedNewDueDate: string; // YYYY-MM-DD
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  processedAt?: string;
}

export interface LoanRecord {
  id: string;
  bookTitle: string;
  bookAuthor?: string;
  studentId: string;
  studentName: string;
  loanDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  extensionRequest?: ExtensionRequest;
  academicYear: AcademicYear;
}

export interface AppData {
  schedules: Record<string, LibrarySchedule>; // key: YYYY-MM-DD
  announcements: Announcement[];
  loans: LoanRecord[];
  students: Student[];
  adminAcademicYear: AcademicYear;
}
