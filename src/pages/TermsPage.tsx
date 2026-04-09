import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { getTermsOfService } from '../services/apiService';
import { useConnection } from '../contexts/useConnection';

export default function TermsPage() {
  const { isOnline } = useConnection();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOnline) {
      setError('오프라인 모드에서는 이용약관을 불러올 수 없습니다.');
      setLoading(false);
      return;
    }

    getTermsOfService()
      .then(html => setContent(DOMPurify.sanitize(html)))
      .catch(err => setError(err instanceof Error ? err.message : '이용약관을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [isOnline]);

  return (
    <div className="row" style={{ paddingTop: '10px' }}>
      <div className="col-12">
        <h2>이용약관</h2>
        {loading && <div className="text-muted">불러오는 중...</div>}
        {error && <div className="alert alert-warning">{error}</div>}
        {content && (
          <div
            className="card p-4"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </div>
  );
}
