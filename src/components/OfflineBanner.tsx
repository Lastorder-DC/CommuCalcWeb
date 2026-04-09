import { useConnection } from '../contexts/useConnection';

export default function OfflineBanner() {
  const { isOnline, isChecking, needsUpdate, retry } = useConnection();

  if (needsUpdate) {
    return (
      <div className="offline-banner alert alert-info mb-0" role="alert" style={{
        position: 'sticky',
        top: 0,
        zIndex: 1040,
        borderRadius: 0,
        textAlign: 'center',
      }}>
        <strong>업데이트 필요:</strong> 새로운 버전이 출시되었습니다. 페이지를 새로고침해주세요.
        <button type="button" className="btn btn-sm btn-outline-primary ms-2" onClick={() => location.reload()}>
          새로고침
        </button>
      </div>
    );
  }

  if (isOnline || isChecking) return null;

  return (
    <div className="offline-banner alert alert-warning mb-0" role="alert" style={{
      position: 'sticky',
      top: 0,
      zIndex: 1040,
      borderRadius: 0,
      textAlign: 'center',
    }}>
      <strong>오프라인 모드:</strong> API 서버에 연결할 수 없습니다. 로그인 기능이 비활성화됩니다.
      <button type="button" className="btn btn-sm btn-outline-dark ms-2" onClick={retry}>
        재연결
      </button>
    </div>
  );
}
