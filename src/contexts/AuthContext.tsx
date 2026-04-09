import { useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { AuthContext } from './AuthContextDef';
import * as apiService from '../services/apiService';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작시 저장된 토큰으로 사용자 정보 복원
  useEffect(() => {
    const token = apiService.getStoredToken();
    if (token) {
      apiService.getCurrentUser()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiService.login({ email, password });
    setUser(result.user);
  }, []);

  const register = useCallback(async (email: string, password: string, username: string) => {
    const result = await apiService.register({ email, password, username });
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await apiService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext value={{
      user,
      isLoggedIn: user !== null,
      isLoading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext>
  );
}

