import { getApiUrl, API_RETRY_COUNT, API_RETRY_DELAY } from '../config';
import type { AuthResponse, HealthResponse, LoginRequest, RegisterRequest, SaveData, User } from '../types';

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
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setStoredToken(result.token);
  return result;
}

/** 회원가입 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setStoredToken(result.token);
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
