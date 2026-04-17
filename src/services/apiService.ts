import { getApiUrl, API_RETRY_COUNT, API_RETRY_DELAY } from '../config';
import type { AuthResponse, ChangelogData, HealthResponse, LoginRequest, OAuthCallbackResponse, RegisterRequest, SaveData, User } from '../types';

/** 토큰 저장 키 */
const TOKEN_STORAGE_KEY = 'auth_token';

/** 인증 토큰을 가져옵니다. */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/** 인증 토큰을 저장합니다. */
function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

/** API 요청 헬퍼 */
async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = getApiUrl();
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '요청 실패' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  // 204 No Content 등 빈 응답 처리
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** API 서버 연결 테스트 (재시도 포함) – 성공 시 health 응답을 반환 */
export async function testConnection(): Promise<HealthResponse | null> {
  const baseUrl = getApiUrl();

  for (let i = 0; i < API_RETRY_COUNT; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data: HealthResponse = await response.json();
        return data;
      }
    } catch {
      // 연결 실패 시 재시도
    }

    if (i < API_RETRY_COUNT - 1) {
      await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY));
    }
  }

  return null;
}

/** 로그인 */
export async function login(data: LoginRequest & { turnstileToken?: string }): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setStoredToken(result.token);
  return result;
}

/** 회원가입 */
export async function register(data: RegisterRequest): Promise<AuthResponse | { message: string; needsVerification: true }> {
  const result = await apiRequest<AuthResponse | { message: string; needsVerification: true }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if ('token' in result) {
    setStoredToken(result.token);
  }
  return result;
}

/** 로그아웃 */
export async function logout(): Promise<void> {
  try {
    await apiRequest<void>('/auth/logout', { method: 'POST' });
  } catch {
    // 서버 로그아웃 실패해도 클라이언트에서는 로그아웃 처리
  }
  setStoredToken(null);
}

/** 현재 사용자 정보 조회 */
export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me');
}

/** 서버에 데이터 저장 */
export async function saveUserData(data: SaveData): Promise<void> {
  await apiRequest<void>('/data', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** 서버에 데이터 부분 저장 */
export async function savePartialUserData(data: Partial<SaveData>): Promise<void> {
  await apiRequest<void>('/data', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** 서버에서 데이터 불러오기 */
export async function loadUserData(): Promise<SaveData | null> {
  try {
    return await apiRequest<SaveData>('/data');
  } catch {
    return null;
  }
}

/** 이용약관 가져오기 */
export async function getTermsOfService(): Promise<string> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/legal/terms`);
  if (!response.ok) throw new Error('이용약관을 불러올 수 없습니다.');
  return response.text();
}

/** 개인정보처리방침 가져오기 */
export async function getPrivacyPolicy(): Promise<string> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/legal/privacy`);
  if (!response.ok) throw new Error('개인정보처리방침을 불러올 수 없습니다.');
  return response.text();
}

/** 서버 변경 이력(JSON) 가져오기 */
export async function getServerChangelog(): Promise<ChangelogData> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/changelog`);
  if (!response.ok) throw new Error('서버 변경 이력을 불러올 수 없습니다.');
  return response.json();
}

/** X 로그인 인증 URL 가져오기 */
export async function getXLoginUrl(): Promise<{ authorizeUrl: string; state: string }> {
  return apiRequest<{ authorizeUrl: string; state: string }>('/auth/x/login');
}

/** X OAuth 콜백 처리 */
export async function xLoginCallback(code: string, state: string): Promise<OAuthCallbackResponse> {
  const result = await apiRequest<OAuthCallbackResponse>('/auth/x/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state }),
  });
  if ('token' in result) {
    setStoredToken(result.token);
  }
  return result;
}

/** 비밀번호 변경 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest<{ message: string }>('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/** 이메일 변경 */
export async function changeEmail(email: string): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>('/auth/email', {
    method: 'PUT',
    body: JSON.stringify({ email }),
  });
  setStoredToken(result.token);
  return result;
}

/** 이메일 변경 요청 (인증 메일 발송) */
export async function requestEmailChange(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/request-email-change', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** 이메일 변경 인증 완료 */
export async function verifyEmailChange(params: { token?: string; code?: string; email?: string }): Promise<AuthResponse & { message: string }> {
  const result = await apiRequest<AuthResponse & { message: string }>('/auth/verify-email-change', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (result.token) {
    setStoredToken(result.token);
  }
  return result;
}

/** 계정 삭제 */
export async function deleteAccount(): Promise<void> {
  await apiRequest<void>('/auth/account', {
    method: 'DELETE',
    body: JSON.stringify({ confirmation: 'DELETE' }),
  });
  setStoredToken(null);
}

/** X 계정 연동 (로그인된 상태에서) */
export async function linkXAccount(code: string, state: string): Promise<void> {
  await apiRequest<{ message: string }>('/auth/x/link', {
    method: 'POST',
    body: JSON.stringify({ code, state }),
  });
}

/** X 계정 연동 해제 */
export async function unlinkXAccount(): Promise<void> {
  await apiRequest<{ message: string }>('/auth/x/unlink', {
    method: 'DELETE',
  });
}

/** Mastodon 로그인 인증 URL 가져오기 */
export async function getMastodonLoginUrl(serverIndex = 0): Promise<{ authorizeUrl: string; state: string }> {
  return apiRequest<{ authorizeUrl: string; state: string }>(`/auth/mastodon/login?serverIndex=${serverIndex}`);
}

/** Mastodon OAuth 콜백 처리 */
export async function mastodonLoginCallback(code: string, state: string): Promise<OAuthCallbackResponse> {
  const result = await apiRequest<OAuthCallbackResponse>('/auth/mastodon/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state }),
  });
  if ('token' in result) {
    setStoredToken(result.token);
  }
  return result;
}

/** Mastodon 계정 연동 (로그인된 상태에서) */
export async function linkMastodonAccount(code: string, state: string): Promise<void> {
  await apiRequest<{ message: string }>('/auth/mastodon/link', {
    method: 'POST',
    body: JSON.stringify({ code, state }),
  });
}

/** Mastodon 계정 연동 해제 */
export async function unlinkMastodonAccount(): Promise<void> {
  await apiRequest<{ message: string }>('/auth/mastodon/unlink', {
    method: 'DELETE',
  });
}

/** OAuth 가입 완료 (이메일 입력 후) */
export async function completeOAuthSignup(
  provider: 'x' | 'mastodon',
  providerId: string,
  username: string,
  email: string,
  turnstileToken?: string,
): Promise<AuthResponse | { message: string; needsVerification: true }> {
  const result = await apiRequest<AuthResponse | { message: string; needsVerification: true }>('/auth/complete-signup', {
    method: 'POST',
    body: JSON.stringify({ provider, providerId, username, email, turnstileToken }),
  });
  if ('token' in result) {
    setStoredToken(result.token);
  }
  return result;
}

/** 닉네임 변경 */
export async function changeUsername(username: string): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>('/auth/username', {
    method: 'PUT',
    body: JSON.stringify({ username }),
  });
  setStoredToken(result.token);
  return result;
}

/** 이메일 인증 */
export async function verifyEmail(params: { token?: string; code?: string; email?: string }): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (result.token) {
    setStoredToken(result.token);
  }
  return result;
}

/** 인증 메일 재발송 */
export async function resendVerification(email: string, turnstileToken?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email, turnstileToken }),
  });
}

/** 비밀번호 찾기 */
export async function forgotPassword(email: string, turnstileToken?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email, turnstileToken }),
  });
}

/** 임시 비밀번호로 비밀번호 재설정 */
export async function resetPassword(token: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
