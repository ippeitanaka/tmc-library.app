'use client';

import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { todayString, isCurrentTimeOpen } from '@/lib/date-utils';
import { BookOpen, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LibraryStatusBanner() {
  const { data } = useAppContext();
  const today = todayString();
  const schedule = data.schedules[today];

  const isOpen =
    schedule?.isOpen &&
    schedule.openTime &&
    schedule.closeTime &&
    isCurrentTimeOpen(schedule.openTime, schedule.closeTime);

  const willOpenToday =
    schedule?.isOpen &&
    schedule.openTime &&
    schedule.closeTime &&
    !isCurrentTimeOpen(schedule.openTime, schedule.closeTime) &&
    new Date().getHours() * 60 + new Date().getMinutes() <
      parseInt(schedule.openTime.split(':')[0]) * 60 + parseInt(schedule.openTime.split(':')[1]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-lg',
        isOpen
          ? 'bg-[oklch(0.48_0.14_145)]'
          : schedule?.isOpen
          ? 'bg-[oklch(0.52_0.12_200)]'
          : 'bg-[oklch(0.42_0.08_230)]'
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <BookOpen className="absolute -right-4 -top-4 w-40 h-40" strokeWidth={0.5} />
      </div>

      <div className="relative flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {isOpen ? (
            <CheckCircle2 className="w-8 h-8 shrink-0" />
          ) : (
            <XCircle className="w-8 h-8 shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium opacity-80">現在の開館状況</p>
            <p className="text-3xl font-bold tracking-tight">
              {isOpen ? '開館中' : schedule?.isOpen && willOpenToday ? '開館前' : schedule?.isOpen ? '閉館済み' : '本日休館'}
            </p>
          </div>
        </div>

        {schedule?.isOpen && schedule.openTime && schedule.closeTime && (
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 w-fit">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold">
              本日の開館時間: {schedule.openTime} ～ {schedule.closeTime}
            </span>
          </div>
        )}

        {schedule?.note && (
          <p className="text-sm opacity-80 mt-1">{schedule.note}</p>
        )}

        {!schedule && (
          <p className="text-sm opacity-80">本日のスケジュールは未登録です。</p>
        )}
      </div>
    </div>
  );
}
