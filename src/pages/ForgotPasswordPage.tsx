import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useConnection } from '../contexts/useConnection';
import Turnstile from '../components/Turnstile';
import * as apiService from '../services/apiService';

export default function ForgotPasswordPage() {
  const { isOnline, turnstileEnabled, turnstileSiteKey } = useConnection();

  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    if (turnstileEnabled && !turnstileToken) {
      setError('보안 인증을 완료해주세요.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await apiService.forgotPassword(email, turnstileToken || undefined);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center" style={{ paddingTop: '10px' }}>
      <div className="col-md-6 col-lg-4">
        <h2 className="mb-4">비밀번호 찾기</h2>

        <p className="text-muted">
          가입한 이메일 주소를 입력하면 임시 비밀번호가 발송됩니다.
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

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

          {turnstileEnabled && turnstileSiteKey && (
            <div className="mb-3">
              <Turnstile
                siteKey={turnstileSiteKey}
                onVerify={setTurnstileToken}
                onExpire={() => setTurnstileToken('')}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={!isOnline || loading || (turnstileEnabled && !turnstileToken)}
          >
            {loading ? '요청 중...' : '임시 비밀번호 발송'}
          </button>
        </form>

        <div className="mt-3 text-center">
          <Link to="/login">로그인 페이지로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
