import { NavLink, Outlet } from 'react-router-dom';
import { APP_NAME } from '../config';
import { useAuth } from '../contexts/useAuth';

export default function Layout() {
  const { isLoggedIn } = useAuth();

  return (
    <>
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
              <li className="nav-item">
                {isLoggedIn ? (
                  <NavLink className="nav-link" to="/mypage">마이페이지</NavLink>
                ) : (
                  <span className="nav-link disabled" tabIndex={-1} aria-disabled="true">로그인</span>
                )}
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: '4.5rem' }}>
        <Outlet />
      </main>
    </>
  );
}
