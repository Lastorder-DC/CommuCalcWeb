import { useCallback } from 'react';
import { useAuth } from '../contexts/useAuth';
import { useConnection } from '../contexts/useConnection';
import * as apiService from '../services/apiService';
import { storageService } from '../services/storageService';

/**
 * 데이터 동기화 훅
 * 로그인 상태에서 서버와 데이터를 동기화합니다.
 */
export function useDataSync() {
  const { isLoggedIn } = useAuth();
  const { isOnline } = useConnection();

  /** 서버에 현재 로컬 데이터를 저장합니다. */
  const syncToServer = useCallback(async () => {
    if (!isLoggedIn || !isOnline) return;

    try {
      const data = storageService.exportAll();
      await apiService.saveUserData(data);
    } catch (err) {
      console.error('서버 동기화 실패:', err);
    }
  }, [isLoggedIn, isOnline]);

  /** 서버에서 데이터를 불러와 로컬에 적용합니다. */
  const syncFromServer = useCallback(async () => {
    if (!isLoggedIn || !isOnline) return false;

    try {
      const data = await apiService.loadUserData();
      if (data) {
        storageService.importAll(data);
        return true;
      }
    } catch (err) {
      console.error('서버에서 데이터 불러오기 실패:', err);
    }
    return false;
  }, [isLoggedIn, isOnline]);

  return {
    syncToServer,
    syncFromServer,
    canSync: isLoggedIn && isOnline,
  };
}
