'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { todayString, checkOverdue, formatDisplayDate, addDays, toDateString } from '@/lib/date-utils';
import LibraryStatusBanner from '@/components/LibraryStatusBanner';
import LibraryCalendar from '@/components/LibraryCalendar';
import AnnouncementList from '@/components/AnnouncementList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, BookMarked, LogOut, ChevronRight, AlertTriangle, Clock, CheckCircle2, RotateCcw, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

type Tab = 'home' | 'calendar' | 'announcements' | 'loans';

export default function StudentView() {
  const { studentId, logout } = useAuth();
  const { data, requestExtension, getStudentByStudentId } = useAppContext();
  const studentProfile = studentId ? getStudentByStudentId(studentId) : undefined;
  const [tab, setTab] = useState<Tab>('home');
  const [extensionLoanId, setExtensionLoanId] = useState<string | null>(null);
  const [extensionResult, setExtensionResult] = useState<'success' | 'fail' | null>(null);

  const myLoans = data.loans.filter((l) => l.studentId === studentId && !l.returnDate);
  const myReturnedLoans = data.loans.filter((l) => l.studentId === studentId && l.returnDate);
  const overdueLoans = myLoans.filter((l) => checkOverdue(l.dueDate));
  const today = todayString();

  const handleRequestExtension = (loanId: string) => {
    if (!studentId) return;
    const ok = requestExtension(loanId, studentId);
    setExtensionResult(ok ? 'success' : 'fail');
    setExtensionLoanId(null);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'ホーム', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'calendar', label: 'カレンダー', icon: <Calendar className="w-5 h-5" /> },
    { id: 'announcements', label: 'お知らせ', icon: <Bell className="w-5 h-5" />, badge: data.announcements.filter(a => a.isPinned).length },
    { id: 'loans', label: '貸出状況', icon: <BookMarked className="w-5 h-5" />, badge: overdueLoans.length > 0 ? overdueLoans.length : myLoans.length > 0 ? myLoans.length : undefined },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="miracosta-header text-[#f5f0e5] sticky top-0 z-30">
        <div className="relative max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#c9a227] shadow-md">
              <Image src="/logo.png" alt="BIBLIOTHECA" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[10px] text-[#c9a227] leading-none tracking-widest">TOYO MEDICAL</p>
              <p className="text-sm font-bold leading-tight tracking-wide">BIBLIOTHECA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              {studentProfile ? (
                <>
                  <p className="text-xs text-[#c9a227] font-semibold leading-none">{studentProfile.department}</p>
                  <p className="text-sm font-bold leading-snug">{studentProfile.name}</p>
                  <p className="text-[10px] text-[#f5f0e5]/60 font-mono">{studentId}</p>
                </>
              ) : (
                <span className="text-xs bg-[#c9a227]/20 border border-[#c9a227]/40 rounded-full px-3 py-1 text-[#c9a227] font-semibold">{studentId}</span>
              )}
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

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-28">
        {tab === 'home' && (
          <div className="flex flex-col gap-5">
            <LibraryStatusBanner />

            {/* Overdue alert */}
            {overdueLoans.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-destructive">返却期限を過ぎています</p>
                  <p className="text-xs text-destructive/80 mt-0.5">{overdueLoans.length}冊の本が返却期限を超えています。早急にご返却ください。</p>
                </div>
              </div>
            )}

            {/* My loans summary */}
            {myLoans.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-primary" />
                    現在の貸出 ({myLoans.length}冊)
                  </h2>
                  <button
                    onClick={() => setTab('loans')}
                    className="text-xs text-primary font-medium flex items-center gap-1"
                  >
                    詳細 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {myLoans.slice(0, 2).map((loan) => {
                    const isOverdue = checkOverdue(loan.dueDate);
                    const daysLeft = Math.ceil((new Date(loan.dueDate + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={loan.id} className={cn('flex items-center gap-3 p-3 rounded-xl', isOverdue ? 'bg-destructive/10' : 'bg-muted/40')}>
                        <BookOpen className={cn('w-4 h-4 shrink-0', isOverdue ? 'text-destructive' : 'text-primary')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{loan.bookTitle}</p>
                          <p className="text-xs text-muted-foreground">返却期限: {loan.dueDate}</p>
                        </div>
                        <span className={cn('text-xs font-bold shrink-0', isOverdue ? 'text-destructive' : daysLeft <= 3 ? 'text-amber-600' : 'text-primary')}>
                          {isOverdue ? `${Math.abs(daysLeft)}日超過` : `残${daysLeft}日`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Announcements preview */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  お知らせ
                </h2>
                <button
                  onClick={() => setTab('announcements')}
                  className="text-xs text-primary font-medium flex items-center gap-1"
                >
                  全て見る <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <AnnouncementList limit={2} />
            </div>
          </div>
        )}

        {tab === 'calendar' && (
          <div className="flex flex-col gap-4">
            <h1 className="text-lg font-bold text-foreground">開館カレンダー</h1>
            <LibraryCalendar />
          </div>
        )}

        {tab === 'announcements' && (
          <div className="flex flex-col gap-4">
            <h1 className="text-lg font-bold text-foreground">お知らせ</h1>
            <AnnouncementList />
          </div>
        )}

        {tab === 'loans' && (
          <div className="flex flex-col gap-4">
            <h1 className="text-lg font-bold text-foreground">貸出状況</h1>

            {myLoans.length === 0 && myReturnedLoans.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <BookMarked className="w-12 h-12 opacity-30" />
                <p className="text-sm">貸出中の本はありません</p>
              </div>
            )}

            {myLoans.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-muted-foreground">貸出中 ({myLoans.length}冊)</h2>
                {myLoans.map((loan) => {
                  const isOverdue = checkOverdue(loan.dueDate);
                  const daysLeft = Math.ceil((new Date(loan.dueDate + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isPending = loan.extensionRequest?.status === 'pending';
                  const isApproved = loan.extensionRequest?.status === 'approved';
                  const isRejected = loan.extensionRequest?.status === 'rejected';

                  return (
                    <div key={loan.id} className={cn('bg-card rounded-2xl border p-4 flex flex-col gap-3', isOverdue ? 'border-destructive/40' : 'border-border')}>
                      <div className="flex items-start gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', isOverdue ? 'bg-destructive/10' : 'bg-primary/10')}>
                          <BookOpen className={cn('w-5 h-5', isOverdue ? 'text-destructive' : 'text-primary')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-snug">{loan.bookTitle}</p>
                          {loan.bookAuthor && <p className="text-xs text-muted-foreground">{loan.bookAuthor}</p>}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" /> 貸出日: {loan.loanDate}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">返却期限</p>
                          <p className={cn('text-sm font-bold', isOverdue ? 'text-destructive' : daysLeft <= 3 ? 'text-amber-600' : 'text-primary')}>
                            {loan.dueDate}
                          </p>
                          <p className={cn('text-xs font-medium', isOverdue ? 'text-destructive' : daysLeft <= 3 ? 'text-amber-600' : 'text-primary')}>
                            {isOverdue ? `${Math.abs(daysLeft)}日超過` : daysLeft === 0 ? '本日期限' : `残${daysLeft}日`}
                          </p>
                        </div>
                      </div>

                      {/* Extension status */}
                      {isPending && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
                          <RotateCcw className="w-4 h-4 text-amber-600" />
                          <p className="text-xs text-amber-700 font-medium">延長申請中（回答をお待ちください）</p>
                        </div>
                      )}
                      {isApproved && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <p className="text-xs text-green-700 font-medium">延長が承認されました</p>
                        </div>
                      )}
                      {isRejected && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <div>
                            <p className="text-xs text-red-700 font-medium">延長は不可となりました</p>
                            {loan.extensionRequest?.adminNote && (
                              <p className="text-xs text-red-600 mt-0.5">{loan.extensionRequest.adminNote}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Extension button */}
                      {!isPending && !isApproved && (
                        <Button
                          variant="outline"
                          className="w-full h-10 text-sm font-medium"
                          onClick={() => setExtensionLoanId(loan.id)}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          貸出延長を申請する
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {myReturnedLoans.length > 0 && (
              <div className="flex flex-col gap-3 mt-2">
                <h2 className="text-sm font-semibold text-muted-foreground">返却済み ({myReturnedLoans.length}冊)</h2>
                {myReturnedLoans.map((loan) => (
                  <div key={loan.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 opacity-60">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{loan.bookTitle}</p>
                      <p className="text-xs text-muted-foreground">返却日: {loan.returnDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 shadow-lg">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex flex-col items-center justify-center py-3 gap-1 relative transition-colors',
                tab === t.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                {t.icon}
                {t.badge !== undefined && (
                  <span className={cn(
                    'absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-1',
                    overdueLoans.length > 0 && t.id === 'loans' ? 'bg-destructive text-white' : 'bg-accent text-accent-foreground'
                  )}>
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

      {/* Extension Dialog */}
      <Dialog open={!!extensionLoanId} onOpenChange={() => setExtensionLoanId(null)}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>貸出延長申請</DialogTitle>
          </DialogHeader>
          {extensionLoanId && (() => {
            const loan = data.loans.find(l => l.id === extensionLoanId);
            if (!loan) return null;
            const newDue = toDateString(addDays(new Date(loan.dueDate + 'T00:00:00'), 14));
            return (
              <div className="flex flex-col gap-4 py-2">
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-sm font-semibold">{loan.bookTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">現在の返却期限: {loan.dueDate}</p>
                  <p className="text-xs text-primary font-medium mt-0.5">延長後の期限: {newDue}</p>
                </div>
                <p className="text-sm text-muted-foreground">2週間の延長申請を送信します。管理者が確認後、結果をお知らせします。</p>
              </div>
            );
          })()}
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setExtensionLoanId(null)}>キャンセル</Button>
            <Button className="flex-1" onClick={() => extensionLoanId && handleRequestExtension(extensionLoanId)}>申請する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={!!extensionResult} onOpenChange={() => setExtensionResult(null)}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>{extensionResult === 'success' ? '申請完了' : 'エラー'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            {extensionResult === 'success'
              ? '延長申請を送信しました。管理者の確認をお待ちください。'
              : '申請に失敗しました。既に申請済みの場合はご確認ください。'}
          </p>
          <DialogFooter>
            <Button className="w-full" onClick={() => setExtensionResult(null)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
