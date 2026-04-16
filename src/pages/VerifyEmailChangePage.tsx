import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useConnection } from '../contexts/useConnection';
import * as apiService from '../services/apiService';

export default function VerifyEmailChangePage() {
  const { updateUser } = useAuth();
  const { isOnline } = useConnection();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenFromUrl = searchParams.get('token');

  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // URL에 토큰이 있으면 자동 인증 시도
  useEffect(() => {
    if (tokenFromUrl) {
      setLoading(true);
      apiService.verifyEmailChange({ token: tokenFromUrl })
        .then((result) => {
          if (result.user) {
            updateUser(result.user);
          }
          setMessage(result.message || '이메일이 변경되었습니다.');
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : '인증에 실패했습니다.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [tokenFromUrl, updateUser]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code || !email) {
      setError('이메일과 인증 코드를 입력해주세요.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);
    try {
      const result = await apiService.verifyEmailChange({ code, email });
      if (result.user) {
        updateUser(result.user);
      }
      setMessage(result.message || '이메일이 변경되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (tokenFromUrl && loading) {
    return (
      <div className="row justify-content-center" style={{ paddingTop: '10px' }}>
        <div className="col-md-6 col-lg-4 text-center">
          <h2 className="mb-4">이메일 변경 인증 중...</h2>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">인증 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="row justify-content-center" style={{ paddingTop: '10px' }}>
        <div className="col-md-6 col-lg-4 text-center">
          <h2 className="mb-4">이메일 변경 완료</h2>
          <div className="alert alert-success">{message}</div>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/mypage')}>마이페이지로 돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center" style={{ paddingTop: '10px' }}>
      <div className="col-md-6 col-lg-4">
        <h2 className="mb-4">이메일 변경 인증</h2>

        <p className="text-muted">변경할 이메일로 받은 인증 코드를 입력해주세요.</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">새 이메일</label>
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
            <label htmlFor="code" className="form-label">인증 코드</label>
            <input
              id="code"
              type="text"
              className="form-control text-center"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="6자리 숫자"
              disabled={!isOnline || loading}
              style={{ fontSize: '1.5rem', letterSpacing: '4px' }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={!isOnline || loading}
          >
            {loading ? '인증 중...' : '인증하기'}
          </button>
        </form>

        <div className="mt-3 text-center">
          <Link to="/mypage">마이페이지로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
