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
                <svg style={{ height: '18px', width: 'auto' }} width="74" height="79" viewBox="0 0 74 79" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M73.7014 17.9592C72.5616 9.62034 65.1774 3.04876 56.424 1.77536C54.9472 1.56019 49.3517 0.7771 36.3901 0.7771H36.2933C23.3281 0.7771 20.5465 1.56019 19.0697 1.77536C10.56 3.01348 2.78877 8.91838 0.903306 17.356C-0.00357857 21.5113 -0.100361 26.1181 0.068112 30.3439C0.308275 36.404 0.354874 42.4535 0.91406 48.489C1.30064 52.498 1.97502 56.4751 2.93215 60.3905C4.72441 67.6217 11.9795 73.6395 19.0876 76.0945C26.6979 78.6548 34.8821 79.0799 42.724 77.3221C43.5866 77.1245 44.4398 76.8953 45.2833 76.6342C47.1867 76.0381 49.4199 75.3714 51.0616 74.2003C51.0841 74.1839 51.1026 74.1627 51.1156 74.1382C51.1286 74.1138 51.1359 74.0868 51.1368 74.0592V68.2108C51.1364 68.185 51.1302 68.1596 51.1185 68.1365C51.1069 68.1134 51.0902 68.0932 51.0695 68.0773C51.0489 68.0614 51.0249 68.0503 50.9994 68.0447C50.9738 68.0391 50.9473 68.0392 50.9218 68.045C45.8976 69.226 40.7491 69.818 35.5836 69.8087C26.694 69.8087 24.3031 65.6569 23.6184 63.9285C23.0681 62.4347 22.7186 60.8764 22.5789 59.2934C22.5775 59.2669 22.5825 59.2403 22.5934 59.216C22.6043 59.1916 22.621 59.1702 22.6419 59.1533C22.6629 59.1365 22.6876 59.1248 22.714 59.1191C22.7404 59.1134 22.7678 59.1139 22.794 59.1206C27.7345 60.2936 32.799 60.8856 37.8813 60.8843C39.1036 60.8843 40.3223 60.8843 41.5447 60.8526C46.6562 60.7115 52.0437 60.454 57.0728 59.4874C57.1983 59.4628 57.3237 59.4416 57.4313 59.4098C65.3638 57.9107 72.9128 53.2051 73.6799 41.2895C73.7086 40.8204 73.7803 36.3758 73.7803 35.889C73.7839 34.2347 74.3216 24.1533 73.7014 17.9592ZM61.4925 47.6918H53.1514V27.5855C53.1514 23.3526 51.3591 21.1938 47.7136 21.1938C43.7061 21.1938 41.6988 23.7476 41.6988 28.7919V39.7974H33.4078V28.7919C33.4078 23.7476 31.3969 21.1938 27.3894 21.1938C23.7654 21.1938 21.9552 23.3526 21.9516 27.5855V47.6918H13.6176V26.9752C13.6176 22.7423 14.7157 19.3795 16.9118 16.8868C19.1772 14.4 22.1488 13.1231 25.8373 13.1231C30.1064 13.1231 33.3325 14.7386 35.4832 17.9662L37.5587 21.3949L39.6377 17.9662C41.7884 14.7386 45.0145 13.1231 49.2765 13.1231C52.9614 13.1231 55.9329 14.4 58.2055 16.8868C60.4017 19.3772 61.4997 22.74 61.4997 26.9752L61.4925 47.6918Z" fill="inherit"/>
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
