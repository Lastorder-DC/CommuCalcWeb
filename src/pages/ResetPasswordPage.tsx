import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useConnection } from '../contexts/useConnection';
import * as apiService from '../services/apiService';

export default function ResetPasswordPage() {
  const { isOnline } = useConnection();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setLoading(true);
      apiService.resetPassword(tokenFromUrl)
        .then((result) => {
          setMessage(result.message);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : '비밀번호 재설정에 실패했습니다.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [tokenFromUrl]);

  if (!tokenFromUrl) {
    return (
      <div className="row justify-content-center" style={{ paddingTop: '10px' }}>
        <div className="col-md-6 col-lg-4 text-center">
          <h2 className="mb-4">비밀번호 재설정</h2>
          <div className="alert alert-danger">유효하지 않은 링크입니다.</div>
          <Link to="/login" className="btn btn-primary">로그인 페이지로 돌아가기</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center" style={{ paddingTop: '10px' }}>
      <div className="col-md-6 col-lg-4 text-center">
        <h2 className="mb-4">비밀번호 재설정</h2>

        {loading && (
          <div>
            <div className="spinner-border" role="status">
              <span className="visually-hidden">처리 중...</span>
            </div>
            <p className="mt-2">비밀번호를 재설정하는 중입니다...</p>
          </div>
        )}

        {error && (
          <div>
            <div className="alert alert-danger">{error}</div>
            <Link to="/forgot-password" className="btn btn-outline-primary">비밀번호 찾기 다시 시도</Link>
          </div>
        )}

        {message && (
          <div>
            <div className="alert alert-success">{message}</div>
            <Link to="/login" className="btn btn-primary" state={{ disabled: !isOnline }}>
              로그인하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
