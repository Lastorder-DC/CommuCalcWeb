/** 앱 버전 및 설정을 중앙에서 관리합니다. */
export const APP_VERSION = '0.8.0';
export const APP_NAME = '커뮤 전투 계산기';
export const APP_TITLE = `${APP_NAME}(v${APP_VERSION})`;

/** 기본 API 서버 URL */
export const DEFAULT_API_URL = 'https://api.calc.yumeka.xyz';

/** API 서버 URL 저장 키 */
const API_URL_STORAGE_KEY = 'api_server_url';

/** 현재 설정된 API 서버 URL을 반환합니다. */
export function getApiUrl(): string {
  return localStorage.getItem(API_URL_STORAGE_KEY) || DEFAULT_API_URL;
}

/** API 서버 URL을 설정합니다. */
export function setApiUrl(url: string): void {
  if (url && url !== DEFAULT_API_URL) {
    localStorage.setItem(API_URL_STORAGE_KEY, url);
  } else {
    localStorage.removeItem(API_URL_STORAGE_KEY);
  }
}

/** API 연결 재시도 횟수 */
export const API_RETRY_COUNT = 3;

/** API 연결 재시도 간격(ms) */
export const API_RETRY_DELAY = 2000;
