'use client';

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  toDateString,
  fromDateString,
  getDaysInMonth,
  getFirstDayOfWeek,
  formatMonthYear,
  generateDateRange,
  getDayName,
  todayString,
} from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Settings2, Calendar, Check, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { LibrarySchedule } from '@/lib/types';

interface DayForm {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  note: string;
}

type BulkMode = 'weekday' | 'weekdayRange' | null;

export default function AdminScheduleManager() {
  const { data, setSchedule, setSchedulesBulk, deleteSchedule } = useAppContext();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [form, setForm] = useState<DayForm>({ isOpen: true, openTime: '09:00', closeTime: '17:00', note: '' });
  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    startDate: '',
    endDate: '',
    skipSunday: true,
    skipSaturday: false,
    isOpen: true,
    openTime: '09:00',
    closeTime: '17:00',
    note: '',
  });
  const [bulkCount, setBulkCount] = useState(0);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const todayStr = todayString();

  const openDayEditor = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existing = data.schedules[dateStr];
    if (existing) {
      setForm({ isOpen: existing.isOpen, openTime: existing.openTime || '09:00', closeTime: existing.closeTime || '17:00', note: existing.note || '' });
    } else {
      const dow = fromDateString(dateStr).getDay();
      setForm({ isOpen: dow !== 0, openTime: '09:00', closeTime: dow === 6 ? '12:30' : '17:00', note: '' });
    }
  };

  const saveDay = () => {
    if (!selectedDate) return;
    setSchedule({ date: selectedDate, isOpen: form.isOpen, openTime: form.isOpen ? form.openTime : '', closeTime: form.isOpen ? form.closeTime : '', note: form.note });
    setSelectedDate(null);
  };

  const deleteDay = () => {
    if (!selectedDate) return;
    deleteSchedule(selectedDate);
    setSelectedDate(null);
  };

  const previewBulk = () => {
    if (!bulkForm.startDate || !bulkForm.endDate) return 0;
    const dates = generateDateRange(bulkForm.startDate, bulkForm.endDate);
    return dates.filter(d => {
      const dow = fromDateString(d).getDay();
      if (bulkForm.skipSunday && dow === 0) return false;
      if (bulkForm.skipSaturday && dow === 6) return false;
      return true;
    }).length;
  };

  const executeBulk = () => {
    if (!bulkForm.startDate || !bulkForm.endDate) return;
    const dates = generateDateRange(bulkForm.startDate, bulkForm.endDate);
    const filtered = dates.filter(d => {
      const dow = fromDateString(d).getDay();
      if (bulkForm.skipSunday && dow === 0) return false;
      if (bulkForm.skipSaturday && dow === 6) return false;
      return true;
    });
    const schedules = filtered.map(d => ({
      date: d,
      isOpen: bulkForm.isOpen,
      openTime: bulkForm.isOpen ? bulkForm.openTime : '',
      closeTime: bulkForm.isOpen ? bulkForm.closeTime : '',
      note: bulkForm.note,
    }));
    setSchedulesBulk(schedules);
    setBulkCount(filtered.length);
    setBulkDialog(false);
  };

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-base font-bold w-28 text-center">{formatMonthYear(year, month)}</h2>
          <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={() => { setBulkDialog(true); setBulkCount(0); }} className="gap-2 rounded-xl">
          <Zap className="w-4 h-4" />
          一括入力
        </Button>
      </div>

      {bulkCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-green-700">
          <Check className="w-4 h-4" />
          {bulkCount}件のスケジュールを登録しました
        </div>
      )}

      {/* Calendar */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-border">
          {dayNames.map((d, i) => (
            <div key={d} className={cn('text-center py-2 text-xs font-bold', i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground')}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e-${i}`} className="min-h-[70px] border-b border-r border-border/30 bg-muted/20" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dow = (firstDow + i) % 7;
            const dateStr = toDateString(new Date(year, month, day));
            const schedule = data.schedules[dateStr];
            const isToday = dateStr === todayStr;

            return (
              <button
                key={day}
                onClick={() => openDayEditor(dateStr)}
                className={cn(
                  'min-h-[70px] border-b border-r border-border/30 p-1.5 text-left flex flex-col gap-0.5 hover:bg-secondary/50 transition-colors group',
                  isToday && 'bg-secondary/30',
                )}
              >
                <span className={cn(
                  'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                  isToday && 'bg-primary text-primary-foreground',
                  !isToday && dow === 0 && 'text-red-500',
                  !isToday && dow === 6 && 'text-blue-500',
                )}>
                  {day}
                </span>
                {schedule ? (
                  schedule.isOpen ? (
                    <div className="flex flex-col gap-0.5 w-full">
                      <span className="text-[9px] bg-green-100 text-green-700 font-bold rounded px-1 py-0.5 text-center">開館</span>
                      {schedule.openTime && (
                        <span className="text-[8px] text-muted-foreground text-center leading-tight">{schedule.openTime}–{schedule.closeTime}</span>
                      )}
                      {schedule.note && (
                        <span className="text-[8px] text-amber-700 text-center leading-tight truncate" title={schedule.note}>
                          担当: {schedule.note}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[9px] bg-red-100 text-red-600 font-bold rounded px-1 py-0.5 text-center">休館</span>
                  )
                ) : (
                  <span className="text-[9px] text-muted-foreground/40 group-hover:text-primary/50 text-center">+ 追加</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day editor dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              {selectedDate && (() => {
                const d = fromDateString(selectedDate);
                return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${getDayName(d.getDay())}）`;
              })()}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {/* Open / Closed toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setForm(f => ({ ...f, isOpen: true }))}
                className={cn(
                  'rounded-xl py-3 text-sm font-bold border-2 transition-colors',
                  form.isOpen ? 'bg-green-500 text-white border-green-500' : 'bg-white text-muted-foreground border-border hover:border-green-300'
                )}
              >
                開館
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, isOpen: false }))}
                className={cn(
                  'rounded-xl py-3 text-sm font-bold border-2 transition-colors',
                  !form.isOpen ? 'bg-red-500 text-white border-red-500' : 'bg-white text-muted-foreground border-border hover:border-red-300'
                )}
              >
                休館
              </button>
            </div>

            {form.isOpen && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">開館時間</label>
                  <Input type="time" value={form.openTime} onChange={e => setForm(f => ({ ...f, openTime: e.target.value }))} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">閉館時間</label>
                  <Input type="time" value={form.closeTime} onChange={e => setForm(f => ({ ...f, closeTime: e.target.value }))} className="h-10" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">メモ（任意）</label>
              <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="例: 試験期間のため変更" className="h-10" />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            {data.schedules[selectedDate ?? ''] && (
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={deleteDay}>
                削除
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={() => setSelectedDate(null)}>キャンセル</Button>
            <Button className="flex-1" onClick={saveDay}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk dialog */}
      <Dialog open={bulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              スケジュール一括入力
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">開始日</label>
                <Input type="date" value={bulkForm.startDate} onChange={e => setBulkForm(f => ({ ...f, startDate: e.target.value }))} className="h-10" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">終了日</label>
                <Input type="date" value={bulkForm.endDate} onChange={e => setBulkForm(f => ({ ...f, endDate: e.target.value }))} className="h-10" />
              </div>
            </div>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={bulkForm.skipSunday} onChange={e => setBulkForm(f => ({ ...f, skipSunday: e.target.checked }))} className="rounded" />
                日曜除外
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={bulkForm.skipSaturday} onChange={e => setBulkForm(f => ({ ...f, skipSaturday: e.target.checked }))} className="rounded" />
                土曜除外
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBulkForm(f => ({ ...f, isOpen: true }))}
                className={cn('rounded-xl py-2.5 text-sm font-bold border-2 transition-colors', bulkForm.isOpen ? 'bg-green-500 text-white border-green-500' : 'bg-white text-muted-foreground border-border')}
              >開館</button>
              <button
                onClick={() => setBulkForm(f => ({ ...f, isOpen: false }))}
                className={cn('rounded-xl py-2.5 text-sm font-bold border-2 transition-colors', !bulkForm.isOpen ? 'bg-red-500 text-white border-red-500' : 'bg-white text-muted-foreground border-border')}
              >休館</button>
            </div>
            {bulkForm.isOpen && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">開館時間</label>
                  <Input type="time" value={bulkForm.openTime} onChange={e => setBulkForm(f => ({ ...f, openTime: e.target.value }))} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">閉館時間</label>
                  <Input type="time" value={bulkForm.closeTime} onChange={e => setBulkForm(f => ({ ...f, closeTime: e.target.value }))} className="h-10" />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">メモ（任意）</label>
              <Input value={bulkForm.note} onChange={e => setBulkForm(f => ({ ...f, note: e.target.value }))} placeholder="例: 春学期通常開館" className="h-10" />
            </div>
            {bulkForm.startDate && bulkForm.endDate && (
              <div className="bg-secondary/50 rounded-xl px-3 py-2 text-sm font-medium text-primary">
                対象: {previewBulk()}日間
              </div>
            )}
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setBulkDialog(false)}>キャンセル</Button>
            <Button className="flex-1" onClick={executeBulk} disabled={!bulkForm.startDate || !bulkForm.endDate}>登録する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
