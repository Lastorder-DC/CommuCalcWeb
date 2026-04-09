import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { ConnectionContext } from './ConnectionContextDef';
import { testConnection } from '../services/apiService';

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await testConnection();
      setIsOnline(result);
    } catch {
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return (
    <ConnectionContext value={{
      isOnline,
      isChecking,
      retry: checkConnection,
    }}>
      {children}
    </ConnectionContext>
  );
}
