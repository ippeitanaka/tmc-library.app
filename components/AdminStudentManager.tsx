'use client';

import { useState, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Student } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type EditForm = { studentId: string; department: string; name: string };
const EMPTY_FORM: EditForm = { studentId: '', department: '', name: '' };

export default function AdminStudentManager() {
  const { data, addStudent, updateStudent, deleteStudent, importStudents } = useAppContext();
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const [importResult, setImportResult] = useState<{ inserted: number; updated: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = data.students.filter(s =>
    s.studentId.includes(search) ||
    s.name.includes(search) ||
    s.department.includes(search)
  );

  // ---- CSV Export ----
  const handleExport = () => {
    const header = '学科名,学籍番号,氏名';
    const rows = data.students.map(s =>
      `${s.department},${s.studentId},${s.name}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- CSV Template Download ----
  const handleTemplateDownload = () => {
    const csv = '学科名,学籍番号,氏名\n鍼灸学科,2320001,山田 太郎\n柔道整復学科,2320002,鈴木 花子';
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- CSV Import ----
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = (ev.target?.result as string).replace(/^\uFEFF/, ''); // BOM除去
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) { setImportError('データが見つかりません'); return; }
        const dataLines = lines.slice(1); // ヘッダー除く
        const parsed: Omit<Student, 'id'>[] = [];
        for (const line of dataLines) {
          const cols = line.split(',');
          if (cols.length < 3) continue;
          const [department, studentId, name] = cols.map(c => c.trim());
          if (!department || !studentId || !name) continue;
          parsed.push({ department, studentId, name });
        }
        if (parsed.length === 0) { setImportError('有効なデータが見つかりませんでした'); return; }
        setLoading(true);
        const result = await importStudents(parsed);
        setImportResult(result);
        setImportError(null);
      } catch {
        setImportError('ファイルの読み込みに失敗しました');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // ---- Add ----
  const handleAdd = async () => {
    if (!form.studentId.trim() || !form.department.trim() || !form.name.trim()) return;
    setLoading(true);
    await addStudent({ studentId: form.studentId.trim(), department: form.department.trim(), name: form.name.trim() });
    setLoading(false);
    setAddOpen(false);
    setForm(EMPTY_FORM);
  };

  // ---- Edit ----
  const openEdit = (s: Student) => {
    setEditTarget(s);
    setForm({ studentId: s.studentId, department: s.department, name: s.name });
  };
  const handleEdit = async () => {
    if (!editTarget) return;
    setLoading(true);
    await updateStudent(editTarget.id, { studentId: form.studentId.trim(), department: form.department.trim(), name: form.name.trim() });
    setLoading(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  // ---- Delete ----
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    await deleteStudent(deleteTarget.id);
    setLoading(false);
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            学生管理
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{data.students.length}名登録済み</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleTemplateDownload} className="text-xs gap-1.5 h-9">
            <Download className="w-3.5 h-3.5" />
            CSVテンプレート
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="text-xs gap-1.5 h-9" disabled={data.students.length === 0}>
            <Download className="w-3.5 h-3.5" />
            エクスポート
          </Button>
          <label>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-9 cursor-pointer" asChild>
              <span>
                <Upload className="w-3.5 h-3.5" />
                CSVインポート
              </span>
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
          </label>
          <Button size="sm" className="btn-miracosta text-xs gap-1.5 h-9" onClick={() => { setAddOpen(true); setForm(EMPTY_FORM); }}>
            <Plus className="w-3.5 h-3.5" />
            学生追加
          </Button>
        </div>
      </div>

      {/* Import result */}
      {importResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-700 font-medium">
              インポート完了: {importResult.inserted}件処理しました
            </p>
          </div>
          <button onClick={() => setImportResult(null)}><X className="w-4 h-4 text-green-600" /></button>
        </div>
      )}
      {importError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <p className="text-sm text-destructive font-medium">{importError}</p>
          </div>
          <button onClick={() => setImportError(null)}><X className="w-4 h-4 text-destructive" /></button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="学籍番号・氏名・学科で検索"
          className="pl-9 h-11"
        />
        {search && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Users className="w-12 h-12 opacity-20" />
          <p className="text-sm">{search ? '該当する学生が見つかりません' : '学生が登録されていません'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Column header */}
          <div className="grid grid-cols-[1fr_1.5fr_1.5fr_auto] gap-2 px-3 py-1.5 bg-muted/60 rounded-lg text-xs font-semibold text-muted-foreground">
            <span>学籍番号</span>
            <span>氏名</span>
            <span>学科名</span>
            <span></span>
          </div>
          {filtered.map(s => (
            <div
              key={s.id}
              className="grid grid-cols-[1fr_1.5fr_1.5fr_auto] gap-2 items-center px-3 py-3 bg-card border border-border rounded-xl"
            >
              <span className="text-sm font-mono font-medium text-primary">{s.studentId}</span>
              <span className="text-sm font-medium truncate">{s.name}</span>
              <span className="text-xs text-muted-foreground truncate">{s.department}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(s)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(s)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setForm(EMPTY_FORM); }}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>学生を追加</DialogTitle>
          </DialogHeader>
          <StudentForm form={form} onChange={setForm} />
          <DialogFooter className="flex-row gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>キャンセル</Button>
            <Button className="flex-1 btn-miracosta" onClick={handleAdd} disabled={loading || !form.studentId || !form.name || !form.department}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={v => { if (!v) { setEditTarget(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>学生情報を編集</DialogTitle>
          </DialogHeader>
          <StudentForm form={form} onChange={setForm} />
          <DialogFooter className="flex-row gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>キャンセル</Button>
            <Button className="flex-1 btn-miracosta" onClick={handleEdit} disabled={loading || !form.studentId || !form.name || !form.department}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>学生を削除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            <span className="font-semibold text-foreground">{deleteTarget?.name}</span>（{deleteTarget?.studentId}）を削除しますか？この操作は元に戻せません。
          </p>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={loading}>削除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudentForm({ form, onChange }: { form: EditForm; onChange: (f: EditForm) => void }) {
  return (
    <div className="flex flex-col gap-3 py-1">
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">学籍番号 <span className="text-destructive">*</span></label>
        <Input
          value={form.studentId}
          onChange={e => onChange({ ...form, studentId: e.target.value })}
          placeholder="例: 2320001"
          className="h-11"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">氏名 <span className="text-destructive">*</span></label>
        <Input
          value={form.name}
          onChange={e => onChange({ ...form, name: e.target.value })}
          placeholder="例: 山田 太郎"
          className="h-11"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">学科名 <span className="text-destructive">*</span></label>
        <Input
          value={form.department}
          onChange={e => onChange({ ...form, department: e.target.value })}
          placeholder="例: 鍼灸学科"
          className="h-11"
        />
      </div>
    </div>
  );
}
