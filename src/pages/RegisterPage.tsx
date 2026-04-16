import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useConnection } from '../contexts/useConnection';

export default function RegisterPage() {
  const { register } = useAuth();
  const { isOnline } = useConnection();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setError('오프라인 모드에서는 회원가입할 수 없습니다.');
      return;
    }

    if (!/^[가-힣a-zA-Z0-9 ]{2,20}$/.test(username) || username !== username.trim()) {
      setError('닉네임은 2~20자의 한글·영문·숫자·띄어쓰기만 사용 가능합니다. (앞뒤 공백 불가)');
      return;
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setError('이용약관과 개인정보처리방침에 동의해주세요.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await register(email, password, username);
      if (result.needsVerification) {
        sessionStorage.setItem('verification_email', email);
        navigate('/verification-sent');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center" style={{ paddingTop: '10px' }}>
      <div className="col-md-6 col-lg-5">
        <h2 className="mb-4">회원가입</h2>

        {!isOnline && (
          <div className="alert alert-warning">
            오프라인 모드입니다. 회원가입 기능을 사용할 수 없습니다.
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">닉네임</label>
            <input
              id="username"
              type="text"
              className="form-control"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              maxLength={20}
              pattern="[가-힣a-zA-Z0-9 ]{2,20}"
              disabled={!isOnline || loading}
              autoComplete="username"
            />
            <div className="form-text">2~20자, 한글·영문·숫자·띄어쓰기만 사용 가능합니다.</div>
          </div>
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
              minLength={8}
              disabled={!isOnline || loading}
              autoComplete="new-password"
            />
            <div className="form-text">8자 이상 입력해주세요.</div>
          </div>
          <div className="mb-3">
            <label htmlFor="passwordConfirm" className="form-label">비밀번호 확인</label>
            <input
              id="passwordConfirm"
              type="password"
              className="form-control"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              required
              disabled={!isOnline || loading}
              autoComplete="new-password"
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
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="mt-3 text-center">
          <Link to="/login">이미 계정이 있으신가요? 로그인</Link>
        </div>
      </div>
    </div>
  );
}
