'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Lock, ChevronRight, GraduationCap, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function LoginPage() {
  const { loginAdmin, loginStudent } = useAuth();
  const [tab, setTab] = useState<'student' | 'admin'>('student');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) { setError('学籍番号を入力してください'); return; }
    loginStudent(studentId.trim());
  };

  const handleAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('メールアドレスとパスワードを入力してください'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await loginAdmin(email.trim(), password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen bg-background miracosta-bg flex flex-col items-center justify-center p-4">
      {/* Logo / Header */}
      <div className="flex flex-col items-center gap-5 mb-8">
        <div className="logo-circle w-28 h-28">
          <Image
            src="/logo.png"
            alt="BIBLIOTHECA"
            width={112}
            height={112}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground tracking-[0.2em]">TOYO MEDICAL COLLEGE</p>
          <h1 className="text-3xl font-bold text-primary mt-1 tracking-wide">BIBLIOTHECA</h1>
          <div className="gold-divider w-32 mx-auto mt-3 mb-2" />
          <p className="text-sm text-muted-foreground">図書室管理システム</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm miracosta-card rounded-2xl overflow-hidden">
        {/* Tabs */}
        <div className="grid grid-cols-2 border-b-2 border-[#c9a227]">
          <button
            onClick={() => { setTab('student'); setError(''); }}
            className={cn(
              'py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2',
              tab === 'student'
                ? 'bg-primary text-primary-foreground'
                : 'bg-[#f5f0e5] text-primary/50 hover:bg-[#ede6d6] hover:text-primary/80'
            )}
          >
            <GraduationCap className="w-5 h-5" />
            学生
          </button>
          <button
            onClick={() => { setTab('admin'); setError(''); }}
            className={cn(
              'py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2',
              tab === 'admin'
                ? 'bg-primary text-primary-foreground'
                : 'bg-[#f5f0e5] text-primary/50 hover:bg-[#ede6d6] hover:text-primary/80'
            )}
          >
            <ShieldCheck className="w-5 h-5" />
            教職員
          </button>
        </div>

        <div className="p-6">
          {tab === 'student' ? (
            <form onSubmit={handleStudent} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  学籍番号
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={studentId}
                    onChange={(e) => { setStudentId(e.target.value); setError(''); }}
                    placeholder="例: 2320010"
                    className="pl-10 h-12 text-base"
                    autoFocus
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="btn-miracosta h-14 text-base w-full rounded-xl">
                図書室を確認する
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
              <p suppressHydrationWarning className="text-xs text-muted-foreground text-center">
                学籍番号を入力してください。パスワードは不要です。
              </p>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  メールアドレス
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="admin@toyo-medical.ac.jp"
                    className="pl-10 h-12 text-base"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  パスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </div>
              {error && (
                <div className="bg-destructive/10 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <Button type="submit" className="btn-miracosta h-14 text-base w-full rounded-xl" disabled={loading}>
                {loading ? '確認中...' : '管理者ログイン'}
                {!loading && <ChevronRight className="w-5 h-5 ml-1" />}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
