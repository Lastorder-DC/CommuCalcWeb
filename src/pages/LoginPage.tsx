import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useConnection } from '../contexts/useConnection';
import { getXLoginUrl } from '../services/apiService';

export default function LoginPage() {
  const { login } = useAuth();
  const { isOnline, xLoginEnabled } = useConnection();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setError('오프라인 모드에서는 로그인할 수 없습니다.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleXLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { authorizeUrl } = await getXLoginUrl();
      window.location.href = authorizeUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'X 로그인을 시작할 수 없습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center" style={{ paddingTop: '10px' }}>
      <div className="col-md-6 col-lg-4">
        <h2 className="mb-4">로그인</h2>

        {!isOnline && (
          <div className="alert alert-warning">
            오프라인 모드입니다. 로그인 기능을 사용할 수 없습니다.
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">이메일</label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={!isOnline || loading}
              autoComplete="email"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">비밀번호</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={!isOnline || loading}
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={!isOnline || loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {xLoginEnabled && (
          <div className="mt-3">
            <div className="text-center text-muted mb-2">
              <small>또는</small>
            </div>
            <button
              type="button"
              className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={handleXLogin}
              disabled={!isOnline || loading}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X 계정으로 로그인
            </button>
          </div>
        )}

        <div className="mt-3 text-center">
          <Link to="/register">계정이 없으신가요? 회원가입</Link>
        </div>
      </div>
    </div>
  );
}
