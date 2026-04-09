import { describe, it, expect, vi } from 'vitest';
import { dice, replaceValue, calculateBattle } from '../battleService';
import type { Character, MessageTemplates } from '../../types';

describe('dice', () => {
  it('returns a value between 1 and max', () => {
    for (let i = 0; i < 100; i++) {
      const result = dice(6);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  it('returns 1 when max is 1', () => {
    expect(dice(1)).toBe(1);
  });
});

describe('replaceValue', () => {
  it('replaces all basic placeholders', () => {
    const msg = '%적이름% %캐이름% %적다이스% %캐다이스% %적체력% %캐체력% %데미지% %계산식%';
    const result = replaceValue(msg, '드래곤', '홍길동', 5, 3, 8, 90, 10, '0', '공격력(5) + 무기(5) = 10');
    expect(result).toBe('드래곤 홍길동 5 3 8 90 10 공격력(5) + 무기(5) = 10');
  });

  it('includes debuff info when debuff is non-zero', () => {
    const msg = '%캐다이스%';
    const result = replaceValue(msg, '', '', 1, 4, 0, 0, 0, '-1', '');
    expect(result).toBe('4(디버프 -1)');
  });

  it('does not include debuff info when debuff is 0', () => {
    const msg = '%캐다이스%';
    const result = replaceValue(msg, '', '', 1, 4, 0, 0, 0, '0', '');
    expect(result).toBe('4');
  });

  it('replaces %계산식% placeholder', () => {
    const msg = '계산식: %계산식%';
    const result = replaceValue(msg, '', '', 1, 1, 0, 0, 5, '0', 'max(0, 적다이스(3) × 적공격력(2) - 방어력(1) - 방어구(0)) = 5');
    expect(result).toBe('계산식: max(0, 적다이스(3) × 적공격력(2) - 방어력(1) - 방어구(0)) = 5');
  });
});

describe('calculateBattle', () => {
  const baseChar: Character = {
    id: 1, num: 1, name: '테스트', atk: 5, def: 5, atkb: 0, defb: 0, debuff: '0', maxHp: 100, hp: 100,
  };

  const templates: MessageTemplates = {
    atksuccess: '성공 %데미지% %계산식%',
    atkfailed: '실패 %데미지% %계산식%',
    defsuccess: '방어성공 %계산식%',
    deffailed: '방어실패 %데미지% %계산식%',
  };

  it('returns valid battle result structure', () => {
    const result = calculateBattle(baseChar, 'atk', 'pve', '적', 2, 10, templates);
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('damage');
    expect(result).toHaveProperty('enemyDice');
    expect(result).toHaveProperty('charDice');
    expect(result).toHaveProperty('newCharHp');
    expect(result).toHaveProperty('newEnemyHp');
  });

  it('reduces enemy HP on attack success', () => {
    // Force dice to make success guaranteed
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // dice = 6 for both
    const result = calculateBattle(baseChar, 'atk', 'pve', '적', 2, 10, templates);
    // With debuff 0, charDice=6 >= enemyDice=6 → success
    expect(result.success).toBe(true);
    expect(result.damage).toBe(5); // atk + atkb = 5 + 0
    expect(result.newEnemyHp).toBe(5); // 10 - 5
    expect(result.newCharHp).toBe(100); // unchanged
    vi.restoreAllMocks();
  });

  it('reduces char HP on attack failure (PvE)', () => {
    // charDice=1, enemyDice=6 → fail
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0.99 : 0; // enemy=6, char=1
    });
    const result = calculateBattle(baseChar, 'atk', 'pve', '적', 2, 10, templates);
    expect(result.success).toBe(false);
    // 통일 공식: damage = max(0, 2 + 6 - 5 - 0) = 3
    expect(result.damage).toBe(3);
    expect(result.newCharHp).toBe(97); // 100 - 3
    expect(result.newEnemyHp).toBe(10); // unchanged
    vi.restoreAllMocks();
  });

  it('uses PvP formula (addition instead of multiplication) on attack failure', () => {
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0.99 : 0; // enemy=6, char=1
    });
    const result = calculateBattle(baseChar, 'atk', 'pvp', '적', 5, 100, templates);
    expect(result.success).toBe(false);
    // PvP: damage = max(0, 5 + 6 - 5 - 0) = 6
    expect(result.damage).toBe(6);
    expect(result.newCharHp).toBe(94); // 100 - 6
    vi.restoreAllMocks();
  });

  it('PvE attack failure uses same formula as PvP (addition)', () => {
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0.99 : 0; // enemy=6, char=1
    });
    const result = calculateBattle(baseChar, 'atk', 'pve', '적', 5, 100, templates);
    expect(result.success).toBe(false);
    // 통일 공식: damage = max(0, 5 + 6 - 5 - 0) = 6
    expect(result.damage).toBe(6);
    expect(result.newCharHp).toBe(94); // 100 - 6
    vi.restoreAllMocks();
  });

  it('defense success deals no damage', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // both dice = 6
    const result = calculateBattle(baseChar, 'def', 'pve', '적', 2, 10, templates);
    expect(result.success).toBe(true);
    expect(result.damage).toBe(0);
    expect(result.newCharHp).toBe(100);
    vi.restoreAllMocks();
  });

  it('defense failure reduces char HP (PvP formula)', () => {
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0.99 : 0; // enemy=6, char=1
    });
    const result = calculateBattle(baseChar, 'def', 'pvp', '적', 5, 100, templates);
    expect(result.success).toBe(false);
    // PvP: damage = max(0, 5 + 6 - 5 - 0) = 6
    expect(result.damage).toBe(6);
    expect(result.newCharHp).toBe(94);
    vi.restoreAllMocks();
  });

  it('clamps enemy HP to 0 minimum', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const bigAtkChar = { ...baseChar, atk: 50 };
    const result = calculateBattle(bigAtkChar, 'atk', 'pve', '적', 2, 10, templates);
    expect(result.success).toBe(true);
    expect(result.newEnemyHp).toBe(0);
    vi.restoreAllMocks();
  });

  it('clamps char HP to 0 minimum', () => {
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0.99 : 0; // enemy=6, char=1
    });
    const lowHpChar = { ...baseChar, hp: 1, maxHp: 100, def: 0 };
    const result = calculateBattle(lowHpChar, 'atk', 'pve', '적', 5, 100, templates);
    expect(result.success).toBe(false);
    expect(result.newCharHp).toBe(0);
    vi.restoreAllMocks();
  });

  it('includes damageFormula in message', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = calculateBattle(baseChar, 'atk', 'pve', '적', 2, 10, templates);
    expect(result.message).toContain('공격력(5) + 무기(0) = 5');
    vi.restoreAllMocks();
  });
});
