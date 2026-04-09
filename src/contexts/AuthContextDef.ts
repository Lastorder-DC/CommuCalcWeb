import { createContext } from 'react';
import type { User } from '../types';

export interface AuthContextType {
  /** 현재 로그인한 사용자 (null이면 비로그인 상태) */
  user: User | null;
  /** 로그인 여부 */
  isLoggedIn: boolean;
  /** 로그인 처리 (추후 구현) */
  login: (username: string, password: string) => Promise<void>;
  /** 로그아웃 처리 (추후 구현) */
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
