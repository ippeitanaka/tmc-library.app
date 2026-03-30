'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import AdminScheduleManager from '@/components/AdminScheduleManager';
import AdminAnnouncements from '@/components/AdminAnnouncements';
import AdminLoans from '@/components/AdminLoans';
import AdminStudentManager from '@/components/AdminStudentManager';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  BellRing,
  BookMarked,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { todayString, checkOverdue } from '@/lib/date-utils';
import { getAcademicYear } from '@/lib/date-utils';

type Tab = 'schedule' | 'announcements' | 'loans' | 'students';

const currentAcYear = getAcademicYear(new Date());
const availableYears = [currentAcYear - 1, currentAcYear, currentAcYear + 1];

export default function AdminView() {
  const { logout } = useAuth();
  const { data, setAdminAcademicYear } = useAppContext();
  const [tab, setTab] = useState<Tab>('schedule');

  const pendingExtensions = data.loans.filter(
    (l) => !l.returnDate && l.extensionRequest?.status === 'pending'
  ).length;
  const overdueCount = data.loans.filter(
    (l) => !l.returnDate && checkOverdue(l.dueDate)
  ).length;
  const activeLoans = data.loans.filter((l) => !l.returnDate).length;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'schedule', label: '開館管理', icon: <Calendar className="w-5 h-5" /> },
    { id: 'announcements', label: 'お知らせ', icon: <BellRing className="w-5 h-5" /> },
    {
      id: 'loans',
      label: '貸出管理',
      icon: <BookMarked className="w-5 h-5" />,
      badge: pendingExtensions + overdueCount,
    },
    { id: 'students', label: '学生管理', icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="miracosta-header text-[#f5f0e5] sticky top-0 z-30">
        <div className="relative max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#c9a227] shadow-md">
              <Image src="/logo.png" alt="BIBLIOTHECA" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[10px] text-[#c9a227] leading-none tracking-widest">ADMIN PANEL</p>
              <p className="text-sm font-bold leading-tight tracking-wide">BIBLIOTHECA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Year selector */}
            <div className="flex items-center gap-1 bg-[#c9a227]/15 border border-[#c9a227]/30 rounded-xl px-2 py-1">
              <button
                onClick={() => {
                  const idx = availableYears.indexOf(data.adminAcademicYear);
                  if (idx > 0) setAdminAcademicYear(availableYears[idx - 1]);
                }}
                className="p-0.5 hover:bg-[#c9a227]/20 rounded-lg transition-colors text-[#c9a227]"
                aria-label="前の年度"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold min-w-[56px] text-center text-[#c9a227]">
                {data.adminAcademicYear}年度
              </span>
              <button
                onClick={() => {
                  const idx = availableYears.indexOf(data.adminAcademicYear);
                  if (idx < availableYears.length - 1) setAdminAcademicYear(availableYears[idx + 1]);
                }}
                className="p-0.5 hover:bg-[#c9a227]/20 rounded-lg transition-colors text-[#c9a227]"
                aria-label="次の年度"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-[#f5f0e5]/80 hover:text-[#f5f0e5] hover:bg-white/10 w-8 h-8"
              aria-label="ログアウト"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Quick stats */}
      {(overdueCount > 0 || pendingExtensions > 0) && (
        <div className="max-w-3xl mx-auto w-full px-4 pt-4">
          <div className="flex flex-col gap-2">
            {overdueCount > 0 && (
              <div
                className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 flex items-center gap-2.5 cursor-pointer"
                onClick={() => setTab('loans')}
              >
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm font-semibold text-destructive">
                  延滞: {overdueCount}冊 — すぐに確認してください
                </p>
              </div>
            )}
            {pendingExtensions > 0 && (
              <div
                className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center gap-2.5 cursor-pointer"
                onClick={() => setTab('loans')}
              >
                <BarChart3 className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm font-semibold text-amber-700">
                  延長申請: {pendingExtensions}件 — 承認待ちがあります
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-5 pb-28">
        {tab === 'schedule' && <AdminScheduleManager />}
        {tab === 'announcements' && <AdminAnnouncements />}
        {tab === 'loans' && <AdminLoans />}
        {tab === 'students' && <AdminStudentManager />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 shadow-lg">
        <div className="max-w-3xl mx-auto grid grid-cols-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex flex-col items-center justify-center py-3.5 gap-1 relative transition-colors',
                tab === t.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                {t.icon}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-1 bg-destructive text-white">
                    {t.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{t.label}</span>
              {tab === t.id && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
