import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CalcPage from './pages/CalcPage';
import CharacterPage from './pages/CharacterPage';
import GuidePage from './pages/GuidePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/calc" element={<CalcPage />} />
            <Route path="/db" element={<CharacterPage />} />
            <Route path="/guide" element={<GuidePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
