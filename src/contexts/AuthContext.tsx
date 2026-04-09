import { useState, useCallback, type ReactNode } from 'react';
import type { User } from '../types';
import { AuthContext } from './AuthContextDef';

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
