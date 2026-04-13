import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { calculateBattle } from '../services/battleService';
import { validateFormula, FORMULA_VARIABLES } from '../services/formulaService';
import type { Character, EnemyCharacter, BattleMode, BattleType, DamageFormulaType, BattleLogEntry } from '../types';
import CharacterComboBox from '../components/CharacterComboBox';

export default function CalcPage() {
  const navigate = useNavigate();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [enemyCharacters, setEnemyCharacters] = useState<EnemyCharacter[]>([]);
  const [battleType, setBattleType] = useState<BattleType>('pve');
  const [pvpDamageFormula, setPvpDamageFormula] = useState<DamageFormulaType>('add');
  const [pveDamageFormula, setPveDamageFormula] = useState<DamageFormulaType>('add');
  const [pvpCustomFormula, setPvpCustomFormula] = useState('');
  const [pveCustomFormula, setPveCustomFormula] = useState('');
  const [selectedChar, setSelectedChar] = useState('');
  const [selectedEnemy, setSelectedEnemy] = useState('');
  const [enemyName, setEnemyName] = useState('');
  const [enemyHp, setEnemyHp] = useState(10);
  const [enemyAtk, setEnemyAtk] = useState(2);
  const [battleMode, setBattleMode] = useState<BattleMode>('atk');
  const [currentCharHp, setCurrentCharHp] = useState(0);
  const [charMaxHp, setCharMaxHp] = useState(0);
  const [currentEnemyHp, setCurrentEnemyHp] = useState<number | ''>('');
  const [debuff, setDebuff] = useState('0');
  const [success, setSuccess] = useState<'ok' | 'failed'>('ok');
  const [resultText, setResultText] = useState('');

  // 커스텀 수식 모달 관련
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [editingFormula, setEditingFormula] = useState('');
  const [formulaError, setFormulaError] = useState<string | null>(null);

  // 전투 기록
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);

  // 아군 캐릭터 콤보박스 옵션
  const charOptions = useMemo(() =>
    characters.map(c => ({ value: String(c.num), label: c.name })),
    [characters]
  );

  // 적 캐릭터 콤보박스 옵션 (PvE: 적 DB, PvP: 아군 DB)
  const enemyOptions = useMemo(() => {
    if (battleType === 'pvp') {
      return characters.map(c => ({ value: String(c.num), label: c.name }));
    }
    return enemyCharacters.map(c => ({ value: String(c.num), label: c.name }));
  }, [battleType, characters, enemyCharacters]);

  // 초기 데이터 로드
  useEffect(() => {
    const chars = storageService.getCharacters();
    if (chars.length === 0) {
      navigate('/db');
      return;
    }
    setCharacters(chars);
    setEnemyCharacters(storageService.getEnemyCharacters());

    const savedBattleType = storageService.getBattleType();
    setBattleType(savedBattleType);
    setBattleMode(storageService.getBattleMode());
    setPvpDamageFormula(storageService.getPvpDamageFormula());
    setPveDamageFormula(storageService.getPveDamageFormula());
    setPvpCustomFormula(storageService.getPvpCustomFormula());
    setPveCustomFormula(storageService.getPveCustomFormula());
    setBattleLog(storageService.getBattleLog());

    // 아군 캐릭터 복원
    const savedChar = storageService.getSelectedChar();
    if (savedChar && chars.some(c => String(c.num) === savedChar)) {
      setSelectedChar(savedChar);
      const char = chars.find(c => String(c.num) === savedChar);
      if (char) {
        setCurrentCharHp(char.hp);
        setCharMaxHp(char.maxHp);
        setDebuff(String(parseInt(char.debuff, 10)));
      }
    } else if (chars.length > 0) {
      setSelectedChar(String(chars[0].num));
      setCurrentCharHp(chars[0].hp);
      setCharMaxHp(chars[0].maxHp);
      setDebuff(String(parseInt(chars[0].debuff, 10)));
    }

    // 적 캐릭터 복원
    const savedEnemy = storageService.getSelectedEnemy();
    if (savedEnemy) {
      setSelectedEnemy(savedEnemy);
    }

    // 기존 적 정보 (이전 버전 호환)
    setEnemyName(storageService.getEnemyName());
    setEnemyHp(storageService.getEnemyHp());
    setEnemyAtk(storageService.getEnemyAtk());
  }, [navigate]);

  // 적 캐릭터 선택 변경 시 적 스탯 업데이트
  useEffect(() => {
    if (!selectedEnemy) return;

    if (battleType === 'pvp') {
      const enemy = characters.find(c => String(c.num) === selectedEnemy);
      if (enemy) {
        setEnemyName(enemy.name);
        setEnemyHp(enemy.maxHp);
        setEnemyAtk(enemy.atk + enemy.atkb);
        setCurrentEnemyHp(enemy.hp);
        storageService.setEnemyName(enemy.name);
        storageService.setEnemyHp(enemy.maxHp);
        storageService.setEnemyAtk(enemy.atk + enemy.atkb);
      }
    } else {
      const enemy = enemyCharacters.find(c => String(c.num) === selectedEnemy);
      if (enemy) {
        setEnemyName(enemy.name);
        setEnemyHp(enemy.maxHp);
        setEnemyAtk(enemy.atk);
        setCurrentEnemyHp(enemy.hp);
        storageService.setEnemyName(enemy.name);
        storageService.setEnemyHp(enemy.maxHp);
        storageService.setEnemyAtk(enemy.atk);
      }
    }
  }, [selectedEnemy, battleType, characters, enemyCharacters]);

  const handleCharChange = useCallback((value: string) => {
    setSelectedChar(value);
    storageService.setSelectedChar(value);
    const char = characters.find(c => String(c.num) === value);
    if (char) {
      setCurrentCharHp(char.hp);
      setCharMaxHp(char.maxHp);
      setDebuff(String(parseInt(char.debuff, 10)));
    }
  }, [characters]);

  const handleEnemyChange = useCallback((value: string) => {
    setSelectedEnemy(value);
    storageService.setSelectedEnemy(value);
  }, []);

  const handleBattleTypeChange = useCallback((value: BattleType) => {
    setBattleType(value);
    storageService.setBattleType(value);
    // 전투 타입 변경 시 적 선택 초기화
    setSelectedEnemy('');
    storageService.setSelectedEnemy('');
  }, []);

  const handleBattleModeChange = useCallback((value: BattleMode) => {
    setBattleMode(value);
    storageService.setBattleMode(value);
  }, []);

  const handleDamageFormulaChange = useCallback((value: DamageFormulaType) => {
    if (value === 'custom') {
      // 커스텀 수식 모달 열기
      const currentCustom = battleType === 'pvp' ? pvpCustomFormula : pveCustomFormula;
      setEditingFormula(currentCustom);
      setFormulaError(null);
      setShowFormulaModal(true);
      return;
    }
    if (battleType === 'pvp') {
      setPvpDamageFormula(value);
      storageService.setPvpDamageFormula(value);
    } else {
      setPveDamageFormula(value);
      storageService.setPveDamageFormula(value);
    }
  }, [battleType, pvpCustomFormula, pveCustomFormula]);

  const handleCustomFormulaSave = useCallback(() => {
    const error = validateFormula(editingFormula);
    if (error) {
      setFormulaError(error);
      return;
    }
    if (battleType === 'pvp') {
      setPvpDamageFormula('custom');
      setPvpCustomFormula(editingFormula);
      storageService.setPvpDamageFormula('custom');
      storageService.setPvpCustomFormula(editingFormula);
    } else {
      setPveDamageFormula('custom');
      setPveCustomFormula(editingFormula);
      storageService.setPveDamageFormula('custom');
      storageService.setPveCustomFormula(editingFormula);
    }
    setShowFormulaModal(false);
  }, [editingFormula, battleType]);

  const doCalc = useCallback(() => {
    const curChar = characters.find(c => String(c.num) === selectedChar);
    if (!curChar) {
      alert('존재하지 않는 캐릭터입니다!');
      return;
    }
    if (curChar.hp === 0) {
      alert('사망한 캐릭터는 행동할 수 없습니다!');
      return;
    }
    if (!enemyName) {
      alert('적 캐릭터를 선택해주세요!');
      return;
    }

    const actualEnemyHp = currentEnemyHp === '' ? enemyHp : currentEnemyHp;

    if (actualEnemyHp <= 0) {
      alert('사망한 적은 공격할 수 없습니다!');
      return;
    }
    const templates = storageService.getMessageTemplates();
    const currentFormula = battleType === 'pvp' ? pvpDamageFormula : pveDamageFormula;
    const currentCustom = battleType === 'pvp' ? pvpCustomFormula : pveCustomFormula;

    const result = calculateBattle(
      curChar,
      battleMode,
      currentFormula,
      enemyName,
      enemyAtk,
      actualEnemyHp,
      templates,
      currentCustom,
    );

    setSuccess(result.success ? 'ok' : 'failed');
    setResultText(result.message);
    setCurrentCharHp(result.newCharHp);
    setCurrentEnemyHp(result.newEnemyHp);

    // 전투 기록 추가
    const logEntry: BattleLogEntry = {
      timestamp: new Date().toISOString(),
      battleType,
      battleMode,
      charName: curChar.name,
      enemyName,
      success: result.success,
      damage: result.damage,
      charDice: result.charDice,
      enemyDice: result.enemyDice,
      message: result.message,
    };
    const newLog = [...battleLog, logEntry];
    setBattleLog(newLog);
    storageService.addBattleLogEntry(logEntry);

    if (result.newEnemyHp <= 0 && battleMode === 'atk' && result.success) {
      alert('적이 쓰러졌습니다!');
    }

    // 캐릭터 HP 업데이트 (DB 반영)
    if (!result.success) {
      const updated = characters.map(c =>
        c.num === curChar.num ? { ...c, hp: result.newCharHp } : c
      );
      setCharacters(updated);
      storageService.setCharacters(updated);
    }

    // PvP 모드에서 적 캐릭터 HP도 DB에 반영
    if (battleType === 'pvp' && result.success && battleMode === 'atk') {
      const updated = characters.map(c =>
        String(c.num) === selectedEnemy ? { ...c, hp: result.newEnemyHp } : c
      );
      setCharacters(updated);
      storageService.setCharacters(updated);
    }

    // PvE 모드에서 적 캐릭터 현재 HP를 DB에 반영
    if (battleType === 'pve' && selectedEnemy) {
      const updated = enemyCharacters.map(c =>
        String(c.num) === selectedEnemy ? { ...c, hp: result.newEnemyHp } : c
      );
      setEnemyCharacters(updated);
      storageService.setEnemyCharacters(updated);
    }
  }, [characters, enemyCharacters, selectedChar, selectedEnemy, currentEnemyHp, enemyHp, battleMode, battleType, pvpDamageFormula, pveDamageFormula, pvpCustomFormula, pveCustomFormula, enemyName, enemyAtk, battleLog]);

  const handleClearBattleLog = useCallback(() => {
    if (!confirm('전투 기록을 모두 삭제하시겠습니까?')) return;
    setBattleLog([]);
    storageService.clearBattleLog();
  }, []);

  const currentFormulaValue = battleType === 'pvp' ? pvpDamageFormula : pveDamageFormula;

  return (
    <>
      <div className="row" style={{ paddingTop: '10px' }}>
        <h2>전투 시뮬레이션</h2>
        <div className="col-md-2">
          <label htmlFor="battletype" className="form-label">전투 타입</label>
          <select
            id="battletype"
            name="battletype"
            className="form-select"
            value={battleType}
            onChange={e => handleBattleTypeChange(e.target.value as BattleType)}
          >
            <option value="pve">PvE (아군 vs 적군)</option>
            <option value="pvp">PvP (아군 vs 아군)</option>
          </select>
        </div>
        <div className="col-md-2">
          <label htmlFor="damageFormula" className="form-label">계산식</label>
          <select
            id="damageFormula"
            name="damageFormula"
            className="form-select"
            value={currentFormulaValue}
            onChange={e => handleDamageFormulaChange(e.target.value as DamageFormulaType)}
          >
            <option value="add">합산 (적공격력 + 적다이스)</option>
            <option value="multiply">곱셈 (적다이스 × 적공격력)</option>
            <option value="custom">커스텀 수식</option>
          </select>
          {currentFormulaValue === 'custom' && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mt-1"
              onClick={() => {
                const currentCustom = battleType === 'pvp' ? pvpCustomFormula : pveCustomFormula;
                setEditingFormula(currentCustom);
                setFormulaError(null);
                setShowFormulaModal(true);
              }}
            >
              수식 편집
            </button>
          )}
        </div>
        <div className="col-md-2">
          <label htmlFor="charname" className="form-label">캐릭터 이름</label>
          <CharacterComboBox
            id="charname"
            options={charOptions}
            value={selectedChar}
            onChange={handleCharChange}
            placeholder="캐릭터 검색..."
          />
        </div>
        <div className="col-md-2">
          <label htmlFor="enemychar" className="form-label">적 캐릭터</label>
          <CharacterComboBox
            id="enemychar"
            options={enemyOptions}
            value={selectedEnemy}
            onChange={handleEnemyChange}
            placeholder="적 검색..."
          />
        </div>
        <div className="col-md-2">
          <label htmlFor="atkdef" className="form-label">공격/방어</label>
          <select
            id="atkdef"
            name="atkdef"
            className="form-select"
            value={battleMode}
            onChange={e => handleBattleModeChange(e.target.value as BattleMode)}
          >
            <option value="atk">공격</option>
            <option value="def">방어</option>
          </select>
        </div>
        <div className="col-md-2">
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '32px', width: '100%' }}
            onClick={doCalc}
          >
            계산
          </button>
        </div>
      </div>
      <div className="row" style={{ paddingTop: '10px' }}>
        <div className="col-md-2">
          <label htmlFor="enemyname" className="form-label">적 이름</label>
          <input
            id="enemyname"
            name="enemyname"
            type="text"
            className="form-control"
            readOnly
            value={enemyName}
          />
        </div>
        <div className="col-md-2">
          <label htmlFor="enemyhp" className="form-label">적 최대체력</label>
          <input
            id="enemyhp"
            name="enemyhp"
            type="number"
            className="form-control"
            readOnly
            value={enemyHp}
          />
        </div>
        <div className="col-md-2">
          <label htmlFor="enemyatk" className="form-label">적 공격력</label>
          <input
            id="enemyatk"
            name="enemyatk"
            type="number"
            className="form-control"
            readOnly
            value={enemyAtk}
          />
        </div>
        <div className="col-md-2">
          <label htmlFor="curhp" className="form-label">캐릭터 체력 (최대: {charMaxHp})</label>
          <input
            id="curhp"
            name="curhp"
            type="text"
            className="form-control"
            readOnly
            value={currentCharHp}
          />
        </div>
        <div className="col-md-2">
          <label htmlFor="curenemyhp" className="form-label">현재 적 체력</label>
          <input
            id="curenemyhp"
            name="curenemyhp"
            type="number"
            className="form-control"
            value={currentEnemyHp}
            onChange={e => setCurrentEnemyHp(parseInt(e.target.value, 10) || '')}
          />
        </div>
        <div className="col-md-2">
          <label htmlFor="debuff" className="form-label">디버프</label>
          <input
            id="debuff"
            name="debuff"
            type="text"
            className="form-control"
            readOnly
            value={debuff}
          />
        </div>
      </div>
      <div className="row" style={{ paddingTop: '10px' }}>
        <div className="col-md-3">
          <label htmlFor="success" className="form-label">공격 성공 여부</label>
          <select
            id="success"
            name="success"
            className="form-select"
            disabled
            value={success}
          >
            <option value="ok">성공</option>
            <option value="failed">실패</option>
          </select>
        </div>
      </div>
      <div className="row" style={{ paddingTop: '10px' }}>
        <div className="col-md-12">
          <label htmlFor="result" className="form-label">전투 결과</label>
          <textarea
            id="result"
            name="result"
            className="form-control"
            readOnly
            rows={5}
            value={resultText}
            onClick={e => (e.target as HTMLTextAreaElement).select()}
          />
        </div>
      </div>

      {/* 전투 기록 */}
      <div className="row" style={{ paddingTop: '20px' }}>
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h3>전투 기록</h3>
            {battleLog.length > 0 && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={handleClearBattleLog}
              >
                기록 초기화
              </button>
            )}
          </div>
          {battleLog.length === 0 ? (
            <p className="text-muted">전투 기록이 없습니다.</p>
          ) : (
            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="table table-sm table-striped">
                <thead className="sticky-top">
                  <tr>
                    <th>#</th>
                    <th>시간</th>
                    <th>타입</th>
                    <th>모드</th>
                    <th>캐릭터</th>
                    <th>적</th>
                    <th>결과</th>
                    <th>데미지</th>
                    <th>다이스 (캐/적)</th>
                  </tr>
                </thead>
                <tbody>
                  {battleLog.map((entry, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{new Date(entry.timestamp).toLocaleTimeString('ko-KR')}</td>
                      <td>{entry.battleType === 'pvp' ? 'PvP' : 'PvE'}</td>
                      <td>{entry.battleMode === 'atk' ? '공격' : '방어'}</td>
                      <td>{entry.charName}</td>
                      <td>{entry.enemyName}</td>
                      <td className={entry.success ? 'text-success' : 'text-danger'}>
                        {entry.success ? '성공' : '실패'}
                      </td>
                      <td>{entry.damage}</td>
                      <td>{entry.charDice} / {entry.enemyDice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 커스텀 수식 모달 */}
      {showFormulaModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">커스텀 데미지 수식 설정</h5>
                <button type="button" className="btn-close" onClick={() => setShowFormulaModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="customFormula" className="form-label">데미지 수식</label>
                  <input
                    id="customFormula"
                    type="text"
                    className={`form-control ${formulaError ? 'is-invalid' : ''}`}
                    value={editingFormula}
                    onChange={e => {
                      setEditingFormula(e.target.value);
                      setFormulaError(null);
                    }}
                    placeholder="예: 적공격력 + 적다이스 - 방어력 - 방어구"
                  />
                  {formulaError && (
                    <div className="invalid-feedback">{formulaError}</div>
                  )}
                  <div className="form-text">
                    결과값이 0 미만이면 자동으로 0으로 처리됩니다.
                  </div>
                </div>

                <h6>사용 가능한 변수</h6>
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr><th>변수명</th><th>설명</th></tr>
                  </thead>
                  <tbody>
                    {FORMULA_VARIABLES.map(v => (
                      <tr key={v.name}>
                        <td><code>{v.name}</code></td>
                        <td>{v.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h6>사용 가능한 연산자 및 함수</h6>
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr><th>항목</th><th>설명</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><code>+</code></td><td>덧셈</td></tr>
                    <tr><td><code>-</code></td><td>뺄셈</td></tr>
                    <tr><td><code>*</code></td><td>곱셈</td></tr>
                    <tr><td><code>/</code></td><td>나눗셈</td></tr>
                    <tr><td><code>( )</code></td><td>괄호 (우선순위 지정)</td></tr>
                    <tr><td><code>max(a, b)</code></td><td>두 값 중 큰 값</td></tr>
                    <tr><td><code>min(a, b)</code></td><td>두 값 중 작은 값</td></tr>
                  </tbody>
                </table>

                <h6>예시</h6>
                <ul>
                  <li><code>적공격력 + 적다이스 - 방어력 - 방어구</code> — 합산 계산식</li>
                  <li><code>적다이스 * 적공격력 - 방어력 - 방어구</code> — 곱셈 계산식</li>
                  <li><code>max(적공격력, 적다이스) * 2 - 방어력</code> — 커스텀 예시</li>
                </ul>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormulaModal(false)}>
                  취소
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCustomFormulaSave}>
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
