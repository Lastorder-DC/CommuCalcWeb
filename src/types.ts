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

/** 적 캐릭터 데이터 타입 */
export interface EnemyCharacter {
  id: number;
  num: number;
  name: string;
  atk: number;
  hp: number;
}

/** 메세지 템플릿 키 */
export type MessageTemplateKey = 'atksuccess' | 'atkfailed' | 'defsuccess' | 'deffailed';

/** 메세지 템플릿 전체 */
export type MessageTemplates = Record<MessageTemplateKey, string>;

/** 전투 모드 */
export type BattleMode = 'atk' | 'def';

/** 전투 타입 (PvE: 아군 vs 적군, PvP: 아군 vs 아군) */
export type BattleType = 'pve' | 'pvp';

/** 전투 결과 */
export interface BattleResult {
  success: boolean;
  message: string;
  damage: number;
  enemyDice: number;
  charDice: number;
}

/** 사용자 정보 */
export interface User {
  id: string;
  username: string;
  email: string;
}

/** 저장 데이터 형식 */
export interface SaveData {
  characters: Character[];
  enemyCharacters: EnemyCharacter[];
  messageTemplates: MessageTemplates;
  enemyName: string;
  enemyHp: number;
  enemyAtk: number;
}

/** API 로그인 요청 */
export interface LoginRequest {
  email: string;
  password: string;
}

/** API 회원가입 요청 */
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

/** API 인증 응답 */
export interface AuthResponse {
  token: string;
  user: User;
}

/** API 에러 응답 */
export interface ApiError {
  message: string;
  code?: string;
}

/** Health 엔드포인트 응답 */
export interface HealthResponse {
  status: string;
  serverVersion: string;
  minClientVersion: string;
}
