import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ConnectionProvider } from './contexts/ConnectionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';

/** lazy import 실패 시(누락된 에셋 등) 페이지를 새로고침하는 래퍼 */
function lazyWithReload(factory: () => Promise<{ default: React.ComponentType }>) {
  return lazy(() =>
    factory().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      // 청크 로딩 실패 시 페이지를 새로고침 (무한 루프 방지)
      if (
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Loading chunk') ||
        message.includes('Loading CSS chunk')
      ) {
        const key = 'chunk_reload_ts';
        const lastReload = Number(sessionStorage.getItem(key) || '0');
        if (Date.now() - lastReload > 10000) {
          sessionStorage.setItem(key, String(Date.now()));
          window.location.reload();
        }
      }
      throw error;
    }),
  );
}

const HomePage = lazyWithReload(() => import('./pages/HomePage'));
const CalcPage = lazyWithReload(() => import('./pages/CalcPage'));
const CharacterPage = lazyWithReload(() => import('./pages/CharacterPage'));
const GuidePage = lazyWithReload(() => import('./pages/GuidePage'));
const LoginPage = lazyWithReload(() => import('./pages/LoginPage'));
const RegisterPage = lazyWithReload(() => import('./pages/RegisterPage'));
const TermsPage = lazyWithReload(() => import('./pages/TermsPage'));
const PrivacyPage = lazyWithReload(() => import('./pages/PrivacyPage'));
const SettingsPage = lazyWithReload(() => import('./pages/SettingsPage'));
const MyPage = lazyWithReload(() => import('./pages/MyPage'));
const XCallbackPage = lazyWithReload(() => import('./pages/XCallbackPage'));

export default function App() {
  return (
    <ThemeProvider>
      <ConnectionProvider>
        <AuthProvider>
          <BrowserRouter>
          <Suspense fallback={<div className="container" style={{ paddingTop: '5rem' }}>로딩 중...</div>}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/calc" element={<CalcPage />} />
                <Route path="/db" element={<CharacterPage />} />
                <Route path="/guide" element={<GuidePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/x/callback" element={<XCallbackPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ConnectionProvider>
    </ThemeProvider>
  );
}
