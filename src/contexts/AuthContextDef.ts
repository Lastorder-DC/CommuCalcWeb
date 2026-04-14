import { createContext } from 'react';
import type { User } from '../types';

export interface AuthContextType {
  /** 현재 로그인한 사용자 (null이면 비로그인 상태) */
  user: User | null;
  /** 로그인 여부 */
  isLoggedIn: boolean;
  /** 로그인 로딩 중 */
  isLoading: boolean;
  /** 로그인 처리 */
  login: (email: string, password: string) => Promise<void>;
  /** 회원가입 처리 */
  register: (email: string, password: string, username: string) => Promise<void>;
  /** 로그아웃 처리 */
  logout: () => Promise<void>;
  /** X OAuth 콜백 로그인 처리 */
  loginWithXCallback: (code: string, state: string) => Promise<void>;
  /** 사용자 정보 새로고침 */
  refreshUser: () => Promise<void>;
  /** 사용자 정보 직접 업데이트 (이메일 변경 등) */
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
