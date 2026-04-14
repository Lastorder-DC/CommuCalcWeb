import { useState, type FormEvent } from 'react';
import { getApiUrl, setApiUrl, DEFAULT_API_URL } from '../config';
import { useConnection } from '../contexts/useConnection';

export default function SettingsPage() {
  const { isOnline, isChecking, retry } = useConnection();
  const [apiUrl, setApiUrlState] = useState(getApiUrl());
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setApiUrl(apiUrl.replace(/\/+$/, '')); // 끝의 슬래시 제거
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // 서버 URL 변경 후 연결 재시도
    retry();
  };

  const handleReset = () => {
    setApiUrlState(DEFAULT_API_URL);
    setApiUrl(DEFAULT_API_URL);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    retry();
  };

  return (
    <div className="row" style={{ paddingTop: '10px' }}>
      <div className="col-md-8">
        <h2>설정</h2>

        <div className="card mb-3">
          <div className="card-header"><strong>API 서버 설정</strong></div>
          <div className="card-body">
            <div className="alert alert-danger py-2 mb-3">
              <small>⚠️ 일반적인 경우 이 설정을 변경할 필요가 없습니다. 잘못된 설정은 앱이 정상적으로 작동하지 않을 수 있습니다.</small>
            </div>
            <div className="mb-3">
              <span className="badge bg-secondary me-2">연결 상태</span>
              {isChecking ? (
                <span className="badge bg-warning">확인 중...</span>
              ) : isOnline ? (
                <span className="badge bg-success">연결됨</span>
              ) : (
                <span className="badge bg-danger">오프라인</span>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="apiUrl" className="form-label">API 서버 URL</label>
                <input
                  id="apiUrl"
                  type="url"
                  className="form-control"
                  value={apiUrl}
                  onChange={e => setApiUrlState(e.target.value)}
                  placeholder={DEFAULT_API_URL}
                />
                <div className="form-text">
                  기본값: {DEFAULT_API_URL}
                </div>
              </div>
              <button type="submit" className="btn btn-primary me-2">
                저장
              </button>
              <button type="button" className="btn btn-outline-secondary me-2" onClick={handleReset}>
                기본값으로 초기화
              </button>
              <button type="button" className="btn btn-outline-info" onClick={retry} disabled={isChecking}>
                {isChecking ? '확인 중...' : '연결 테스트'}
              </button>
            </form>

            {saved && (
              <div className="alert alert-success mt-3">설정이 저장되었습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
