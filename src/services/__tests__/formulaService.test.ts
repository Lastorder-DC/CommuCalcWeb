import { describe, it, expect } from 'vitest';
import { validateFormula, evaluateFormula, formatFormulaStr } from '../formulaService';

describe('validateFormula', () => {
  it('validates simple addition formula', () => {
    expect(validateFormula('적공격력 + 적다이스 - 방어력 - 방어구')).toBeNull();
  });

  it('validates multiplication formula', () => {
    expect(validateFormula('적다이스 * 적공격력 - 방어력 - 방어구')).toBeNull();
  });

  it('validates formula with max function', () => {
    expect(validateFormula('max(적공격력, 적다이스) * 2 - 방어력')).toBeNull();
  });

  it('validates formula with min function', () => {
    expect(validateFormula('min(적공격력, 적다이스) + 공격력')).toBeNull();
  });

  it('validates formula with parentheses', () => {
    expect(validateFormula('(적공격력 + 적다이스) * 2')).toBeNull();
  });

  it('validates formula with numbers', () => {
    expect(validateFormula('적공격력 * 2 + 3')).toBeNull();
  });

  it('rejects empty formula', () => {
    expect(validateFormula('')).not.toBeNull();
  });

  it('rejects whitespace-only formula', () => {
    expect(validateFormula('   ')).not.toBeNull();
  });

  it('rejects unknown variable', () => {
    expect(validateFormula('알수없는변수 + 적공격력')).not.toBeNull();
  });

  it('rejects unclosed parenthesis', () => {
    expect(validateFormula('(적공격력 + 적다이스')).not.toBeNull();
  });

  it('rejects incomplete expression', () => {
    expect(validateFormula('적공격력 +')).not.toBeNull();
  });

  it('rejects unknown characters', () => {
    expect(validateFormula('적공격력 @ 적다이스')).not.toBeNull();
  });
});

describe('evaluateFormula', () => {
  const vars = {
    적공격력: 5,
    적다이스: 3,
    방어력: 2,
    방어구: 1,
    공격력: 10,
    무기: 3,
  };

  it('evaluates addition formula', () => {
    expect(evaluateFormula('적공격력 + 적다이스 - 방어력 - 방어구', vars)).toBe(5);
  });

  it('evaluates multiplication formula', () => {
    expect(evaluateFormula('적다이스 * 적공격력 - 방어력 - 방어구', vars)).toBe(12);
  });

  it('clamps result to 0 minimum', () => {
    expect(evaluateFormula('적다이스 - 적공격력 - 방어력 - 방어구', vars)).toBe(0);
  });

  it('evaluates max function', () => {
    expect(evaluateFormula('max(적공격력, 적다이스)', vars)).toBe(5);
  });

  it('evaluates min function', () => {
    expect(evaluateFormula('min(적공격력, 적다이스)', vars)).toBe(3);
  });

  it('evaluates with parentheses', () => {
    expect(evaluateFormula('(적공격력 + 적다이스) * 2', vars)).toBe(16);
  });

  it('evaluates with number literals', () => {
    expect(evaluateFormula('적공격력 * 2 + 3', vars)).toBe(13);
  });

  it('evaluates unary minus', () => {
    expect(evaluateFormula('-적공격력 + 적다이스', vars)).toBe(0);
  });
});

describe('formatFormulaStr', () => {
  const vars = {
    적공격력: 5,
    적다이스: 3,
    방어력: 2,
    방어구: 1,
    공격력: 10,
    무기: 3,
  };

  it('formats formula with variable values', () => {
    const result = formatFormulaStr('적공격력 + 적다이스', vars, 8);
    expect(result).toContain('적공격력(5)');
    expect(result).toContain('적다이스(3)');
    expect(result).toContain('= 8');
  });
});
