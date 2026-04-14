import type { Character, BattleMode, BattleResult, DamageFormulaType, MessageTemplates } from '../types';
import { josa } from 'es-hangul';
import { evaluateFormula, formatFormulaStr } from './formulaService';

/** 다이스 계산 (1~max) */
export function dice(max: number): number {
  return Math.floor(Math.random() * max) + 1;
}

/**
 * 조사 플레이스홀더를 실제 값으로 치환
 * %적이름이/가%, %캐이름을/를% 등의 패턴을 지원
 */
// 지원 조사 패턴: 이/가, 을/를, 은/는, 와/과, 으로/로
const JOSA_PATTERN = /%([^%]+?)(이\/가|을\/를|은\/는|와\/과|으로\/로)%/g;

function replaceJosa(message: string, placeholders: Record<string, string>): string {
  return message.replace(JOSA_PATTERN, (_match, key, particle) => {
    const value = placeholders[key];
    if (value !== undefined) {
      return josa(value, particle);
    }
    return _match;
  });
}

/** 메세지 내 플레이스홀더를 실제 값으로 치환 */
export function replaceValue(
  message: string,
  enemyName: string,
  charName: string,
  enemyDice: number,
  charDice: number,
  enemyHp: number,
  charHp: number,
  damage: number,
  debuff: string,
  damageFormula: string,
): string {
  let result = message;

  // 조사 자동 처리 (es-hangul josa)
  const placeholders: Record<string, string> = {
    '적이름': enemyName,
    '캐이름': charName,
  };
  result = replaceJosa(result, placeholders);

  // 기본 플레이스홀더 치환
  result = result.replace(/%적이름%/g, enemyName);
  result = result.replace(/%캐이름%/g, charName);
  result = result.replace(/%적다이스%/g, String(enemyDice));
  result = result.replace(/%적체력%/g, String(enemyHp));
  result = result.replace(/%캐체력%/g, String(charHp));
  result = result.replace(/%데미지%/g, String(damage));
  result = result.replace(/%계산식%/g, damageFormula);

  if (parseInt(debuff, 10) === 0) {
    result = result.replace(/%캐다이스%/g, String(charDice));
  } else {
    result = result.replace(/%캐다이스%/g, `${charDice}(디버프 ${debuff})`);
  }

  return result;
}

/** 전투 계산 함수 */
export function calculateBattle(
  character: Character,
  mode: BattleMode,
  damageFormula: DamageFormulaType,
  enemyName: string,
  enemyAtkStat: number,
  currentEnemyHp: number,
  templates: MessageTemplates,
  customFormula?: string,
): BattleResult & { newCharHp: number; newEnemyHp: number } {
  const enemyDiceRoll = dice(6);
  const charDiceRoll = dice(6);

  const charDiceWithDebuff = charDiceRoll + parseInt(character.debuff, 10);
  const isSuccess = charDiceWithDebuff >= enemyDiceRoll;

  let damage = 0;
  let damageFormulaStr = '';
  let newCharHp = character.hp;
  let newEnemyHp = currentEnemyHp;
  let templateKey: keyof MessageTemplates;

  const formulaVars = {
    적공격력: enemyAtkStat,
    적다이스: enemyDiceRoll,
    방어력: character.def,
    방어구: character.defb,
    공격력: character.atk,
    무기: character.atkb,
  };

  /** 적의 데미지를 계산하는 내부 함수 */
  const calcEnemyDamage = (): { dmg: number; formula: string } => {
    if (damageFormula === 'custom' && customFormula) {
      const dmg = evaluateFormula(customFormula, formulaVars);
      const formula = formatFormulaStr(customFormula, formulaVars, dmg);
      return { dmg, formula };
    } else if (damageFormula === 'multiply') {
      const dmg = Math.max(0, enemyDiceRoll * enemyAtkStat - character.def - character.defb);
      const formula = `max(0, 적다이스(${enemyDiceRoll}) × 적공격력(${enemyAtkStat}) - 방어력(${character.def}) - 방어구(${character.defb})) = ${dmg}`;
      return { dmg, formula };
    } else {
      const dmg = Math.max(0, enemyAtkStat + enemyDiceRoll - character.def - character.defb);
      const formula = `max(0, 적공격력(${enemyAtkStat}) + 적다이스(${enemyDiceRoll}) - 방어력(${character.def}) - 방어구(${character.defb})) = ${dmg}`;
      return { dmg, formula };
    }
  };

  if (mode === 'atk') {
    if (isSuccess) {
      templateKey = 'atksuccess';
      damage = Number(character.atk) + Number(character.atkb);
      damageFormulaStr = `공격력(${character.atk}) + 무기(${character.atkb}) = ${damage}`;
      newEnemyHp = Math.max(0, currentEnemyHp - damage);
    } else {
      templateKey = 'atkfailed';
      const result = calcEnemyDamage();
      damage = result.dmg;
      damageFormulaStr = result.formula;
      newCharHp = Math.max(0, character.hp - damage);
    }
  } else {
    if (isSuccess) {
      templateKey = 'defsuccess';
      damage = 0;
      damageFormulaStr = '방어 성공 — 피해 없음';
    } else {
      templateKey = 'deffailed';
      const result = calcEnemyDamage();
      damage = result.dmg;
      damageFormulaStr = result.formula;
      newCharHp = Math.max(0, character.hp - damage);
    }
  }

  const message = replaceValue(
    templates[templateKey],
    enemyName,
    character.name,
    enemyDiceRoll,
    charDiceRoll,
    newEnemyHp,
    newCharHp,
    damage,
    character.debuff,
    damageFormulaStr,
  );

  return {
    success: isSuccess,
    message,
    damage,
    enemyDice: enemyDiceRoll,
    charDice: charDiceRoll,
    newCharHp,
    newEnemyHp,
  };
}
