import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useConnection } from '../contexts/useConnection';

interface OAuthSignupData {
  provider: 'x' | 'mastodon';
  providerId: string;
  username: string;
  email?: string;
}

export default function OAuthEmailPage() {
  const { completeOAuthSignup } = useAuth();
  const { isOnline } = useConnection();
  const navigate = useNavigate();

  const [signupData, setSignupData] = useState<OAuthSignupData | null>(null);
  const [email, setEmail] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('oauth_signup');
    if (!raw) {
      navigate('/login');
      return;
    }

    try {
      const data = JSON.parse(raw) as OAuthSignupData;
      if (!data.provider || !data.providerId || !data.username) {
        navigate('/login');
        return;
      }
      setSignupData(data);
      // OAuth 제공자(X API 등)에서 가져온 이메일이 있으면 사전 입력
      if (data.email) {
        setEmail(data.email);
      }
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  if (!signupData) {
    return null;
  }

  const providerName = signupData.provider === 'x' ? 'X' : 'Mastodon';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setError('오프라인 모드에서는 가입할 수 없습니다.');
      return;
    }

    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setError('이용약관과 개인정보처리방침에 동의해주세요.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await completeOAuthSignup(
        signupData.provider,
        signupData.providerId,
        signupData.username,
        email,
      );
      sessionStorage.removeItem('oauth_signup');
      if (result.needsVerification) {
        sessionStorage.setItem('verification_email', email);
        navigate('/verification-sent');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center" style={{ paddingTop: '10px' }}>
      <div className="col-md-6 col-lg-5">
        <h2 className="mb-4">이메일 입력</h2>

        <div className="alert alert-info">
          <strong>{providerName}</strong> 계정으로 처음 로그인하셨습니다.
          가입을 완료하려면 이메일 주소를 입력해주세요.
        </div>

        <div className="mb-3">
          <strong>닉네임:</strong> {signupData.username}
        </div>

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
              placeholder="example@email.com"
            />
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                disabled={!isOnline || loading}
              />
              <label className="form-check-label" htmlFor="agreeTerms">
                <Link to="/terms" target="_blank" rel="noopener noreferrer">이용약관</Link>에 동의합니다.
              </label>
            </div>
          </div>
          <div className="mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="agreePrivacy"
                checked={agreePrivacy}
                onChange={e => setAgreePrivacy(e.target.checked)}
                disabled={!isOnline || loading}
              />
              <label className="form-check-label" htmlFor="agreePrivacy">
                <Link to="/privacy" target="_blank" rel="noopener noreferrer">개인정보처리방침</Link>에 동의합니다.
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={!isOnline || loading || !agreeTerms || !agreePrivacy}
          >
            {loading ? '가입 중...' : '가입 완료'}
          </button>
        </form>

        <div className="mt-3 text-center">
          <Link to="/login">로그인 페이지로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
