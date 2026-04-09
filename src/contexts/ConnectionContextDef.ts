import { createContext } from 'react';

export interface ConnectionContextType {
  /** API 서버 연결 상태 */
  isOnline: boolean;
  /** 연결 테스트 중 여부 */
  isChecking: boolean;
  /** 클라이언트 업데이트 필요 여부 */
  needsUpdate: boolean;
  /** 연결 재시도 */
  retry: () => void;
}

export const ConnectionContext = createContext<ConnectionContextType | null>(null);
