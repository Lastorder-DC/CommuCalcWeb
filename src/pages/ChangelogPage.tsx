import { useEffect, useState, useCallback } from 'react';
import ChangelogView from '../components/ChangelogView';
import type { ChangelogData } from '../types';

/** 클라이언트 변경 이력. `public/changelog.json`을 상대 경로로 가져옵니다. */
export default function ChangelogPage() {
  const [data, setData] = useState<ChangelogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetch(`${import.meta.env.BASE_URL}changelog.json`, { cache: 'no-cache' })
      .then(async res => {
        if (!res.ok) throw new Error(`changelog.json을 가져올 수 없습니다. (HTTP ${res.status})`);
        return res.json() as Promise<ChangelogData>;
      })
      .then(json => {
        if (!cancelled) setData(json);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '변경 이력을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  return (
    <ChangelogView
      title="클라이언트 변경 이력"
      data={data}
      loading={loading}
      error={error}
      onRetry={load}
    />
  );
}
