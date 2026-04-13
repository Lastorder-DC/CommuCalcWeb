/**
 * 커스텀 데미지 수식 파서 및 검증기
 *
 * 사용 가능한 변수:
 *   적공격력, 적다이스, 방어력, 방어구, 공격력, 무기
 *
 * 사용 가능한 연산자:
 *   +, -, *, /, (, )
 *
 * 사용 가능한 함수:
 *   max(a, b), min(a, b)
 *
 * 숫자 리터럴도 사용 가능합니다.
 */

/** 수식에서 사용 가능한 변수 목록 */
export const FORMULA_VARIABLES: { name: string; description: string }[] = [
  { name: '적공격력', description: '적의 공격력 스탯' },
  { name: '적다이스', description: '적 다이스 결과 (1~6)' },
  { name: '방어력', description: '캐릭터 방어력 (def)' },
  { name: '방어구', description: '캐릭터 방어구 (defb)' },
  { name: '공격력', description: '캐릭터 공격력 (atk)' },
  { name: '무기', description: '캐릭터 무기 데미지 (atkb)' },
];

const VARIABLE_NAMES = FORMULA_VARIABLES.map(v => v.name);

/** 토큰 타입 */
type TokenType = 'number' | 'variable' | 'operator' | 'lparen' | 'rparen' | 'comma' | 'function';

interface Token {
  type: TokenType;
  value: string;
}

