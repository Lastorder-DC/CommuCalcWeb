import { use } from 'react';
import { ThemeContext } from './ThemeContextDef';

export function useTheme() {
  return use(ThemeContext);
}
