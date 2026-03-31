'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { LibrarySchedule, Announcement, LoanRecord, AppData, Student } from '@/lib/types';

// ---------- helpers ----------
function currentFiscalYear(): number {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}
const ADMIN_YEAR_KEY = 'tmc_admin_year';
function getStoredYear(): number {
  if (typeof window === 'undefined') return currentFiscalYear();
  const v = localStorage.getItem(ADMIN_YEAR_KEY);
  return v ? parseInt(v, 10) : currentFiscalYear();
}

function addDaysToDateString(date: string, days: number): string {
  const base = new Date(`${date}T00:00:00`);
  base.setDate(base.getDate() + days);
  return base.toISOString().split('T')[0];
}

// ---------- mappers ----------
function mapSchedule(row: Record<string, unknown>): [string, LibrarySchedule] {
  const s: LibrarySchedule = {
    id: row.id as string,
    date: row.date as string,
    isOpen: row.is_open as boolean,
    openTime: (row.open_time as string) ?? undefined,
    closeTime: (row.close_time as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    academicYear: row.fiscal_year as number,
  };
  return [s.date, s];
}

function mapAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.body as string,
    category: row.category as string,
    isPinned: row.is_pinned as boolean,
    academicYear: row.fiscal_year as number,
    createdAt: row.created_at as string,
  };
}

function mapLoan(row: Record<string, unknown>): LoanRecord {
  const extensionStatus = row.extension_status as 'pending' | 'approved' | 'rejected' | null;
  const requestedNewDueDate = (row.extended_due_date as string | null) ?? addDaysToDateString(row.due_date as string, 14);

  return {
    id: row.id as string,
    bookTitle: row.book_title as string,
    bookAuthor: (row.book_author as string) ?? undefined,
    studentId: row.student_id as string,
    studentName: row.student_name as string,
    loanDate: row.loaned_at as string,
    dueDate: row.due_date as string,
    returnDate: (row.returned_at as string) ?? undefined,
    extensionRequest: extensionStatus
      ? {
          requestedAt: (row.updated_at as string) ?? new Date().toISOString(),
          requestedNewDueDate,
          status: extensionStatus,
          adminNote: (row.extension_comment as string) ?? undefined,
          processedAt: extensionStatus === 'pending' ? undefined : (row.updated_at as string) ?? undefined,
        }
      : undefined,
    academicYear: row.fiscal_year as number,
  };
}

function mapStudent(row: Record<string, unknown>): Student {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    department: row.department as string,
    name: row.name as string,
  };
}

