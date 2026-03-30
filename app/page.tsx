'use client';

import dynamic from 'next/dynamic';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

const LoginPage = dynamic(() => import('@/components/LoginPage'), { ssr: false });
const StudentView = dynamic(() => import('@/components/StudentView'), { ssr: false });
const AdminView = dynamic(() => import('@/components/AdminView'), { ssr: false });

function AppContent() {
  const { isAdmin, studentId, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background miracosta-bg flex flex-col items-center justify-center gap-4">
        <div className="logo-circle w-16 h-16 animate-pulse">
          <Image src="/logo.png" alt="BIBLIOTHECA" width={64} height={64} className="w-full h-full object-cover" priority />
        </div>
        <p className="text-sm text-muted-foreground tracking-wide">読み込み中...</p>
      </div>
    );
  }

  if (!isAdmin && !studentId) return <LoginPage />;
  if (isAdmin) return <AdminView />;
  return <StudentView />;
}

export default function Page() {
  return (
    <AppProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppProvider>
  );
}
