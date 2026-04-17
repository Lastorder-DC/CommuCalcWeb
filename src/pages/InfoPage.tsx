import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_VERSION, DEFAULT_API_URL, getApiUrl } from '../config';
import { useConnection } from '../contexts/useConnection';
import { useTheme } from '../contexts/useTheme';
import { testConnection } from '../services/apiService';
import type { HealthResponse } from '../types';

/** 한 줄짜리 설정 행(key/value)을 렌더링합니다. */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="row mb-2">
      <div className="col-sm-5 text-muted">{label}</div>
      <div className="col-sm-7"><code className="text-reset">{value}</code></div>
    </div>
  );
}

export default function InfoPage() {
  const { isOnline } = useConnection();
  const { themeMode, theme } = useTheme();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState('');
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingHealth(true);
    setHealthError('');
    testConnection()
      .then(result => {
        if (cancelled) return;
        if (!result) {
          setHealthError('서버에 연결할 수 없습니다.');
        } else {
          setHealth(result);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setHealthError(err instanceof Error ? err.message : '서버 정보를 가져올 수 없습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoadingHealth(false);
      });
    return () => { cancelled = true; };
  }, []);

  const apiUrl = getApiUrl();

  return (
    <div className="row" style={{ paddingTop: '10px' }}>
      <div className="col-lg-10">
        <h2>정보</h2>
        <p className="text-muted">{APP_NAME}의 서버/클라이언트 버전 및 주요 설정 정보입니다.</p>

        <div className="card mb-3">
          <div className="card-header"><strong>버전</strong></div>
          <div className="card-body">
            <InfoRow label="클라이언트" value={`v${APP_VERSION}`} />
            <InfoRow
              label="서버"
              value={
                loadingHealth ? '확인 중...'
                  : health ? `v${health.serverVersion}`
                  : '알 수 없음'
              }
            />
            <InfoRow
              label="지원 최소 클라이언트 버전"
              value={
                loadingHealth ? '확인 중...'
                  : health ? `v${health.minClientVersion}`
                  : '알 수 없음'
              }
            />
            <InfoRow
              label="연결 상태"
              value={
                loadingHealth ? '확인 중...' : isOnline ? '온라인' : '오프라인'
              }
            />
            {healthError && <div className="alert alert-warning py-2 mb-0 mt-2"><small>{healthError}</small></div>}
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header d-flex justify-content-between align-items-center">
            <strong>설정값</strong>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              aria-expanded={showSettings}
              onClick={() => setShowSettings(s => !s)}
            >
              {showSettings ? '숨기기' : '표시'}
            </button>
          </div>
          {showSettings ? (
            <div className="card-body">
              <h6 className="mt-0">클라이언트</h6>
              <InfoRow label="API 서버 URL" value={apiUrl} />
              <InfoRow label="기본 API 서버 URL" value={DEFAULT_API_URL} />
              <InfoRow label="테마 모드" value={themeMode} />
              <InfoRow label="적용된 테마" value={theme} />

              <hr />

              <h6>서버</h6>
              {loadingHealth && <div className="text-muted">불러오는 중...</div>}
              {!loadingHealth && !health && <div className="text-muted">서버 정보를 가져올 수 없습니다.</div>}
              {health && (
                <>
                  <InfoRow label="X 로그인" value={health.xLoginEnabled ? '활성화' : '비활성화'} />
                  <InfoRow label="Mastodon 로그인" value={health.mastodonLoginEnabled ? '활성화' : '비활성화'} />
                  {health.mastodonServers && health.mastodonServers.length > 0 && (
                    <InfoRow
                      label="Mastodon 서버 수"
                      value={`${health.mastodonServers.length}개`}
                    />
                  )}
                  <InfoRow label="Cloudflare Turnstile" value={health.turnstileEnabled ? '활성화' : '비활성화'} />
                </>
              )}
              <div className="alert alert-secondary py-2 mb-0 mt-3">
                <small>
                  ⚠️ JWT 시크릿, SMTP 자격 증명, OAuth 클라이언트 시크릿 등 민감한 설정값은 보안상 표시되지 않습니다.
                </small>
              </div>
            </div>
          ) : (
            <div className="card-body text-muted">
              <small>민감 정보 노출을 방지하기 위해 기본적으로 숨겨져 있습니다. 표시 버튼을 눌러 확인하세요.</small>
            </div>
          )}
        </div>

        <div className="card mb-3">
          <div className="card-header"><strong>변경 이력</strong></div>
          <div className="card-body d-flex flex-wrap gap-2">
            <Link to="/changelog" className="btn btn-outline-primary">클라이언트 변경 이력</Link>
            <Link to="/server-changelog" className="btn btn-outline-primary">서버 변경 이력</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