// ---------- context type ----------
interface AppContextValue {
  data: AppData;
  isLoaded: boolean;
  setSchedule: (schedule: Omit<LibrarySchedule, 'id' | 'academicYear'> & { academicYear?: number }) => Promise<void>;
  setSchedulesBulk: (schedules: Array<Omit<LibrarySchedule, 'id' | 'academicYear'> & { academicYear?: number }>) => Promise<void>;
  deleteSchedule: (date: string) => Promise<void>;
  getSchedule: (date: string) => LibrarySchedule | undefined;
  addAnnouncement: (ann: Omit<Announcement, 'id' | 'createdAt' | 'category'> & { academicYear?: number; category?: string }) => Promise<void>;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  addLoan: (loan: Omit<LoanRecord, 'id' | 'extensionRequest' | 'returnDate'> & { academicYear?: number }) => Promise<void>;
  returnLoan: (id: string) => Promise<void>;
  requestExtension: (loanId: string, studentId: string) => Promise<boolean>;
  processExtension: (loanId: string, status: 'approved' | 'rejected', adminNote?: string) => Promise<void>;
  addStudent: (s: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Omit<Student, 'id'>>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  importStudents: (students: Omit<Student, 'id'>[]) => Promise<{ inserted: number; updated: number }>;
  getStudentByStudentId: (studentId: string) => Student | undefined;
  setAdminAcademicYear: (year: number) => void;
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const currentYear = currentFiscalYear();

  const [data, setData] = useState<AppData>({
    schedules: {},
    announcements: [],
    loans: [],
    students: [],
    adminAcademicYear: currentYear,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // ---------- fetchers ----------
  const fetchSchedules = useCallback(async (year: number): Promise<Record<string, LibrarySchedule>> => {
    const { data: rows } = await supabase
      .from('library_schedules')
      .select('*')
      .eq('fiscal_year', year);
    if (!rows) return {};
    return Object.fromEntries(rows.map(r => mapSchedule(r as Record<string, unknown>)));
  }, [supabase]);

  const fetchAnnouncements = useCallback(async (year: number): Promise<Announcement[]> => {
    const { data: rows } = await supabase
      .from('announcements')
      .select('*')
      .eq('fiscal_year', year)
      .order('created_at', { ascending: false });
    if (!rows) return [];
    return rows.map(r => mapAnnouncement(r as Record<string, unknown>));
  }, [supabase]);

  const fetchLoans = useCallback(async (year: number): Promise<LoanRecord[]> => {
    const { data: rows } = await supabase
      .from('loans')
      .select('*')
      .eq('fiscal_year', year)
      .order('loaned_at', { ascending: false });
    if (!rows) return [];
    return rows.map(r => mapLoan(r as Record<string, unknown>));
  }, [supabase]);

  const fetchStudents = useCallback(async (): Promise<Student[]> => {
    const { data: rows } = await supabase
      .from('students')
      .select('*')
      .order('student_id', { ascending: true });
    if (!rows) return [];
    return rows.map(r => mapStudent(r as Record<string, unknown>));
  }, [supabase]);

  const refreshAll = useCallback(async () => {
    const year = getStoredYear();
    const [schedules, announcements, loans, students] = await Promise.all([
      fetchSchedules(year),
      fetchAnnouncements(year),
      fetchLoans(year),
      fetchStudents(),
    ]);
    setData({ schedules, announcements, loans, students, adminAcademicYear: year });
    setIsLoaded(true);
  }, [fetchSchedules, fetchAnnouncements, fetchLoans, fetchStudents]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // ---------- schedules ----------
  const setSchedule = useCallback(async (schedule: Omit<LibrarySchedule, 'id' | 'academicYear'> & { academicYear?: number }) => {
    const row = {
      date: schedule.date,
      is_open: schedule.isOpen,
      open_time: schedule.openTime ?? null,
      close_time: schedule.closeTime ?? null,
      note: schedule.note ?? null,
      fiscal_year: schedule.academicYear ?? data.adminAcademicYear,
    };
    const { data: upserted } = await supabase
      .from('library_schedules')
      .upsert(row, { onConflict: 'date' })
      .select()
      .single();
    if (upserted) {
      const [date, s] = mapSchedule(upserted as Record<string, unknown>);
      setData(prev => ({ ...prev, schedules: { ...prev.schedules, [date]: s } }));
    }
  }, [supabase, data.adminAcademicYear]);

  const setSchedulesBulk = useCallback(async (schedules: Array<Omit<LibrarySchedule, 'id' | 'academicYear'> & { academicYear?: number }>) => {
    const rows = schedules.map(s => ({
      date: s.date,
      is_open: s.isOpen,
      open_time: s.openTime ?? null,
      close_time: s.closeTime ?? null,
      note: s.note ?? null,
      fiscal_year: s.academicYear ?? data.adminAcademicYear,
    }));
    await supabase.from('library_schedules').upsert(rows, { onConflict: 'date' });
    const year = data.adminAcademicYear;
    const fresh = await fetchSchedules(year);
    setData(prev => ({ ...prev, schedules: fresh }));
  }, [supabase, data.adminAcademicYear, fetchSchedules]);

  const deleteSchedule = useCallback(async (date: string) => {
    await supabase.from('library_schedules').delete().eq('date', date);
    setData(prev => {
      const next = { ...prev.schedules };
      delete next[date];
      return { ...prev, schedules: next };
    });
  }, [supabase]);

  const getSchedule = useCallback(
    (date: string) => data.schedules[date],
    [data.schedules],
  );

  // ---------- announcements ----------
  const addAnnouncement = useCallback(async (ann: Omit<Announcement, 'id' | 'createdAt' | 'category'> & { academicYear?: number; category?: string }) => {
    const { data: row } = await supabase
      .from('announcements')
      .insert({
        title: ann.title,
        body: ann.content,
        category: ann.category ?? 'general',
        is_pinned: ann.isPinned,
        fiscal_year: ann.academicYear ?? data.adminAcademicYear,
      })
      .select()
      .single();
    if (row) {
      setData(prev => ({
        ...prev,
        announcements: [mapAnnouncement(row as Record<string, unknown>), ...prev.announcements],
      }));
    }
  }, [supabase, data.adminAcademicYear]);

  const updateAnnouncement = useCallback(async (id: string, updates: Partial<Announcement>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.body = updates.content;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    await supabase.from('announcements').update(dbUpdates).eq('id', id);
    setData(prev => ({
      ...prev,
      announcements: prev.announcements.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  }, [supabase]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    setData(prev => ({
      ...prev,
      announcements: prev.announcements.filter(a => a.id !== id),
    }));
  }, [supabase]);

  // ---------- loans ----------
  const addLoan = useCallback(async (loan: Omit<LoanRecord, 'id' | 'extensionRequest' | 'returnDate'> & { academicYear?: number }) => {
    const { data: row } = await supabase
      .from('loans')
      .insert({
        book_title: loan.bookTitle,
        student_id: loan.studentId,
        student_name: loan.studentName,
        loaned_at: loan.loanDate,
        due_date: loan.dueDate,
        fiscal_year: loan.academicYear ?? data.adminAcademicYear,
      })
      .select()
      .single();
    if (row) {
      setData(prev => ({
        ...prev,
        loans: [{ ...mapLoan(row as Record<string, unknown>), bookAuthor: loan.bookAuthor || undefined }, ...prev.loans],
      }));
    }
  }, [supabase, data.adminAcademicYear]);

  const returnLoan = useCallback(async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('loans').update({ returned_at: today }).eq('id', id);
    setData(prev => ({
      ...prev,
      loans: prev.loans.map(l => l.id === id ? { ...l, returnDate: today } : l),
    }));
  }, [supabase]);

  const requestExtension = useCallback(async (loanId: string, studentId: string): Promise<boolean> => {
    const loan = data.loans.find(l => l.id === loanId);
    if (!loan || loan.studentId !== studentId || loan.extensionRequest?.status === 'pending') return false;
    const requestedNewDueDate = addDaysToDateString(loan.dueDate, 14);
    await supabase
      .from('loans')
      .update({ extension_status: 'pending', extended_due_date: requestedNewDueDate, extension_comment: null })
      .eq('id', loanId);
    setData(prev => ({
      ...prev,
      loans: prev.loans.map(l =>
        l.id === loanId
          ? {
              ...l,
              extensionRequest: {
                requestedAt: new Date().toISOString(),
                requestedNewDueDate,
                status: 'pending',
              },
            }
          : l,
      ),
    }));
    return true;
  }, [supabase, data.loans]);

  const processExtension = useCallback(async (
    loanId: string,
    status: 'approved' | 'rejected',
    adminNote?: string,
  ) => {
    const loan = data.loans.find(l => l.id === loanId);
    if (!loan) return;
    const updates: Record<string, unknown> = { extension_status: status };
    if (adminNote) updates.extension_comment = adminNote;
    let requestedNewDueDate = loan.extensionRequest?.requestedNewDueDate;
    if (status === 'approved') {
      requestedNewDueDate = requestedNewDueDate ?? addDaysToDateString(loan.dueDate, 14);
      updates.extended_due_date = requestedNewDueDate;
      updates.due_date = requestedNewDueDate;
    }
    await supabase.from('loans').update(updates).eq('id', loanId);
    setData(prev => ({
      ...prev,
      loans: prev.loans.map(l =>
        l.id === loanId
          ? {
              ...l,
              dueDate: status === 'approved' ? (requestedNewDueDate ?? l.dueDate) : l.dueDate,
              extensionRequest: {
                requestedAt: l.extensionRequest?.requestedAt ?? new Date().toISOString(),
                requestedNewDueDate: requestedNewDueDate ?? addDaysToDateString(l.dueDate, 14),
                status,
                adminNote,
                processedAt: new Date().toISOString(),
              },
            }
          : l,
      ),
    }));
  }, [supabase, data.loans]);

  // ---------- students ----------
  const addStudent = useCallback(async (s: Omit<Student, 'id'>) => {
    const { data: row } = await supabase
      .from('students')
      .insert({ student_id: s.studentId, department: s.department, name: s.name })
      .select()
      .single();
    if (row) {
      setData(prev => ({
        ...prev,
        students: [...prev.students, mapStudent(row as Record<string, unknown>)],
      }));
    }
  }, [supabase]);

  const updateStudent = useCallback(async (id: string, updates: Partial<Omit<Student, 'id'>>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.studentId !== undefined) dbUpdates.student_id = updates.studentId;
    if (updates.department !== undefined) dbUpdates.department = updates.department;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    await supabase.from('students').update(dbUpdates).eq('id', id);
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, [supabase]);

  const deleteStudent = useCallback(async (id: string) => {
    await supabase.from('students').delete().eq('id', id);
    setData(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id),
    }));
  }, [supabase]);

  const importStudents = useCallback(async (
    students: Omit<Student, 'id'>[],
  ): Promise<{ inserted: number; updated: number }> => {
    const rows = students.map(s => ({
      student_id: s.studentId,
      department: s.department,
      name: s.name,
    }));
    const { data: upserted } = await supabase
      .from('students')
      .upsert(rows, { onConflict: 'student_id' })
      .select();
    const fresh = await supabase.from('students').select('*').order('student_id');
    const newList = (fresh.data ?? []).map(r => mapStudent(r as Record<string, unknown>));
    setData(prev => ({ ...prev, students: newList }));
    return { inserted: students.length, updated: upserted?.length ?? 0 };
  }, [supabase]);

  const getStudentByStudentId = useCallback(
    (studentId: string) => data.students.find(s => s.studentId === studentId),
    [data.students],
  );

  // ---------- year ----------
  const setAdminAcademicYear = useCallback(async (year: number) => {
    localStorage.setItem(ADMIN_YEAR_KEY, String(year));
    setData(prev => ({ ...prev, adminAcademicYear: year }));
    const [schedules, announcements, loans] = await Promise.all([
      fetchSchedules(year),
      fetchAnnouncements(year),
      fetchLoans(year),
    ]);
    setData(prev => ({ ...prev, schedules, announcements, loans, adminAcademicYear: year }));
  }, [fetchSchedules, fetchAnnouncements, fetchLoans]);

  // ---------- render ----------
  return (
    <AppContext.Provider
      value={{
        data,
        isLoaded,
        setSchedule,
        setSchedulesBulk,
        deleteSchedule,
        getSchedule,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        addLoan,
        returnLoan,
        requestExtension,
        processExtension,
        addStudent,
        updateStudent,
        deleteStudent,
        importStudents,
        getStudentByStudentId,
        setAdminAcademicYear,
        refreshAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
