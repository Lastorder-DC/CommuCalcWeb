import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { ThemeContext, type Theme, type ThemeMode } from './ThemeContextDef';

const THEME_STORAGE_KEY = 'app_theme';

/** 시스템 다크모드 선호 여부를 반환합니다. */
function prefersDarkScheme(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** 저장된 값에서 유효한 테마 모드를 읽어옵니다. 기본값은 'auto'. */
function getInitialThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'auto' || stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage 접근 불가(시크릿 모드 등)
  }
  return 'auto';
}

/** 모드를 실제 테마(light/dark)로 해석합니다. */
function resolveTheme(mode: ThemeMode): Theme {
  if (mode === 'auto') return prefersDarkScheme() ? 'dark' : 'light';
  return mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialThemeMode);
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(getInitialThemeMode()));

  // 테마 모드가 변경되면 저장하고 실제 테마도 갱신
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // 저장 실패는 무시
    }
    setTheme(resolveTheme(themeMode));
  }, [themeMode]);

  // auto 모드에서는 시스템 설정 변화를 실시간으로 반영
  useEffect(() => {
    if (themeMode !== 'auto') return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [themeMode]);

  // 실제 테마가 변경되면 Bootstrap의 data-bs-theme 속성에 반영
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeModeState(prev => {
      const current = resolveTheme(prev);
      return current === 'light' ? 'dark' : 'light';
    });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  return (
    <ThemeContext value={{ theme, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext>
  );
}
