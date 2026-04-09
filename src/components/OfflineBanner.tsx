import { useConnection } from '../contexts/useConnection';

export default function OfflineBanner() {
  const { isOnline, isChecking, retry } = useConnection();

  if (isOnline || isChecking) return null;

  return (
    <div className="alert alert-warning alert-dismissible mb-0" role="alert" style={{
      position: 'fixed',
      bottom: '60px',
      left: 0,
      right: 0,
      zIndex: 1050,
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
