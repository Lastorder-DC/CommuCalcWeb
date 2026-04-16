import { useState, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useConnection } from '../contexts/useConnection';
import Turnstile from '../components/Turnstile';
import * as apiService from '../services/apiService';

export default function ForgotPasswordPage() {
  const { isOnline, turnstileEnabled, turnstileSiteKey } = useConnection();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 캡차 관련 상태
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const doForgotPassword = useCallback(async (turnstileToken?: string) => {
    setLoading(true);
    try {
      const result = await apiService.forgotPassword(email, turnstileToken);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청에 실패했습니다.');
    } finally {
      setLoading(false);
      setShowTurnstile(false);
      setVerifying(false);
    }
  }, [email]);

  const handleTurnstileVerify = useCallback((token: string) => {
    doForgotPassword(token);
  }, [doForgotPassword]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setError('');
    setMessage('');

    if (turnstileEnabled) {
      setShowTurnstile(true);
      setVerifying(true);
      return;
    }

    await doForgotPassword();
  };

  const isProcessing = loading || verifying;

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
              disabled={!isOnline || isProcessing}
              autoComplete="email"
            />
          </div>

          {showTurnstile && turnstileEnabled && turnstileSiteKey && (
            <div className="mb-3">
              <Turnstile
                siteKey={turnstileSiteKey}
                onVerify={handleTurnstileVerify}
                onExpire={() => {
                  setVerifying(false);
                  setShowTurnstile(false);
                  setError('보안 인증이 만료되었습니다. 다시 시도해주세요.');
                }}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={!isOnline || isProcessing}
          >
            {loading ? '요청 중...' : verifying ? '인증중...' : '임시 비밀번호 발송'}
          </button>
        </form>

        <div className="mt-3 text-center">
          <Link to="/login">로그인 페이지로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
