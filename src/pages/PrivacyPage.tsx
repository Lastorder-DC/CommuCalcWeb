import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { getPrivacyPolicy } from '../services/apiService';
import { useConnection } from '../contexts/useConnection';

export default function PrivacyPage() {
  const { isOnline } = useConnection();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOnline) {
      setError('오프라인 모드에서는 개인정보처리방침을 불러올 수 없습니다.');
      setLoading(false);
      return;
    }

    getPrivacyPolicy()
      .then(setContent)
      .catch(err => setError(err instanceof Error ? err.message : '개인정보처리방침을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [isOnline]);

  return (
    <div className="row" style={{ paddingTop: '10px' }}>
      <div className="col-12">
        <h2>개인정보처리방침</h2>
        {loading && <div className="text-muted">불러오는 중...</div>}
        {error && <div className="alert alert-warning">{error}</div>}
        {content && (
          <div className="card p-4">
            <Markdown>{content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
