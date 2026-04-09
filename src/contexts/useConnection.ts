import { useContext } from 'react';
import { ConnectionContext, type ConnectionContextType } from './ConnectionContextDef';

export function useConnection(): ConnectionContextType {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}
