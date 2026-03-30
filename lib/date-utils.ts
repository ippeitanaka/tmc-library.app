export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateString(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function todayString(): string {
  return toDateString(new Date());
}

export function isToday(str: string): boolean {
  return str === todayString();
}

export function checkOverdue(dueDate: string, returnDate?: string): boolean {
  if (returnDate) return false;
  return dueDate < todayString();
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function getAcademicYear(date: Date = new Date()): number {
  const month = date.getMonth() + 1;
  return month >= 4 ? date.getFullYear() : date.getFullYear() - 1;
}

export function getAcademicYearRange(academicYear: number): { start: string; end: string } {
  return {
    start: `${academicYear}-04-01`,
    end: `${academicYear + 1}-03-31`,
  };
}

export function formatDisplayDate(str: string): string {
  const d = fromDateString(str);
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${dayNames[d.getDay()]}）`;
}

export function formatMonthYear(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}

export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = fromDateString(startDate);
  const end = fromDateString(endDate);
  const current = new Date(start);
  while (current <= end) {
    dates.push(toDateString(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function getDayName(dow: number): string {
  return ['日', '月', '火', '水', '木', '金', '土'][dow];
}

export function isCurrentTimeOpen(openTime: string, closeTime: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}
