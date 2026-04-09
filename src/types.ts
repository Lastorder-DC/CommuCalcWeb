/** 캐릭터 데이터 타입 */
export interface Character {
  id: number;
  num: number;
  name: string;
  atk: number;
  def: number;
  atkb: number;
  defb: number;
  debuff: string;
  hp: number;
}

/** 메세지 템플릿 키 */
export type MessageTemplateKey = 'atksuccess' | 'atkfailed' | 'defsuccess' | 'deffailed';

/** 메세지 템플릿 전체 */
export type MessageTemplates = Record<MessageTemplateKey, string>;

/** 전투 모드 */
export type BattleMode = 'atk' | 'def';

/** 전투 결과 */
export interface BattleResult {
  success: boolean;
  message: string;
  damage: number;
  enemyDice: number;
  charDice: number;
}

/** 사용자 정보 (추후 로그인 기능용) */
export interface User {
  id: string;
  username: string;
  email?: string;
}

/** 저장 데이터 형식 (추후 DB 저장/불러오기용) */
export interface SaveData {
  characters: Character[];
  messageTemplates: MessageTemplates;
  enemyName: string;
  enemyHp: number;
  enemyAtk: number;
}