/** 수식 문자열을 토큰으로 분리 */
function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = formula.replace(/\s+/g, '');

  while (i < s.length) {
    // 숫자 (정수 및 소수)
    if (/[0-9]/.test(s[i])) {
      let num = '';
      while (i < s.length && /[0-9.]/.test(s[i])) {
        num += s[i++];
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // 연산자
    if ('+-*/'.includes(s[i])) {
      tokens.push({ type: 'operator', value: s[i++] });
      continue;
    }

    // 괄호
    if (s[i] === '(') {
      tokens.push({ type: 'lparen', value: '(' });
      i++;
      continue;
    }
    if (s[i] === ')') {
      tokens.push({ type: 'rparen', value: ')' });
      i++;
      continue;
    }

    // 콤마
    if (s[i] === ',') {
      tokens.push({ type: 'comma', value: ',' });
      i++;
      continue;
    }

    // 함수 또는 변수 (한글/영문)
    if (/[a-zA-Z가-힣_]/.test(s[i])) {
      let word = '';
      while (i < s.length && /[a-zA-Z가-힣_0-9]/.test(s[i])) {
        word += s[i++];
      }

      if (word === 'max' || word === 'min') {
        tokens.push({ type: 'function', value: word });
      } else if (VARIABLE_NAMES.includes(word)) {
        tokens.push({ type: 'variable', value: word });
      } else {
        throw new Error(`알 수 없는 변수 또는 함수: "${word}"`);
      }
      continue;
    }

    throw new Error(`알 수 없는 문자: "${s[i]}"`);
  }

  return tokens;
}

/**
 * 간단한 재귀 하향 파서로 문법을 검증합니다.
 *
 * Grammar:
 *   expr     = term (('+' | '-') term)*
 *   term     = factor (('*' | '/') factor)*
 *   factor   = NUMBER | VARIABLE | FUNCTION '(' expr (',' expr)* ')' | '(' expr ')' | ('+' | '-') factor
 */
function parseExpr(tokens: Token[], pos: { index: number }): void {
  parseTerm(tokens, pos);
  while (pos.index < tokens.length && tokens[pos.index].type === 'operator' && (tokens[pos.index].value === '+' || tokens[pos.index].value === '-')) {
    pos.index++;
    parseTerm(tokens, pos);
  }
}

function parseTerm(tokens: Token[], pos: { index: number }): void {
  parseFactor(tokens, pos);
  while (pos.index < tokens.length && tokens[pos.index].type === 'operator' && (tokens[pos.index].value === '*' || tokens[pos.index].value === '/')) {
    pos.index++;
    parseFactor(tokens, pos);
  }
}

function parseFactor(tokens: Token[], pos: { index: number }): void {
  if (pos.index >= tokens.length) {
    throw new Error('수식이 불완전합니다.');
  }

  const token = tokens[pos.index];

  // 단항 연산자 (+ 또는 -)
  if (token.type === 'operator' && (token.value === '+' || token.value === '-')) {
    pos.index++;
    parseFactor(tokens, pos);
    return;
  }

  if (token.type === 'number') {
    pos.index++;
    return;
  }

  if (token.type === 'variable') {
    pos.index++;
    return;
  }

  if (token.type === 'function') {
    pos.index++; // 함수 이름
    if (pos.index >= tokens.length || tokens[pos.index].type !== 'lparen') {
      throw new Error(`함수 "${token.value}" 뒤에 "("가 필요합니다.`);
    }
    pos.index++; // '('
    parseExpr(tokens, pos);
    // 추가 인자
    while (pos.index < tokens.length && tokens[pos.index].type === 'comma') {
      pos.index++; // ','
      parseExpr(tokens, pos);
    }
    if (pos.index >= tokens.length || tokens[pos.index].type !== 'rparen') {
      throw new Error(`함수 "${token.value}"의 닫는 괄호 ")"가 필요합니다.`);
    }
    pos.index++; // ')'
    return;
  }

  if (token.type === 'lparen') {
    pos.index++; // '('
    parseExpr(tokens, pos);
    if (pos.index >= tokens.length || tokens[pos.index].type !== 'rparen') {
      throw new Error('닫는 괄호 ")"가 필요합니다.');
    }
    pos.index++; // ')'
    return;
  }

  throw new Error(`예상치 못한 토큰: "${token.value}"`);
}

/**
 * 수식 문법 검증
 * @returns null이면 유효, 문자열이면 에러 메시지
 */
export function validateFormula(formula: string): string | null {
  if (!formula.trim()) {
    return '수식이 비어 있습니다.';
  }

  try {
    const tokens = tokenize(formula);
    if (tokens.length === 0) {
      return '수식이 비어 있습니다.';
    }
    const pos = { index: 0 };
    parseExpr(tokens, pos);
    if (pos.index < tokens.length) {
      throw new Error(`예상치 못한 토큰: "${tokens[pos.index].value}"`);
    }
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : '수식 오류';
  }
}

/**
 * 커스텀 수식을 실제 값으로 평가합니다.
 * @returns 계산된 데미지 값 (0 이상)
 */
export function evaluateFormula(
  formula: string,
  variables: {
    적공격력: number;
    적다이스: number;
    방어력: number;
    방어구: number;
    공격력: number;
    무기: number;
  },
): number {
  const tokens = tokenize(formula);
  const pos = { index: 0 };
  const result = evalExpr(tokens, pos, variables);
  return Math.max(0, Math.floor(result));
}

type VarMap = Record<string, number>;

function evalExpr(tokens: Token[], pos: { index: number }, vars: VarMap): number {
  let left = evalTerm(tokens, pos, vars);
  while (pos.index < tokens.length && tokens[pos.index].type === 'operator' && (tokens[pos.index].value === '+' || tokens[pos.index].value === '-')) {
    const op = tokens[pos.index].value;
    pos.index++;
    const right = evalTerm(tokens, pos, vars);
    left = op === '+' ? left + right : left - right;
  }
  return left;
}

function evalTerm(tokens: Token[], pos: { index: number }, vars: VarMap): number {
  let left = evalFactor(tokens, pos, vars);
  while (pos.index < tokens.length && tokens[pos.index].type === 'operator' && (tokens[pos.index].value === '*' || tokens[pos.index].value === '/')) {
    const op = tokens[pos.index].value;
    pos.index++;
    const right = evalFactor(tokens, pos, vars);
    left = op === '*' ? left * right : (right !== 0 ? left / right : 0);
  }
  return left;
}

function evalFactor(tokens: Token[], pos: { index: number }, vars: VarMap): number {
  const token = tokens[pos.index];

  // 단항 연산자
  if (token.type === 'operator' && (token.value === '+' || token.value === '-')) {
    pos.index++;
    const val = evalFactor(tokens, pos, vars);
    return token.value === '-' ? -val : val;
  }

  if (token.type === 'number') {
    pos.index++;
    return parseFloat(token.value);
  }

  if (token.type === 'variable') {
    pos.index++;
    return vars[token.value] ?? 0;
  }

  if (token.type === 'function') {
    const funcName = token.value;
    pos.index++; // 함수 이름
    pos.index++; // '('
    const args: number[] = [evalExpr(tokens, pos, vars)];
    while (pos.index < tokens.length && tokens[pos.index].type === 'comma') {
      pos.index++; // ','
      args.push(evalExpr(tokens, pos, vars));
    }
    pos.index++; // ')'

    if (funcName === 'max') return Math.max(...args);
    if (funcName === 'min') return Math.min(...args);
    return 0;
  }

  if (token.type === 'lparen') {
    pos.index++; // '('
    const val = evalExpr(tokens, pos, vars);
    pos.index++; // ')'
    return val;
  }

  return 0;
}

/**
 * 커스텀 수식의 계산 과정 문자열을 생성합니다.
 */
export function formatFormulaStr(
  formula: string,
  variables: {
    적공격력: number;
    적다이스: number;
    방어력: number;
    방어구: number;
    공격력: number;
    무기: number;
  },
  result: number,
): string {
  let str = formula;
  // 긴 변수명부터 null byte 플레이스홀더로 치환하여 부분 문자열 충돌 방지
  // (예: '적공격력' → '\x000\x00' 먼저, 이후 '공격력' → '\x004\x00' 처리)
  // null byte는 수식 문자열에 등장하지 않으므로 안전한 구분자로 사용
  const sortedEntries = Object.entries(variables).sort((a, b) => b[0].length - a[0].length);
  const placeholders: [string, string][] = [];
  for (let i = 0; i < sortedEntries.length; i++) {
    const [name, value] = sortedEntries[i];
    const placeholder = `\x00${i}\x00`;
    str = str.replace(new RegExp(name, 'g'), placeholder);
    placeholders.push([placeholder, `${name}(${value})`]);
  }
  for (const [placeholder, replacement] of placeholders) {
    str = str.split(placeholder).join(replacement);
  }
  return `max(0, ${str}) = ${result}`;
}
