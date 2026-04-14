import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

export default function XCallbackPage() {
  const [searchParams] = useSearchParams();
  const { loginWithXCallback } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      setError('인증 정보가 올바르지 않습니다.');
      return;
    }

    loginWithXCallback(code, state)
      .then(() => navigate('/'))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'X 로그인에 실패했습니다.');
      });
  }, [searchParams, loginWithXCallback, navigate]);

  if (error) {
    return (
      <div className="row justify-content-center" style={{ paddingTop: '10px' }}>
        <div className="col-md-6 col-lg-4">
          <div className="alert alert-danger">{error}</div>
          <a href="/login" className="btn btn-primary">로그인 페이지로 돌아가기</a>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center" style={{ paddingTop: '10px' }}>
      <div className="col-md-6 col-lg-4 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">로딩 중...</span>
        </div>
        <p className="mt-3">X 계정으로 로그인 중...</p>
      </div>
    </div>
  );
}
