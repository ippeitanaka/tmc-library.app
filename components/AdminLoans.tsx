'use client';

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { todayString, addDays, toDateString, checkOverdue } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { LoanRecord } from '@/lib/types';

type Filter = 'active' | 'overdue' | 'extension' | 'returned' | 'all';

export default function AdminLoans() {
  const { data, addLoan, returnLoan, processExtension } = useAppContext();
  const [filter, setFilter] = useState<Filter>('active');
  const [search, setSearch] = useState('');
  const [addDialog, setAddDialog] = useState(false);
  const [processDialog, setProcessDialog] = useState<LoanRecord | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [form, setForm] = useState({
    bookTitle: '',
    bookAuthor: '',
    studentId: '',
    studentName: '',
  });

  const today = todayString();

  const loans = data.loans.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.bookTitle.toLowerCase().includes(q) ||
      l.studentId.includes(q) ||
      l.studentName.includes(q);

    if (!matchSearch) return false;

    if (filter === 'active') return !l.returnDate && !checkOverdue(l.dueDate);
    if (filter === 'overdue') return !l.returnDate && checkOverdue(l.dueDate);
    if (filter === 'extension') return !l.returnDate && l.extensionRequest?.status === 'pending';
    if (filter === 'returned') return !!l.returnDate;
    return true;
  });

  const pendingExtensions = data.loans.filter(
    (l) => !l.returnDate && l.extensionRequest?.status === 'pending'
  ).length;
  const overdueCount = data.loans.filter(
    (l) => !l.returnDate && checkOverdue(l.dueDate)
  ).length;
  const activeCount = data.loans.filter(
    (l) => !l.returnDate && !checkOverdue(l.dueDate)
  ).length;

  const handleAddLoan = () => {
    if (!form.bookTitle.trim() || !form.studentId.trim() || !form.studentName.trim()) return;
    const loanDate = today;
    const dueDate = toDateString(addDays(new Date(), 14));
    addLoan({
      bookTitle: form.bookTitle.trim(),
      bookAuthor: form.bookAuthor.trim(),
      studentId: form.studentId.trim(),
      studentName: form.studentName.trim(),
      loanDate,
      dueDate,
      academicYear: data.adminAcademicYear,
    });
    setForm({ bookTitle: '', bookAuthor: '', studentId: '', studentName: '' });
    setAddDialog(false);
  };

  const filters: { id: Filter; label: string; count?: number }[] = [
    { id: 'active', label: '貸出中', count: activeCount },
    { id: 'overdue', label: '延滞', count: overdueCount },
    { id: 'extension', label: '延長申請', count: pendingExtensions },
    { id: 'returned', label: '返却済み' },
    { id: 'all', label: 'すべて' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">貸出管理</h2>
        <Button onClick={() => setAddDialog(true)} className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          貸出登録
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '貸出中', value: activeCount, color: 'text-primary' },
          { label: '延滞', value: overdueCount, color: 'text-destructive' },
          { label: '延長申請', value: pendingExtensions, color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-3 text-center">
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="書名・学籍番号・氏名で検索"
          className="pl-10 h-11"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border',
              filter === f.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/30'
            )}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span className={cn(
                'min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1',
                filter === f.id ? 'bg-white/30 text-white' : f.id === 'overdue' ? 'bg-destructive text-white' : 'bg-accent text-accent-foreground'
              )}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loan list */}
      {loans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 bg-card rounded-2xl border border-border">
          <BookOpen className="w-10 h-10 opacity-30" />
          <p className="text-sm">該当する貸出記録がありません</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {loans.map((loan) => {
            const isOverdue = checkOverdue(loan.dueDate);
            const daysLeft = Math.ceil(
              (new Date(loan.dueDate + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const isPending = loan.extensionRequest?.status === 'pending';

            return (
              <div
                key={loan.id}
                className={cn(
                  'bg-card rounded-2xl border p-4 flex flex-col gap-3',
                  isOverdue && !loan.returnDate ? 'border-destructive/40' : isPending ? 'border-amber-300' : 'border-border'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    loan.returnDate ? 'bg-muted' : isOverdue ? 'bg-destructive/10' : 'bg-primary/10'
                  )}>
                    {loan.returnDate ? (
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    ) : isOverdue ? (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-snug">{loan.bookTitle}</p>
                    {loan.bookAuthor && (
                      <p className="text-xs text-muted-foreground">{loan.bookAuthor}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {loan.studentId} / {loan.studentName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {loan.returnDate ? (
                      <span className="text-xs bg-green-100 text-green-700 font-semibold rounded-full px-2 py-0.5">返却済</span>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">期限</p>
                        <p className={cn('text-sm font-bold', isOverdue ? 'text-destructive' : daysLeft <= 3 ? 'text-amber-600' : 'text-foreground')}>
                          {loan.dueDate}
                        </p>
                        <p className={cn('text-xs font-medium', isOverdue ? 'text-destructive' : daysLeft <= 3 ? 'text-amber-600' : 'text-muted-foreground')}>
                          {isOverdue ? `${Math.abs(daysLeft)}日超過` : daysLeft === 0 ? '本日期限' : `残${daysLeft}日`}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Extension pending */}
                {isPending && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      延長申請あり → {loan.extensionRequest?.requestedNewDueDate}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white h-8 text-xs"
                        onClick={() => { setProcessDialog(loan); setAdminNote(''); }}
                      >
                        <Check className="w-3 h-3 mr-1" /> 承認
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 h-8 text-xs"
                        onClick={() => { setProcessDialog(loan); setAdminNote(''); }}
                      >
                        <X className="w-3 h-3 mr-1" /> 不可
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action */}
                {!loan.returnDate && !isPending && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9 text-xs font-medium"
                    onClick={() => returnLoan(loan.id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-500" />
                    返却処理
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add loan dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              貸出登録
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">書名 *</label>
              <Input value={form.bookTitle} onChange={e => setForm(f => ({ ...f, bookTitle: e.target.value }))} placeholder="例: 東洋医学概論" className="h-10" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">著者（任意）</label>
              <Input value={form.bookAuthor} onChange={e => setForm(f => ({ ...f, bookAuthor: e.target.value }))} placeholder="例: 東洋医療研究会" className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">学籍番号 *</label>
                <Input value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} placeholder="2024001" className="h-10" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">氏名 *</label>
                <Input value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} placeholder="山田 太郎" className="h-10" />
              </div>
            </div>
            <div className="bg-secondary/50 rounded-xl px-3 py-2 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span>貸出日: <strong>{today}</strong>　返却期限: <strong>{toDateString(addDays(new Date(), 14))}</strong></span>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setAddDialog(false)}>キャンセル</Button>
            <Button className="flex-1" onClick={handleAddLoan} disabled={!form.bookTitle.trim() || !form.studentId.trim() || !form.studentName.trim()}>登録</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process extension dialog */}
      <Dialog open={!!processDialog} onOpenChange={() => setProcessDialog(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>延長申請の処理</DialogTitle>
          </DialogHeader>
          {processDialog && (
            <div className="flex flex-col gap-4 py-2">
              <div className="bg-muted rounded-xl p-3 text-sm">
                <p className="font-semibold">{processDialog.bookTitle}</p>
                <p className="text-muted-foreground mt-1">{processDialog.studentId} / {processDialog.studentName}</p>
                <p className="text-primary font-medium mt-1">
                  延長後期限: {processDialog.extensionRequest?.requestedNewDueDate}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">コメント（任意）</label>
                <Input value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="例: 次回は延長不可です" className="h-10" />
              </div>
            </div>
          )}
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => {
                if (processDialog) processExtension(processDialog.id, 'rejected', adminNote);
                setProcessDialog(null);
              }}
            >
              <X className="w-4 h-4 mr-1" /> 不可
            </Button>
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              onClick={() => {
                if (processDialog) processExtension(processDialog.id, 'approved', adminNote);
                setProcessDialog(null);
              }}
            >
              <Check className="w-4 h-4 mr-1" /> 承認する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
