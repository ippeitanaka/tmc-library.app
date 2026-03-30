import type { AppData, LibrarySchedule, Announcement, LoanRecord } from './types';
import { toDateString, addDays, getAcademicYear } from './date-utils';

const STORAGE_KEY = 'toyo_library_data';

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateSeedData(): AppData {
  const today = new Date();
  const currentYear = getAcademicYear(today);

  const schedules: Record<string, LibrarySchedule> = {};

  for (let i = -21; i <= 90; i++) {
    const d = addDays(today, i);
    const dateStr = toDateString(d);
    const dow = d.getDay();

    if (dow === 0) {
      schedules[dateStr] = {
        id: generateId(),
        date: dateStr,
        isOpen: false,
        openTime: '',
        closeTime: '',
        note: '日曜日休館',
      };
    } else if (dow === 6) {
      schedules[dateStr] = {
        id: generateId(),
        date: dateStr,
        isOpen: true,
        openTime: '09:00',
        closeTime: '12:30',
      };
    } else {
      schedules[dateStr] = {
        id: generateId(),
        date: dateStr,
        isOpen: true,
        openTime: '09:00',
        closeTime: '17:00',
      };
    }
  }

  // Special closed days
  const specialDates = [
    toDateString(addDays(today, 5)),
    toDateString(addDays(today, 12)),
  ];
  for (const date of specialDates) {
    if (schedules[date]) {
      schedules[date] = { ...schedules[date], isOpen: false, note: '行事のため休館' };
    }
  }

  const announcements: Announcement[] = [
    {
      id: generateId(),
      title: '新刊入荷のお知らせ',
      content:
        '東洋医学・鍼灸関連の新刊が多数入荷しました。「最新鍼灸臨床マニュアル 改訂版」「東洋医学概論 第3版」「経絡経穴概論」などが新たに貸し出し可能です。ぜひご利用ください。',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isPinned: true,
      academicYear: currentYear,
    },
    {
      id: generateId(),
      title: '春季休業中の図書室利用について',
      content:
        '春季休業期間中の図書室開館スケジュールをご確認ください。一部日程で開館時間が変更となります。カレンダーでご確認ください。',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isPinned: false,
      academicYear: currentYear,
    },
    {
      id: generateId(),
      title: '図書室利用マナーについてのお願い',
      content:
        '図書室内では静粛にお過ごしください。飲食はお断りしております。また、貸し出し期間（2週間）を守り、返却期限を過ぎないようご注意ください。',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      isPinned: false,
      academicYear: currentYear,
    },
  ];

  const loans: LoanRecord[] = [
    {
      id: generateId(),
      bookTitle: '東洋医学概論',
      bookAuthor: '教科書研究会',
      studentId: '2024001',
      studentName: '山田 太郎',
      loanDate: toDateString(addDays(today, -10)),
      dueDate: toDateString(addDays(today, 4)),
      academicYear: currentYear,
    },
    {
      id: generateId(),
      bookTitle: '鍼灸臨床医学',
      bookAuthor: '東洋医療研究会',
      studentId: '2024001',
      studentName: '山田 太郎',
      loanDate: toDateString(addDays(today, -8)),
      dueDate: toDateString(addDays(today, 6)),
      academicYear: currentYear,
    },
    {
      id: generateId(),
      bookTitle: '解剖学テキスト',
      bookAuthor: '解剖学会',
      studentId: '2024042',
      studentName: '鈴木 花子',
      loanDate: toDateString(addDays(today, -20)),
      dueDate: toDateString(addDays(today, -6)),
      academicYear: currentYear,
    },
  ];

  return { schedules, announcements, loans, adminAcademicYear: currentYear };
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return generateSeedData();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const data = generateSeedData();
    saveData(data);
    return data;
  }
  try {
    return JSON.parse(raw) as AppData;
  } catch {
    const data = generateSeedData();
    saveData(data);
    return data;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
