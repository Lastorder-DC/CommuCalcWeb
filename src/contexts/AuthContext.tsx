import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  /** 현재 로그인한 사용자 (null이면 비로그인 상태) */
  user: User | null;
  /** 로그인 여부 */
  isLoggedIn: boolean;
  /** 로그인 처리 (추후 구현) */
  login: (username: string, password: string) => Promise<void>;
  /** 로그아웃 처리 (추후 구현) */
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = useCallback(async (_username: string, _password: string) => {
    // TODO: 추후 서버 API 연동시 실제 로그인 로직 구현
    // const response = await fetch('/api/auth/login', { ... });
    // const userData = await response.json();
    // setUser(userData);
    console.warn('로그인 기능은 아직 구현되지 않았습니다.');
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    // TODO: 추후 서버 API 연동시 실제 로그아웃 로직 구현
    setUser(null);
  }, []);

  return (
    <AuthContext value={{
      user,
      isLoggedIn: user !== null,
      login,
      logout,
    }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
