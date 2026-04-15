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
  maxHp: number;
  hp: number;
}

/** 적 캐릭터 데이터 타입 */
export interface EnemyCharacter {
  id: number;
  num: number;
  name: string;
  atk: number;
  maxHp: number;
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

/** 데미지 계산식 타입 */
export type DamageFormulaType = 'add' | 'multiply' | 'custom';

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
  /** 비밀번호가 설정되어 있는지 여부 */
  hasPassword?: boolean;
  /** X 계정이 연동되어 있는지 여부 */
  xLinked?: boolean;
  /** Mastodon 계정이 연동되어 있는지 여부 */
  mastodonLinked?: boolean;
}

/** 저장 데이터 형식 */
export interface SaveData {
  characters: Character[];
  enemyCharacters: EnemyCharacter[];
  messageTemplates: MessageTemplates;
  enemyName: string;
  enemyHp: number;
  enemyAtk: number;
  pvpDamageFormula?: DamageFormulaType;
  pveDamageFormula?: DamageFormulaType;
  pvpCustomFormula?: string;
  pveCustomFormula?: string;
  battleLog?: BattleLogEntry[];
}

/** 전투 기록 항목 */
export interface BattleLogEntry {
  timestamp: string;
  battleType: BattleType;
  battleMode: BattleMode;
  charName: string;
  enemyName: string;
  success: boolean;
  damage: number;
  charDice: number;
  enemyDice: number;
  message: string;
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

/** Mastodon 서버 정보 (health 응답에서 전달) */
export interface MastodonServerInfo {
  /** 서버 인덱스 (0부터 시작, 최대 4) */
  index: number;
  /** 로그인 버튼에 표시할 서버 이름 */
  serverName?: string;
  /** 커스텀 서버 아이콘 URL (svg, png 등) */
  iconUrl?: string;
}

/** Health 엔드포인트 응답 */
export interface HealthResponse {
  status: string;
  serverVersion: string;
  minClientVersion: string;
  xLoginEnabled?: boolean;
  mastodonLoginEnabled?: boolean;
  /** @deprecated mastodonServers 사용 */
  mastodonServerName?: string;
  /** 구성된 Mastodon 서버 목록 */
  mastodonServers?: MastodonServerInfo[];
}

/** OAuth 가입 미완료 응답 (이메일 입력 필요) */
export interface OAuthNeedsEmailResponse {
  needsEmail: true;
  provider: 'x' | 'mastodon';
  providerId: string;
  username: string;
  /** X API 등에서 가져온 이메일 (사전 입력용, 선택사항) */
  email?: string;
}

/** OAuth 콜백 응답 (로그인 성공 또는 이메일 입력 필요) */
export type OAuthCallbackResponse = AuthResponse | OAuthNeedsEmailResponse;
