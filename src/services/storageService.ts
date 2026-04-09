import type { Character, MessageTemplates, SaveData } from '../types';

const STORAGE_KEYS = {
  charlist: 'charlist',
  atksuccess: 'atksuccess',
  atkfailed: 'atkfailed',
  defsuccess: 'defsuccess',
  deffailed: 'deffailed',
  enemyname: 'enemyname',
  enemyhp: 'enemyhp',
  enemyatk: 'enemyatk',
  atkdef: 'atkdef',
  charname: 'charname',
} as const;

/** 기본 메세지 템플릿 */
export const DEFAULT_TEMPLATES: MessageTemplates = {
  atksuccess:
    '%캐이름%의 공격! [다이스: %캐다이스% vs %적다이스%]\n' +
    '%적이름%에게 %데미지%의 피해를 입혔다!\n' +
    '%적이름%의 남은 체력: %적체력%',
  atkfailed:
    '%캐이름%의 공격이 빗나갔다! [다이스: %캐다이스% vs %적다이스%]\n' +
    '%적이름%의 반격! %캐이름%에게 %데미지%의 피해!\n' +
    '%캐이름%의 남은 체력: %캐체력%',
  defsuccess:
    '%캐이름이/가% %적이름%의 공격을 막아냈다! [다이스: %캐다이스% vs %적다이스%]\n' +
    '피해 없음! %캐이름%의 체력: %캐체력%',
  deffailed:
    '%캐이름이/가% %적이름%의 공격을 막지 못했다! [다이스: %캐다이스% vs %적다이스%]\n' +
    '%적이름%의 공격! %캐이름%에게 %데미지%의 피해!\n' +
    '%캐이름%의 남은 체력: %캐체력%',
};

/** 기본 캐릭터 데이터 */
export const DEFAULT_CHARACTERS: Character[] = [
  { id: 1, num: 1, name: '캐릭터 이름 1', atk: 5, def: 5, atkb: 0, defb: 0, debuff: '-0', hp: 100 },
  { id: 2, num: 2, name: '캐릭터 이름 2', atk: 5, def: 5, atkb: 0, defb: 0, debuff: '-0', hp: 100 },
];

/**
 * 스토리지 서비스
 * 현재는 localStorage를 사용하지만, 추후 서버 API로 교체 가능하도록 인터페이스를 분리합니다.
 */
export interface IStorageService {
  getCharacters(): Character[];
  setCharacters(chars: Character[]): void;
  getMessageTemplates(): MessageTemplates;
  setMessageTemplate(key: keyof MessageTemplates, value: string): void;
  getEnemyName(): string;
  setEnemyName(name: string): void;
  getEnemyHp(): number;
  setEnemyHp(hp: number): void;
  getEnemyAtk(): number;
  setEnemyAtk(atk: number): void;
  getBattleMode(): 'atk' | 'def';
  setBattleMode(mode: 'atk' | 'def'): void;
  getSelectedChar(): string | null;
  setSelectedChar(value: string): void;
  exportAll(): SaveData;
  importAll(data: SaveData): void;
}

/** localStorage 기반 스토리지 구현 */
class LocalStorageService implements IStorageService {
  getCharacters(): Character[] {
    const raw = localStorage.getItem(STORAGE_KEYS.charlist);
    if (!raw) {
      this.setCharacters(DEFAULT_CHARACTERS);
      return [...DEFAULT_CHARACTERS];
    }
    return JSON.parse(raw) as Character[];
  }

  setCharacters(chars: Character[]): void {
    localStorage.setItem(STORAGE_KEYS.charlist, JSON.stringify(chars));
  }

  getMessageTemplates(): MessageTemplates {
    return {
      atksuccess: localStorage.getItem(STORAGE_KEYS.atksuccess) || DEFAULT_TEMPLATES.atksuccess,
      atkfailed: localStorage.getItem(STORAGE_KEYS.atkfailed) || DEFAULT_TEMPLATES.atkfailed,
      defsuccess: localStorage.getItem(STORAGE_KEYS.defsuccess) || DEFAULT_TEMPLATES.defsuccess,
      deffailed: localStorage.getItem(STORAGE_KEYS.deffailed) || DEFAULT_TEMPLATES.deffailed,
    };
  }

  setMessageTemplate(key: keyof MessageTemplates, value: string): void {
    localStorage.setItem(key, value);
  }

  getEnemyName(): string {
    return localStorage.getItem(STORAGE_KEYS.enemyname) || '';
  }

  setEnemyName(name: string): void {
    localStorage.setItem(STORAGE_KEYS.enemyname, name);
  }

  getEnemyHp(): number {
    return parseInt(localStorage.getItem(STORAGE_KEYS.enemyhp) || '10', 10);
  }

  setEnemyHp(hp: number): void {
    localStorage.setItem(STORAGE_KEYS.enemyhp, String(hp));
  }

  getEnemyAtk(): number {
    return parseInt(localStorage.getItem(STORAGE_KEYS.enemyatk) || '2', 10);
  }

  setEnemyAtk(atk: number): void {
    localStorage.setItem(STORAGE_KEYS.enemyatk, String(atk));
  }

  getBattleMode(): 'atk' | 'def' {
    return (localStorage.getItem(STORAGE_KEYS.atkdef) as 'atk' | 'def') || 'atk';
  }

  setBattleMode(mode: 'atk' | 'def'): void {
    localStorage.setItem(STORAGE_KEYS.atkdef, mode);
  }

  getSelectedChar(): string | null {
    return localStorage.getItem(STORAGE_KEYS.charname);
  }

  setSelectedChar(value: string): void {
    localStorage.setItem(STORAGE_KEYS.charname, value);
  }

  exportAll(): SaveData {
    return {
      characters: this.getCharacters(),
      messageTemplates: this.getMessageTemplates(),
      enemyName: this.getEnemyName(),
      enemyHp: this.getEnemyHp(),
      enemyAtk: this.getEnemyAtk(),
    };
  }

  importAll(data: SaveData): void {
    this.setCharacters(data.characters);
    for (const key of Object.keys(data.messageTemplates) as (keyof MessageTemplates)[]) {
      this.setMessageTemplate(key, data.messageTemplates[key]);
    }
    this.setEnemyName(data.enemyName);
    this.setEnemyHp(data.enemyHp);
    this.setEnemyAtk(data.enemyAtk);
  }
}

/** 스토리지 서비스 싱글턴 인스턴스 */
export const storageService: IStorageService = new LocalStorageService();
