import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { ConnectionContext } from './ConnectionContextDef';
import { testConnection } from '../services/apiService';
import { APP_VERSION } from '../config';

/** 세 자리 semver 비교: a < b 이면 true */
function isVersionBelow(current: string, minimum: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const c = parse(current);
  const m = parse(minimum);
  for (let i = 0; i < 3; i++) {
    if ((c[i] ?? 0) < (m[i] ?? 0)) return true;
    if ((c[i] ?? 0) > (m[i] ?? 0)) return false;
  }
  return false;
}

/** Health 체크 간격 (5분) */
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [xLoginEnabled, setXLoginEnabled] = useState(false);
  const [mastodonLoginEnabled, setMastodonLoginEnabled] = useState(false);
  const [mastodonServerName, setMastodonServerName] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await testConnection();
      if (result) {
        setIsOnline(true);
        if (result.minClientVersion && isVersionBelow(APP_VERSION, result.minClientVersion)) {
          setNeedsUpdate(true);
        }
        setXLoginEnabled(!!result.xLoginEnabled);
        setMastodonLoginEnabled(!!result.mastodonLoginEnabled);
        setMastodonServerName(result.mastodonServerName || '');
      } else {
        setIsOnline(false);
        setXLoginEnabled(false);
        setMastodonLoginEnabled(false);
        setMastodonServerName('');
      }
    } catch {
      setIsOnline(false);
      setXLoginEnabled(false);
      setMastodonLoginEnabled(false);
      setMastodonServerName('');
    } finally {
      setIsChecking(false);
    }
  }, []);

  // 초기 체크 + 5분 간격 주기적 체크
  useEffect(() => {
    checkConnection();

    intervalRef.current = setInterval(checkConnection, HEALTH_CHECK_INTERVAL);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkConnection]);

  return (
    <ConnectionContext value={{
      isOnline,
      isChecking,
      needsUpdate,
      xLoginEnabled,
      mastodonLoginEnabled,
      mastodonServerName,
      retry: checkConnection,
    }}>
      {children}
    </ConnectionContext>
  );
}
