'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  getDaysInMonth,
  getFirstDayOfWeek,
  formatMonthYear,
  toDateString,
  todayString,
  isCurrentTimeOpen,
} from '@/lib/date-utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function LibraryCalendar() {
  const { data } = useAppContext();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const todayStr = todayString();

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-[#5a3e2b] to-[#4a3222] text-[#f5f0e5] border-b-2 border-[#c9a227]">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevMonth}
          className="text-[#f5f0e5] hover:bg-white/15 rounded-xl"
          aria-label="前の月"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold tracking-wide">{formatMonthYear(year, month)}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          className="text-[#f5f0e5] hover:bg-white/15 rounded-xl"
          aria-label="次の月"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {dayNames.map((d, i) => (
          <div
            key={d}
            className={cn(
              'text-center py-2 text-xs font-bold',
              i === 0 ? 'text-[oklch(0.58_0.22_27)]' : i === 6 ? 'text-[oklch(0.38_0.082_212)]' : 'text-muted-foreground'
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Empty cells */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} className="border-b border-r border-border/40 min-h-[72px] md:min-h-[88px] bg-muted/30" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dow = (firstDow + i) % 7;
          const dateStr = toDateString(new Date(year, month, day));
          const schedule = data.schedules[dateStr];
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;

          return (
            <div
              key={day}
              className={cn(
                'border-b border-r border-border/40 min-h-[72px] md:min-h-[88px] p-1.5 flex flex-col gap-1 transition-colors',
                isToday && 'bg-secondary/60',
                isPast && !isToday && 'bg-muted/20',
                dow === 0 && 'bg-red-50/40',
                dow === 6 && 'bg-blue-50/40',
              )}
            >
              {/* Day number */}
              <div className="flex justify-end">
                <span
                  className={cn(
                    'text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full',
                    isToday && 'bg-primary text-primary-foreground',
                    !isToday && dow === 0 && 'text-[oklch(0.58_0.22_27)]',
                    !isToday && dow === 6 && 'text-[oklch(0.38_0.082_212)]',
                    !isToday && dow !== 0 && dow !== 6 && 'text-foreground',
                    isPast && !isToday && 'opacity-40',
                  )}
                >
                  {day}
                </span>
              </div>

              {/* Status badge */}
              {schedule ? (
                schedule.isOpen ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="bg-[oklch(0.54_0.15_145)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md text-center leading-tight">
                      開館
                    </span>
                    {schedule.openTime && schedule.closeTime && (
                      <span className="text-[9px] text-muted-foreground text-center leading-tight font-medium">
                        {schedule.openTime}–{schedule.closeTime}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <span className="bg-[oklch(0.58_0.22_27)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md text-center leading-tight">
                      休館
                    </span>
                  </div>
                )
              ) : (
                <span className="text-[9px] text-muted-foreground/50 text-center">–</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-border bg-muted/30">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm bg-[oklch(0.54_0.15_145)] inline-block" />
          <span className="text-xs text-muted-foreground">開館</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm bg-[oklch(0.58_0.22_27)] inline-block" />
          <span className="text-xs text-muted-foreground">休館</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-primary inline-block" />
          <span className="text-xs text-muted-foreground">今日</span>
        </div>
      </div>
    </div>
  );
}
