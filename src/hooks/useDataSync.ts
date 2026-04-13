import { useCallback } from 'react';
import { useAuth } from '../contexts/useAuth';
import { useConnection } from '../contexts/useConnection';
import * as apiService from '../services/apiService';
import { storageService } from '../services/storageService';
import type { SaveData } from '../types';

/** 데이터 카테고리 */
export type DataCategory = 'characters' | 'enemyCharacters' | 'messageTemplates' | 'formulaSettings' | 'battleLog';

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
      throw err;
    }
  }, [isLoggedIn, isOnline]);

  /** 특정 카테고리만 서버에 저장합니다. */
  const syncCategoryToServer = useCallback(async (category: DataCategory) => {
    if (!isLoggedIn || !isOnline) return;

    try {
      const partial: Partial<SaveData> = {};
      switch (category) {
        case 'characters':
          partial.characters = storageService.getCharacters();
          break;
        case 'enemyCharacters':
          partial.enemyCharacters = storageService.getEnemyCharacters();
          break;
        case 'messageTemplates':
          partial.messageTemplates = storageService.getMessageTemplates();
          break;
        case 'formulaSettings':
          partial.pvpDamageFormula = storageService.getPvpDamageFormula();
          partial.pveDamageFormula = storageService.getPveDamageFormula();
          partial.pvpCustomFormula = storageService.getPvpCustomFormula();
          partial.pveCustomFormula = storageService.getPveCustomFormula();
          break;
        case 'battleLog':
          partial.battleLog = storageService.getBattleLog();
          break;
      }
      await apiService.savePartialUserData(partial);
    } catch (err) {
      console.error(`${category} 서버 저장 실패:`, err);
      throw err;
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
      throw err;
    }
    return false;
  }, [isLoggedIn, isOnline]);

  /** 서버에서 특정 카테고리만 불러와 로컬에 적용합니다. */
  const syncCategoryFromServer = useCallback(async (category: DataCategory) => {
    if (!isLoggedIn || !isOnline) return false;

    try {
      const data = await apiService.loadUserData();
      if (!data) return false;

      switch (category) {
        case 'characters':
          if (data.characters) storageService.setCharacters(data.characters);
          break;
        case 'enemyCharacters':
          if (data.enemyCharacters) storageService.setEnemyCharacters(data.enemyCharacters);
          break;
        case 'messageTemplates':
          if (data.messageTemplates) {
            for (const key of Object.keys(data.messageTemplates) as (keyof typeof data.messageTemplates)[]) {
              storageService.setMessageTemplate(key, data.messageTemplates[key]);
            }
          }
          break;
        case 'formulaSettings':
          if (data.pvpDamageFormula) storageService.setPvpDamageFormula(data.pvpDamageFormula);
          if (data.pveDamageFormula) storageService.setPveDamageFormula(data.pveDamageFormula);
          if (data.pvpCustomFormula) storageService.setPvpCustomFormula(data.pvpCustomFormula);
          if (data.pveCustomFormula) storageService.setPveCustomFormula(data.pveCustomFormula);
          break;
        case 'battleLog':
          if (data.battleLog) storageService.setBattleLog(data.battleLog);
          break;
      }
      return true;
    } catch (err) {
      console.error(`${category} 서버 불러오기 실패:`, err);
      throw err;
    }
  }, [isLoggedIn, isOnline]);

  return {
    syncToServer,
    syncFromServer,
    syncCategoryToServer,
    syncCategoryFromServer,
    canSync: isLoggedIn && isOnline,
  };
}
