import { createContext } from 'react';

/** 저장되는 테마 모드. 'auto'는 시스템 설정을 따릅니다. */
export type ThemeMode = 'auto' | 'light' | 'dark';
/** 실제 적용되는 테마 (auto를 해석한 결과). */
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  /** 실제 적용된 테마 (light/dark) */
  theme: Theme;
  /** 사용자가 설정한 테마 모드 (auto/light/dark) */
  themeMode: ThemeMode;
  /** light ↔ dark 빠른 토글 (현재 모드를 반대로). 'auto'였다면 현재 해석된 테마 기준으로 반대로 전환. */
  toggleTheme: () => void;
  /** 테마 모드를 명시적으로 지정합니다. */
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  themeMode: 'auto',
  toggleTheme: () => {},
  setThemeMode: () => {},
});
