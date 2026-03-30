'use client';

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pin, PinOff, Pencil, Trash2, Plus, BellRing, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Announcement } from '@/lib/types';

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今日';
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  return `${Math.floor(days / 7)}週間前`;
}

export default function AdminAnnouncements() {
  const { data, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', isPinned: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => {
    setEditingId(null);
    setForm({ title: '', content: '', isPinned: false });
    setDialogOpen(true);
  };

  const openEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    setForm({ title: ann.title, content: ann.content, isPinned: ann.isPinned });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.title.trim()) return;
    if (editingId) {
      updateAnnouncement(editingId, form);
    } else {
      addAnnouncement({ ...form, academicYear: data.adminAcademicYear });
    }
    setDialogOpen(false);
  };

  const sorted = [
    ...data.announcements.filter(a => a.isPinned),
    ...data.announcements.filter(a => !a.isPinned),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">お知らせ管理</h2>
        <Button onClick={openNew} className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          新規作成
        </Button>
      </div>

      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 bg-card rounded-2xl border border-border">
          <BellRing className="w-10 h-10 opacity-30" />
          <p className="text-sm">お知らせはありません</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sorted.map((ann) => (
          <div key={ann.id} className={cn('bg-card rounded-2xl border p-4', ann.isPinned ? 'border-amber-300' : 'border-border')}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {ann.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />}
                  <h3 className={cn('text-sm font-bold leading-snug', ann.isPinned && 'text-amber-700')}>{ann.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ann.content}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5">{timeAgo(ann.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-lg"
                  onClick={() => updateAnnouncement(ann.id, { isPinned: !ann.isPinned })}
                  title={ann.isPinned ? 'ピンを外す' : 'ピン留め'}
                >
                  {ann.isPinned ? <PinOff className="w-4 h-4 text-amber-500" /> : <Pin className="w-4 h-4 text-muted-foreground" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-lg"
                  onClick={() => openEdit(ann)}
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-lg"
                  onClick={() => setDeleteId(ann.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'お知らせを編集' : '新しいお知らせ'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">タイトル</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="例: 新刊入荷のお知らせ" className="h-10" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">内容</label>
              <Textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="お知らせの内容を入力..."
                rows={4}
                className="resize-none"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(f => ({ ...f, isPinned: !f.isPinned }))}
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
                  form.isPinned ? 'bg-amber-500 border-amber-500' : 'border-border'
                )}
              >
                {form.isPinned && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm font-medium">ピン留めする（重要なお知らせ）</span>
            </label>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button className="flex-1" onClick={save} disabled={!form.title.trim()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>削除の確認</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">このお知らせを削除しますか？この操作は元に戻せません。</p>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>キャンセル</Button>
            <Button variant="destructive" className="flex-1" onClick={() => { if (deleteId) { deleteAnnouncement(deleteId); setDeleteId(null); } }}>削除する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
