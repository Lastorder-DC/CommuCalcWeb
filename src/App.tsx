import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ConnectionProvider } from './contexts/ConnectionContext';
import Layout from './components/Layout';

const HomePage = lazy(() => import('./pages/HomePage'));
const CalcPage = lazy(() => import('./pages/CalcPage'));
const CharacterPage = lazy(() => import('./pages/CharacterPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

export default function App() {
  return (
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
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ConnectionProvider>
  );
}
