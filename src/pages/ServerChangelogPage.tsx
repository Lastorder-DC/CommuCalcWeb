import { useEffect, useState, useCallback } from 'react';
import ChangelogView from '../components/ChangelogView';
import { getServerChangelog } from '../services/apiService';
import { useConnection } from '../contexts/useConnection';
import type { ChangelogData } from '../types';

/** 서버 변경 이력. 서버의 `/changelog` API를 호출합니다. */
export default function ServerChangelogPage() {
  const { isOnline } = useConnection();
  const [data, setData] = useState<ChangelogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    if (!isOnline) {
      setError('오프라인 모드에서는 서버 변경 이력을 불러올 수 없습니다.');
      setLoading(false);
      return () => { cancelled = true; };
    }

    getServerChangelog()
      .then(json => {
        if (!cancelled) setData(json);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '서버 변경 이력을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOnline]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  return (
    <ChangelogView
      title="서버 변경 이력"
      data={data}
      loading={loading}
      error={error}
      onRetry={load}
    />
  );
}
