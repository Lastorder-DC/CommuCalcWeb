import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';

const HomePage = lazy(() => import('./pages/HomePage'));
const CalcPage = lazy(() => import('./pages/CalcPage'));
const CharacterPage = lazy(() => import('./pages/CharacterPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="container" style={{ paddingTop: '5rem' }}>로딩 중...</div>}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/calc" element={<CalcPage />} />
              <Route path="/db" element={<CharacterPage />} />
              <Route path="/guide" element={<GuidePage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
