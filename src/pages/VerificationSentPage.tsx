import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConnection } from '../contexts/useConnection';
import Turnstile from '../components/Turnstile';
import * as apiService from '../services/apiService';

export default function VerificationSentPage() {
  const { isOnline, turnstileEnabled, turnstileSiteKey } = useConnection();
  const navigate = useNavigate();

  const email = sessionStorage.getItem('verification_email') || '';
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 캡차 관련 상태
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const pendingTokenRef = useRef<string>('');

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const doResend = useCallback(async (turnstileToken?: string) => {
    setResendLoading(true);
    try {
      const result = await apiService.resendVerification(email, turnstileToken);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : '재발송에 실패했습니다.');
    } finally {
      setResendLoading(false);
      setShowTurnstile(false);
      setVerifying(false);
    }
  }, [email]);

  const handleTurnstileVerify = useCallback((token: string) => {
    pendingTokenRef.current = token;
    doResend(token);
  }, [doResend]);

  if (!email) {
    return null;
  }

  const handleResend = async () => {
    setError('');
    setMessage('');

    if (turnstileEnabled) {
      setShowTurnstile(true);
      setVerifying(true);
      return;
    }

    await doResend();
  };

  const isProcessing = resendLoading || verifying;

  return (
    <div className="row justify-content-center" style={{ paddingTop: '10px' }}>
      <div className="col-md-6 col-lg-5">
        <h2 className="mb-4">이메일 인증</h2>

        <div className="alert alert-info">
          <strong>{email}</strong> 주소로 인증 메일이 발송되었습니다.<br />
          이메일을 확인하여 인증을 완료해주세요.
        </div>

        <p className="text-muted">
          인증은 24시간 이내에 완료해야 합니다. 인증이 완료되어야 로그인이 가능합니다.
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

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

        <div className="d-grid gap-2">
          <Link to="/verify-email" className="btn btn-primary">
            인증 코드 입력하기
          </Link>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleResend}
            disabled={!isOnline || isProcessing}
          >
            {resendLoading ? '발송 중...' : verifying ? '인증중...' : '인증 메일 재발송'}
          </button>
        </div>

        <div className="mt-3 text-center">
          <Link to="/login">로그인 페이지로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
