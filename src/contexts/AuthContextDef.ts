import { createContext } from 'react';
import type { OAuthCallbackResponse, User } from '../types';

export interface AuthContextType {
  /** 현재 로그인한 사용자 (null이면 비로그인 상태) */
  user: User | null;
  /** 로그인 여부 */
  isLoggedIn: boolean;
  /** 로그인 로딩 중 */
  isLoading: boolean;
  /** 로그인 처리 */
  login: (email: string, password: string, turnstileToken?: string) => Promise<void>;
  /** 회원가입 처리 (이메일 인증 필요 시 needsVerification 반환) */
  register: (email: string, password: string, username: string) => Promise<{ needsVerification?: boolean }>;
  /** 로그아웃 처리 */
  logout: () => Promise<void>;
  /** X OAuth 콜백 로그인 처리 */
  loginWithXCallback: (code: string, state: string) => Promise<OAuthCallbackResponse>;
  /** Mastodon OAuth 콜백 로그인 처리 */
  loginWithMastodonCallback: (code: string, state: string) => Promise<OAuthCallbackResponse>;
  /** OAuth 가입 완료 (이메일 입력 후, 이메일 인증 필요 시 needsVerification 반환) */
  completeOAuthSignup: (provider: 'x' | 'mastodon', providerId: string, username: string, email: string) => Promise<{ needsVerification?: boolean }>;
  /** 사용자 정보 새로고침 */
  refreshUser: () => Promise<void>;
  /** 사용자 정보 직접 업데이트 (이메일 변경 등) */
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
