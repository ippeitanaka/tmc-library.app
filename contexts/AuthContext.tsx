'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';

const STUDENT_KEY = 'toyo_student_id';

interface AuthContextValue {
  isAdmin: boolean;
  studentId: string | null;
  authLoading: boolean;
  loginAdmin: (email: string, password: string) => Promise<{ error: string | null }>;
  loginStudent: (studentId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Supabase セッション確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        if (meta?.is_admin) {
          setIsAdmin(true);
          setStudentId(null);
        }
      } else {
        // 学生セッション（localStorage）
        const stored = localStorage.getItem(STUDENT_KEY);
        if (stored) setStudentId(stored);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.user_metadata?.is_admin) {
        setIsAdmin(true);
        setStudentId(null);
      } else if (!session) {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginAdmin = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: 'メールアドレスまたはパスワードが正しくありません' };
    const meta = data.user?.user_metadata;
    if (!meta?.is_admin) {
      await supabase.auth.signOut();
      return { error: '管理者権限がありません' };
    }
    setIsAdmin(true);
    setStudentId(null);
    return { error: null };
  };

  const loginStudent = (id: string) => {
    setStudentId(id);
    setIsAdmin(false);
    localStorage.setItem(STUDENT_KEY, id);
  };

  const logout = async () => {
    if (isAdmin) {
      await supabase.auth.signOut();
    }
    setIsAdmin(false);
    setStudentId(null);
    localStorage.removeItem(STUDENT_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, studentId, authLoading, loginAdmin, loginStudent, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
