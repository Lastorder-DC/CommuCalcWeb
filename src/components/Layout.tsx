import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../config';
import { useAuth } from '../contexts/useAuth';
import { useConnection } from '../contexts/useConnection';
import Footer from './Footer';
import OfflineBanner from './OfflineBanner';

export default function Layout() {
  const { isLoggedIn, user, logout } = useAuth();
  const { isOnline } = useConnection();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
        <div className="container-fluid">
          <NavLink className="navbar-brand" to="/">{APP_NAME}</NavLink>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarCollapse"
            aria-controls="navbarCollapse"
            aria-expanded="false"
            aria-label="내비게이션 토글"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarCollapse">
            <ul className="navbar-nav me-auto mb-2 mb-md-0">
              <li className="nav-item">
                <NavLink className="nav-link" to="/calc">계산하기</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/db">캐릭터 입력</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/guide">설명서</NavLink>
              </li>
            </ul>
            <ul className="navbar-nav ms-auto mb-2 mb-md-0">
              {isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <span className="nav-link disabled">{user?.username}</span>
                  </li>
                  <li className="nav-item">
                    <button className="nav-link btn btn-link" onClick={handleLogout}>로그아웃</button>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  {isOnline ? (
                    <NavLink className="nav-link" to="/login">로그인</NavLink>
                  ) : (
                    <span className="nav-link disabled" tabIndex={-1} aria-disabled="true">로그인 (오프라인)</span>
                  )}
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <main className="container flex-grow-1" style={{ paddingTop: '4.5rem', paddingBottom: '1rem' }}>
        <Outlet />
      </main>

      <OfflineBanner />
      <Footer />
    </div>
  );
}
