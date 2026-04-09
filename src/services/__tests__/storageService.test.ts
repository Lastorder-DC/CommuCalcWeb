import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const key of Object.keys(store)) delete store[key]; },
  get length() { return Object.keys(store).length; },
  key: (index: number) => Object.keys(store)[index] ?? null,
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// Now import after localStorage is mocked
const { storageService, DEFAULT_TEMPLATES, DEFAULT_CHARACTERS, DEFAULT_ENEMY_CHARACTERS } = await import('../storageService');

describe('storageService', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('characters', () => {
    it('returns default characters when none stored', () => {
      const chars = storageService.getCharacters();
      expect(chars).toEqual(DEFAULT_CHARACTERS);
    });

    it('stores and retrieves characters', () => {
      const chars = [{ id: 1, num: 1, name: 'TestChar', atk: 10, def: 5, atkb: 1, defb: 2, debuff: '-1', hp: 50 }];
      storageService.setCharacters(chars);
      expect(storageService.getCharacters()).toEqual(chars);
    });
  });

  describe('enemy characters', () => {
    it('returns default enemy characters when none stored', () => {
      const chars = storageService.getEnemyCharacters();
      expect(chars).toEqual(DEFAULT_ENEMY_CHARACTERS);
    });

    it('stores and retrieves enemy characters', () => {
      const chars = [{ id: 1, num: 1, name: 'Enemy1', atk: 3, hp: 20 }];
      storageService.setEnemyCharacters(chars);
      expect(storageService.getEnemyCharacters()).toEqual(chars);
    });
  });

  describe('message templates', () => {
    it('returns default templates when none stored', () => {
      expect(storageService.getMessageTemplates()).toEqual(DEFAULT_TEMPLATES);
    });

    it('stores and retrieves individual templates', () => {
      storageService.setMessageTemplate('atksuccess', '커스텀 공격 성공');
      const templates = storageService.getMessageTemplates();
      expect(templates.atksuccess).toBe('커스텀 공격 성공');
      expect(templates.atkfailed).toBe(DEFAULT_TEMPLATES.atkfailed);
    });
  });

  describe('enemy state', () => {
    it('returns defaults for enemy name, hp, atk', () => {
      expect(storageService.getEnemyName()).toBe('');
      expect(storageService.getEnemyHp()).toBe(10);
      expect(storageService.getEnemyAtk()).toBe(2);
    });

    it('stores and retrieves enemy state', () => {
      storageService.setEnemyName('보스');
      storageService.setEnemyHp(50);
      storageService.setEnemyAtk(8);
      expect(storageService.getEnemyName()).toBe('보스');
      expect(storageService.getEnemyHp()).toBe(50);
      expect(storageService.getEnemyAtk()).toBe(8);
    });
  });

  describe('battle mode and type', () => {
    it('returns defaults', () => {
      expect(storageService.getBattleMode()).toBe('atk');
      expect(storageService.getBattleType()).toBe('pve');
    });

    it('stores and retrieves battle mode', () => {
      storageService.setBattleMode('def');
      expect(storageService.getBattleMode()).toBe('def');
    });

    it('stores and retrieves battle type', () => {
      storageService.setBattleType('pvp');
      expect(storageService.getBattleType()).toBe('pvp');
    });
  });

  describe('selected characters', () => {
    it('returns null when no selection', () => {
      expect(storageService.getSelectedChar()).toBeNull();
      expect(storageService.getSelectedEnemy()).toBeNull();
    });

    it('stores and retrieves selected char/enemy', () => {
      storageService.setSelectedChar('1');
      storageService.setSelectedEnemy('2');
      expect(storageService.getSelectedChar()).toBe('1');
      expect(storageService.getSelectedEnemy()).toBe('2');
    });
  });

  describe('exportAll / importAll', () => {
    it('round-trips all data', () => {
      storageService.setCharacters([{ id: 1, num: 1, name: 'A', atk: 1, def: 1, atkb: 0, defb: 0, debuff: '0', hp: 10 }]);
      storageService.setEnemyCharacters([{ id: 1, num: 1, name: 'E', atk: 3, hp: 5 }]);
      storageService.setMessageTemplate('atksuccess', 'custom');
      storageService.setEnemyName('Boss');
      storageService.setEnemyHp(99);
      storageService.setEnemyAtk(7);

      const exported = storageService.exportAll();
      localStorageMock.clear();

      storageService.importAll(exported);
      expect(storageService.getCharacters()).toEqual(exported.characters);
      expect(storageService.getEnemyCharacters()).toEqual(exported.enemyCharacters);
      expect(storageService.getMessageTemplates().atksuccess).toBe('custom');
      expect(storageService.getEnemyName()).toBe('Boss');
      expect(storageService.getEnemyHp()).toBe(99);
      expect(storageService.getEnemyAtk()).toBe(7);
    });
  });
});
