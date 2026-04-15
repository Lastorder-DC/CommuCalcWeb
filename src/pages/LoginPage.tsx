import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useConnection } from '../contexts/useConnection';
import { getXLoginUrl, getMastodonLoginUrl } from '../services/apiService';

export default function LoginPage() {
  const { login } = useAuth();
  const { isOnline, xLoginEnabled, mastodonLoginEnabled, mastodonServerName } = useConnection();
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

  const handleMastodonLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { authorizeUrl } = await getMastodonLoginUrl();
      window.location.href = authorizeUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mastodon 로그인을 시작할 수 없습니다.');
      setLoading(false);
    }
  };

  const hasOAuthLogin = xLoginEnabled || mastodonLoginEnabled;

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

        {hasOAuthLogin && (
          <div className="mt-3">
            <div className="text-center text-muted mb-2">
              <small>또는</small>
            </div>

            {xLoginEnabled && (
              <button
                type="button"
                className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2 mb-2"
                onClick={handleXLogin}
                disabled={!isOnline || loading}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X 계정으로 로그인
              </button>
            )}

            {mastodonLoginEnabled && (
              <button
                type="button"
                className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                style={{ backgroundColor: '#6364FF', color: '#fff', borderColor: '#6364FF' }}
                onClick={handleMastodonLogin}
                disabled={!isOnline || loading}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054 19.648 19.648 0 0 0 4.581.536h.336c1.636 0 3.282-.063 4.896-.31 1.693-.257 3.296-.828 4.452-1.81.886-.744 1.487-1.627 1.81-2.664.556-1.78.51-3.847.455-5.157zm-3.475 6.257a4.16 4.16 0 0 1-.078.695h-.003c-.252 1.472-1.764 2.097-3.517 2.296-1.81.206-3.646.17-5.394.066a18.97 18.97 0 0 1-1.15-.08l-.123-.01C8.09 14.406 7.22 14.02 6.9 12.88a5.888 5.888 0 0 1-.212-1.39V8.28c0-.755.158-1.41.638-1.958.512-.584 1.196-.88 2.048-.9h.037c1.107-.023 2.217-.018 3.326.015 1.163.034 2.33.103 3.462.36 1.478.335 2.394 1.478 2.594 2.904.117.844.11 1.7.01 2.539l-.001.33z" />
                </svg>
                {mastodonServerName ? `${mastodonServerName}로 로그인` : 'Mastodon으로 로그인'}
              </button>
            )}
          </div>
        )}

        <div className="mt-3 text-center">
          <Link to="/register">계정이 없으신가요? 회원가입</Link>
        </div>
      </div>
    </div>
  );
}
