import { useState, useCallback, useEffect, type ReactNode } from 'react';
import type { OAuthCallbackResponse, User } from '../types';
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

  const login = useCallback(async (email: string, password: string, turnstileToken?: string) => {
    const result = await apiService.login({ email, password, turnstileToken });
    setUser(result.user);
  }, []);

  const register = useCallback(async (email: string, password: string, username: string): Promise<{ needsVerification?: boolean }> => {
    const result = await apiService.register({ email, password, username });
    if ('needsVerification' in result && result.needsVerification) {
      return { needsVerification: true };
    }
    if ('user' in result) {
      setUser(result.user);
    }
    return {};
  }, []);

  const logout = useCallback(async () => {
    await apiService.logout();
    setUser(null);
  }, []);

  const loginWithXCallback = useCallback(async (code: string, state: string): Promise<OAuthCallbackResponse> => {
    const result = await apiService.xLoginCallback(code, state);
    if ('user' in result) {
      setUser(result.user);
    }
    return result;
  }, []);

  const loginWithMastodonCallback = useCallback(async (code: string, state: string): Promise<OAuthCallbackResponse> => {
    const result = await apiService.mastodonLoginCallback(code, state);
    if ('user' in result) {
      setUser(result.user);
    }
    return result;
  }, []);

  const completeOAuthSignup = useCallback(async (
    provider: 'x' | 'mastodon',
    providerId: string,
    username: string,
    email: string,
  ): Promise<{ needsVerification?: boolean }> => {
    const result = await apiService.completeOAuthSignup(provider, providerId, username, email);
    if ('needsVerification' in result && result.needsVerification) {
      return { needsVerification: true };
    }
    if ('user' in result) {
      setUser(result.user);
    }
    return {};
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await apiService.getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((u: User) => {
    setUser(u);
  }, []);

  return (
    <AuthContext value={{
      user,
      isLoggedIn: user !== null,
      isLoading,
      login,
      register,
      logout,
      loginWithXCallback,
      loginWithMastodonCallback,
      completeOAuthSignup,
      refreshUser,
      updateUser,
    }}>
      {children}
    </AuthContext>
  );
}

