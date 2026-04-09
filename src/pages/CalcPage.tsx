import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { calculateBattle } from '../services/battleService';
import type { Character, BattleMode } from '../types';

export default function CalcPage() {
  const navigate = useNavigate();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [enemyName, setEnemyName] = useState('');
  const [enemyHp, setEnemyHp] = useState(10);
  const [enemyAtk, setEnemyAtk] = useState(2);
  const [selectedChar, setSelectedChar] = useState('');
  const [battleMode, setBattleMode] = useState<BattleMode>('atk');
  const [currentCharHp, setCurrentCharHp] = useState(0);
  const [currentEnemyHp, setCurrentEnemyHp] = useState<number | ''>('');
  const [debuff, setDebuff] = useState('0');
  const [success, setSuccess] = useState<'ok' | 'failed'>('ok');
  const [resultText, setResultText] = useState('');

  // 초기 데이터 로드
  useEffect(() => {
    const chars = storageService.getCharacters();
    if (chars.length === 0) {
      navigate('/db');
      return;
    }
    setCharacters(chars);
    setEnemyName(storageService.getEnemyName());
    setEnemyHp(storageService.getEnemyHp());
    setEnemyAtk(storageService.getEnemyAtk());
    setBattleMode(storageService.getBattleMode());

    const savedChar = storageService.getSelectedChar();
    if (savedChar && chars.some(c => String(c.num) === savedChar)) {
      setSelectedChar(savedChar);
      const char = chars.find(c => String(c.num) === savedChar);
      if (char) {
        setCurrentCharHp(char.hp);
        setDebuff(String(parseInt(char.debuff, 10)));
      }
    } else if (chars.length > 0) {
      setSelectedChar(String(chars[0].num));
      setCurrentCharHp(chars[0].hp);
      setDebuff(String(parseInt(chars[0].debuff, 10)));
    }
  }, [navigate]);

  const handleCharChange = useCallback((value: string) => {
    setSelectedChar(value);
    storageService.setSelectedChar(value);
    const char = characters.find(c => String(c.num) === value);
    if (char) {
      setCurrentCharHp(char.hp);
      setDebuff(String(parseInt(char.debuff, 10)));
    }
  }, [characters]);

  const handleEnemyNameChange = useCallback((value: string) => {
    setEnemyName(value);
    storageService.setEnemyName(value);
  }, []);

  const handleEnemyHpChange = useCallback((value: number) => {
    setEnemyHp(value);
    storageService.setEnemyHp(value);
  }, []);

  const handleEnemyAtkChange = useCallback((value: number) => {
    setEnemyAtk(value);
    storageService.setEnemyAtk(value);
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

    const actualEnemyHp = currentEnemyHp === '' ? enemyHp : currentEnemyHp;
    const templates = storageService.getMessageTemplates();

    const result = calculateBattle(
      curChar,
      battleMode,
      enemyName,
      enemyAtk,
      actualEnemyHp,
      templates,
    );

    setSuccess(result.success ? 'ok' : 'failed');
    setResultText(result.message);
    setCurrentCharHp(result.newCharHp);

    if (result.newEnemyHp <= 0 && battleMode === 'atk' && result.success) {
      alert('적이 쓰러졌습니다!');
      setCurrentEnemyHp(enemyHp);
    } else {
      setCurrentEnemyHp(result.newEnemyHp);
    }

    // 캐릭터 HP 업데이트
    if (!result.success) {
      const updated = characters.map(c =>
        c.num === curChar.num ? { ...c, hp: result.newCharHp } : c
      );
      setCharacters(updated);
      storageService.setCharacters(updated);
    }
  }, [characters, selectedChar, currentEnemyHp, enemyHp, battleMode, enemyName, enemyAtk]);

  return (
    <>
      <div className="row" style={{ paddingTop: '10px' }}>
        <h2>전투 시뮬레이션</h2>
        <div className="col-md-2">
          <label htmlFor="enemyname" className="form-label">적 이름</label>
          <input
            id="enemyname"
            name="enemyname"
            type="text"
            className="form-control"
            value={enemyName}
            onChange={e => handleEnemyNameChange(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label htmlFor="enemyhp" className="form-label">적 체력</label>
          <input
            id="enemyhp"
            name="enemyhp"
            type="number"
            className="form-control"
            value={enemyHp}
            onChange={e => handleEnemyHpChange(parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <div className="col-md-2">
          <label htmlFor="enemyatk" className="form-label">적 공격력</label>
          <input
            id="enemyatk"
            name="enemyatk"
            type="number"
            className="form-control"
            value={enemyAtk}
            onChange={e => handleEnemyAtkChange(parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <div className="col-md-2">
          <label htmlFor="charname" className="form-label">캐릭터 이름</label>
          <select
            id="charname"
            name="charname"
            className="form-select"
            value={selectedChar}
            onChange={e => handleCharChange(e.target.value)}
          >
            {characters.map(c => (
              <option key={c.num} value={c.num}>{c.name}</option>
            ))}
          </select>
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
        <div className="col-md-3">
          <label htmlFor="curhp" className="form-label">현재 캐릭터 체력</label>
          <input
            id="curhp"
            name="curhp"
            type="text"
            className="form-control"
            readOnly
            value={currentCharHp}
          />
        </div>
        <div className="col-md-3">
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
        <div className="col-md-3">
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
