import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { calculateBattle } from '../services/battleService';
import type { Character, EnemyCharacter, BattleMode, BattleType } from '../types';
import CharacterComboBox from '../components/CharacterComboBox';

export default function CalcPage() {
  const navigate = useNavigate();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [enemyCharacters, setEnemyCharacters] = useState<EnemyCharacter[]>([]);
  const [battleType, setBattleType] = useState<BattleType>('pve');
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

    const result = calculateBattle(
      curChar,
      battleMode,
      battleType,
      enemyName,
      enemyAtk,
      actualEnemyHp,
      templates,
    );

    setSuccess(result.success ? 'ok' : 'failed');
    setResultText(result.message);
    setCurrentCharHp(result.newCharHp);
    setCurrentEnemyHp(result.newEnemyHp);

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
  }, [characters, enemyCharacters, selectedChar, selectedEnemy, currentEnemyHp, enemyHp, battleMode, battleType, enemyName, enemyAtk]);

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
    </>
  );
}
