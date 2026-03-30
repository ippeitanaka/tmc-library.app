'use client';

import { useAppContext } from '@/contexts/AppContext';
import { Pin, BellRing, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今日';
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  return `${Math.floor(days / 30)}ヶ月前`;
}

export default function AnnouncementList({ limit }: { limit?: number }) {
  const { data } = useAppContext();
  const [expanded, setExpanded] = useState<string | null>(null);

  const pinned = data.announcements.filter((a) => a.isPinned);
  const unpinned = data.announcements.filter((a) => !a.isPinned);
  const sorted = [...pinned, ...unpinned];
  const displayed = limit ? sorted.slice(0, limit) : sorted;

  if (displayed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <BellRing className="w-10 h-10 opacity-30" />
        <p className="text-sm">お知らせはありません</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {displayed.map((ann) => (
        <div
          key={ann.id}
          className={cn(
            'rounded-xl border bg-card overflow-hidden cursor-pointer transition-shadow hover:shadow-md',
            ann.isPinned ? 'border-amber-300' : 'border-border'
          )}
          onClick={() => setExpanded(expanded === ann.id ? null : ann.id)}
        >
          <div className="flex items-start gap-3 p-4">
            {ann.isPinned && (
              <Pin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0 fill-amber-400" />
            )}
            {!ann.isPinned && (
              <BellRing className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={cn('text-sm font-bold leading-snug', ann.isPinned && 'text-amber-700')}>
                  {ann.title}
                </p>
                <span className="text-xs text-muted-foreground shrink-0">{timeAgo(ann.createdAt)}</span>
              </div>
              {expanded === ann.id && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">
                  {ann.content}
                </p>
              )}
              {expanded !== ann.id && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{ann.content}</p>
              )}
            </div>
            <ChevronRight
              className={cn(
                'w-4 h-4 text-muted-foreground shrink-0 transition-transform',
                expanded === ann.id && 'rotate-90'
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
