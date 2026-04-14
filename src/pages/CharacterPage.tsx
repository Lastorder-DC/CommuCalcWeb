import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { storageService, DEFAULT_TEMPLATES } from '../services/storageService';
import type { Character, EnemyCharacter, MessageTemplateKey } from '../types';
import { TabulatorFull as Tabulator, type CellComponent } from 'tabulator-tables';
import { useDataSync } from '../hooks/useDataSync';
import 'tabulator-tables/dist/css/tabulator.min.css';
import 'tabulator-tables/dist/css/tabulator_modern.min.css';

export default function CharacterPage() {
  const allyTableRef = useRef<HTMLDivElement>(null);
  const enemyTableRef = useRef<HTMLDivElement>(null);
  const allyTabulatorInstance = useRef<Tabulator | null>(null);
  const enemyTabulatorInstance = useRef<Tabulator | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [enemyCharacters, setEnemyCharacters] = useState<EnemyCharacter[]>([]);
  const [templates, setTemplates] = useState(storageService.getMessageTemplates());
  const { syncToServer, syncFromServer, syncCategoryToServer, syncCategoryFromServer, canSync } = useDataSync();
  const [syncing, setSyncing] = useState(false);

  const updateChars = useCallback((chars: Character[]) => {
    setCharacters(chars);
    storageService.setCharacters(chars);
  }, []);

  const updateEnemyChars = useCallback((chars: EnemyCharacter[]) => {
    setEnemyCharacters(chars);
    storageService.setEnemyCharacters(chars);
  }, []);

  // 아군 캐릭터 Tabulator 초기화
  useEffect(() => {
    const chars = storageService.getCharacters();
    setCharacters(chars);

    if (!allyTableRef.current) return;

    const table = new Tabulator(allyTableRef.current, {
      data: chars,
      locale: true,
      layout: 'fitColumns',
      history: true,
      pagination: true,
      paginationSize: 10,
      movableColumns: false,
      resizableColumnFit: false,
      resizableRows: false,
      movableRows: false,
      initialSort: [{ column: 'num', dir: 'asc' }],
      columns: [
        { title: '번호', field: 'num', width: 80 },
        { title: '이름', field: 'name', editor: 'input', minWidth: 100 },
        { title: '공격력', field: 'atk', editor: 'number', width: 100 },
        { title: '방어력', field: 'def', editor: 'number', width: 100 },
        { title: '무기', field: 'atkb', editor: 'number', width: 100 },
        { title: '방어구', field: 'defb', editor: 'number', width: 100 },
        { title: '디버프', field: 'debuff', editor: 'input', width: 100 },
        { title: '최대체력', field: 'maxHp', editor: 'number', width: 100 },
        { title: '현재체력', field: 'hp', editor: 'number', width: 100 },
        {
          title: '관리',
          field: 'manage',
          editor: undefined,
          formatter: () => '<span style="cursor:pointer" title="체력 회복" data-action="restore">↻</span> <span style="cursor:pointer" title="삭제" data-action="delete">❌</span>',
          cellClick: (_e: UIEvent, cell: CellComponent) => {
            const target = (_e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
            if (!target) return;
            const action = target.dataset.action;
            const row = cell.getRow();
            const data = row.getData() as Character;

            if (action === 'restore') {
              if (!confirm('체력을 최대체력으로 회복하시겠습니까?')) return;
              const current = table.getData() as Character[];
              const updated = current.map(c =>
                c.num === data.num ? { ...c, hp: c.maxHp } : c
              );
              table.replaceData(updated);
              updateChars(updated);
              return;
            }

            if (action === 'delete') {
              if (!confirm('캐릭터를 삭제하시겠습니까?')) return;
              const current = table.getData() as Character[];
              let id = 1;
              const filtered: Character[] = [];
              for (const c of current) {
                if (c.num === data.num) continue;
                filtered.push({ ...c, id, num: id });
                id++;
              }
              table.replaceData(filtered);
              updateChars(filtered);
            }
          },
          width: 100,
        },
      ],
      langs: {
        'ko-kr': {
          data: {
            loading: '불러오는 중',
            error: '오류',
          },
          groups: {
            item: '캐릭터',
            items: '캐릭터',
          },
          pagination: {
            page_size: '페이지 크기',
            page_title: '페이지 보기',
            first: '처음',
            first_title: '첫 페이지',
            last: '마지막',
            last_title: '마지막 페이지',
            prev: '이전',
            prev_title: '이전 페이지',
            next: '다음',
            next_title: '다음 페이지',
            all: '모두 보기',
          },
        },
      },
    });

    table.on('cellEdited', () => {
      const data = table.getData() as Character[];
      updateChars(data);
    });

    allyTabulatorInstance.current = table;

    return () => {
      table.destroy();
    };
  }, [updateChars]);

  // 적 캐릭터 Tabulator 초기화
  useEffect(() => {
    const chars = storageService.getEnemyCharacters();
    setEnemyCharacters(chars);

    if (!enemyTableRef.current) return;

    const table = new Tabulator(enemyTableRef.current, {
      data: chars,
      locale: true,
      layout: 'fitColumns',
      history: true,
      pagination: true,
      paginationSize: 10,
      movableColumns: false,
      resizableColumnFit: false,
      resizableRows: false,
      movableRows: false,
      initialSort: [{ column: 'num', dir: 'asc' }],
      columns: [
        { title: '번호', field: 'num', width: 80 },
        { title: '이름', field: 'name', editor: 'input', minWidth: 100 },
        { title: '공격력', field: 'atk', editor: 'number', width: 100 },
        { title: '최대체력', field: 'maxHp', editor: 'number', width: 100 },
        { title: '현재체력', field: 'hp', editor: 'number', width: 100 },
        {
          title: '관리',
          field: 'manage',
          editor: undefined,
          formatter: () => '<span style="cursor:pointer" title="체력 회복" data-action="restore">↻</span> <span style="cursor:pointer" title="삭제" data-action="delete">❌</span>',
          cellClick: (_e: UIEvent, cell: CellComponent) => {
            const target = (_e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
            if (!target) return;
            const action = target.dataset.action;
            const row = cell.getRow();
            const data = row.getData() as EnemyCharacter;

            if (action === 'restore') {
              if (!confirm('체력을 최대체력으로 회복하시겠습니까?')) return;
              const current = table.getData() as EnemyCharacter[];
              const updated = current.map(c =>
                c.num === data.num ? { ...c, hp: c.maxHp } : c
              );
              table.replaceData(updated);
              updateEnemyChars(updated);
              return;
            }

            if (action === 'delete') {
              if (!confirm('적 캐릭터를 삭제하시겠습니까?')) return;
              const current = table.getData() as EnemyCharacter[];
              let id = 1;
              const filtered: EnemyCharacter[] = [];
              for (const c of current) {
                if (c.num === data.num) continue;
                filtered.push({ ...c, id, num: id });
                id++;
              }
              table.replaceData(filtered);
              updateEnemyChars(filtered);
            }
          },
          width: 100,
        },
      ],
      langs: {
        'ko-kr': {
          data: {
            loading: '불러오는 중',
            error: '오류',
          },
          groups: {
            item: '적 캐릭터',
            items: '적 캐릭터',
          },
          pagination: {
            page_size: '페이지 크기',
            page_title: '페이지 보기',
            first: '처음',
            first_title: '첫 페이지',
            last: '마지막',
            last_title: '마지막 페이지',
            prev: '이전',
            prev_title: '이전 페이지',
            next: '다음',
            next_title: '다음 페이지',
            all: '모두 보기',
          },
        },
      },
    });

    table.on('cellEdited', () => {
      const data = table.getData() as EnemyCharacter[];
      updateEnemyChars(data);
    });

    enemyTabulatorInstance.current = table;

    return () => {
      table.destroy();
    };
  }, [updateEnemyChars]);

  const handleAddAllyChar = useCallback(() => {
    const table = allyTabulatorInstance.current;
    if (!table) return;
    const current = table.getData() as Character[];
    const newId = current.length > 0 ? Math.max(...current.map(c => c.num)) + 1 : 1;
    const newChar: Character = {
      id: newId,
      num: newId,
      name: '여기에 이름 입력',
      atk: 5,
      def: 5,
      atkb: 0,
      defb: 0,
      debuff: '-0',
      maxHp: 100,
      hp: 100,
    };
    const updated = [...current, newChar];
    table.replaceData(updated);
    updateChars(updated);
  }, [updateChars]);

  const handleEmptyAllyData = useCallback(() => {
    const table = allyTabulatorInstance.current;
    if (!table) return;
    table.replaceData([]);
    updateChars([]);
  }, [updateChars]);

  const handleAddEnemyChar = useCallback(() => {
    const table = enemyTabulatorInstance.current;
    if (!table) return;
    const current = table.getData() as EnemyCharacter[];
    const newId = current.length > 0 ? Math.max(...current.map(c => c.num)) + 1 : 1;
    const newChar: EnemyCharacter = {
      id: newId,
      num: newId,
      name: '여기에 이름 입력',
      atk: 2,
      maxHp: 10,
      hp: 10,
    };
    const updated = [...current, newChar];
    table.replaceData(updated);
    updateEnemyChars(updated);
  }, [updateEnemyChars]);

  const handleEmptyEnemyData = useCallback(() => {
    const table = enemyTabulatorInstance.current;
    if (!table) return;
    table.replaceData([]);
    updateEnemyChars([]);
  }, [updateEnemyChars]);

  // characters state가 변경될 때 tabulator와 동기화 (외부 변경 시)
  useEffect(() => {
    if (allyTabulatorInstance.current && characters.length >= 0) {
      // 이미 tabulator 내부에서 관리되므로 별도 동기화 불필요
    }
  }, [characters]);

  useEffect(() => {
    if (enemyTabulatorInstance.current && enemyCharacters.length >= 0) {
      // 이미 tabulator 내부에서 관리되므로 별도 동기화 불필요
    }
  }, [enemyCharacters]);

  const handleTemplateChange = useCallback((key: MessageTemplateKey, e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTemplates(prev => ({ ...prev, [key]: value }));
    storageService.setMessageTemplate(key, value);
  }, []);

  return (
    <>
      <div className="row" style={{ paddingTop: '10px' }}>
        <h2>아군 캐릭터 목록</h2>
        <div ref={allyTableRef} style={{ padding: 0 }}></div>
        <div style={{ paddingTop: '8px' }}>
          <button type="button" className="btn btn-outline-primary btn-sm me-2" onClick={handleAddAllyChar}>
            새 캐릭터
          </button>
          <button type="button" className="btn btn-outline-danger btn-sm me-2" onClick={handleEmptyAllyData}>
            데이터 비우기
          </button>
          {canSync && (
            <>
              <button
                type="button"
                className="btn btn-outline-info btn-sm me-2"
                disabled={syncing}
                onClick={async () => {
                  setSyncing(true);
                  try {
                    await syncCategoryToServer('characters');
                    alert('아군 캐릭터를 서버에 저장했습니다.');
                  } catch {
                    alert('아군 캐릭터 서버 저장에 실패했습니다.');
                  } finally {
                    setSyncing(false);
                  }
                }}
              >
                서버에 저장
              </button>
              <button
                type="button"
                className="btn btn-outline-success btn-sm"
                disabled={syncing}
                onClick={async () => {
                  setSyncing(true);
                  try {
                    const loaded = await syncCategoryFromServer('characters');
                    if (loaded) {
                      const newChars = storageService.getCharacters();
                      setCharacters(newChars);
                      if (allyTabulatorInstance.current) {
                        allyTabulatorInstance.current.replaceData(newChars);
                      }
                      alert('서버에서 아군 캐릭터를 불러왔습니다.');
                    } else {
                      alert('서버에 저장된 아군 캐릭터 데이터가 없습니다.');
                    }
                  } catch {
                    alert('서버에서 아군 캐릭터 불러오기에 실패했습니다.');
                  } finally {
                    setSyncing(false);
                  }
                }}
              >
                서버에서 불러오기
              </button>
            </>
          )}
        </div>
      </div>
      <div className="row" style={{ paddingTop: '20px' }}>
        <h2>적 캐릭터 목록</h2>
        <div ref={enemyTableRef} style={{ padding: 0 }}></div>
        <div style={{ paddingTop: '8px' }}>
          <button type="button" className="btn btn-outline-primary btn-sm me-2" onClick={handleAddEnemyChar}>
            새 적 캐릭터
          </button>
          <button type="button" className="btn btn-outline-danger btn-sm me-2" onClick={handleEmptyEnemyData}>
            데이터 비우기
          </button>
          {canSync && (
            <>
              <button
                type="button"
                className="btn btn-outline-info btn-sm me-2"
                disabled={syncing}
                onClick={async () => {
                  setSyncing(true);
                  try {
                    await syncCategoryToServer('enemyCharacters');
                    alert('적 캐릭터를 서버에 저장했습니다.');
                  } catch {
                    alert('적 캐릭터 서버 저장에 실패했습니다.');
                  } finally {
                    setSyncing(false);
                  }
                }}
              >
                서버에 저장
              </button>
              <button
                type="button"
                className="btn btn-outline-success btn-sm"
                disabled={syncing}
                onClick={async () => {
                  setSyncing(true);
                  try {
                    const loaded = await syncCategoryFromServer('enemyCharacters');
                    if (loaded) {
                      const newEnemyChars = storageService.getEnemyCharacters();
                      setEnemyCharacters(newEnemyChars);
                      if (enemyTabulatorInstance.current) {
                        enemyTabulatorInstance.current.replaceData(newEnemyChars);
                      }
                      alert('서버에서 적 캐릭터를 불러왔습니다.');
                    } else {
                      alert('서버에 저장된 적 캐릭터 데이터가 없습니다.');
                    }
                  } catch {
                    alert('서버에서 적 캐릭터 불러오기에 실패했습니다.');
                  } finally {
                    setSyncing(false);
                  }
                }}
              >
                서버에서 불러오기
              </button>
            </>
          )}
        </div>
      </div>
      <div className="row" style={{ paddingTop: '20px' }}>
        <h2>자동 메세지 생성 설정</h2>
        <div className="mb-3">
          <label htmlFor="atksuccess" className="form-label">공격 성공 메세지 양식</label>
          <textarea
            id="atksuccess"
            name="atksuccess"
            className="form-control"
            rows={5}
            value={templates.atksuccess}
            onChange={e => handleTemplateChange('atksuccess', e)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="atkfailed" className="form-label">공격 실패 메세지 양식</label>
          <textarea
            id="atkfailed"
            name="atkfailed"
            className="form-control"
            rows={5}
            value={templates.atkfailed}
            onChange={e => handleTemplateChange('atkfailed', e)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="defsuccess" className="form-label">방어 성공 메세지 양식</label>
          <textarea
            id="defsuccess"
            name="defsuccess"
            className="form-control"
            rows={5}
            value={templates.defsuccess}
            onChange={e => handleTemplateChange('defsuccess', e)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="deffailed" className="form-label">방어 실패 메세지 양식</label>
          <textarea
            id="deffailed"
            name="deffailed"
            className="form-control"
            rows={5}
            value={templates.deffailed}
            onChange={e => handleTemplateChange('deffailed', e)}
          />
        </div>
        <div className="mb-3">
          <button
            type="button"
            className="btn btn-outline-secondary me-2"
            onClick={() => {
              setTemplates(DEFAULT_TEMPLATES);
              for (const key of Object.keys(DEFAULT_TEMPLATES) as MessageTemplateKey[]) {
                storageService.setMessageTemplate(key, DEFAULT_TEMPLATES[key]);
              }
            }}
          >
            기본값으로 초기화
          </button>
          {canSync && (
            <>
              <button
                type="button"
                className="btn btn-outline-info me-2"
                disabled={syncing}
                onClick={async () => {
                  setSyncing(true);
                  try {
                    await syncCategoryToServer('messageTemplates');
                    alert('자동 메세지 설정을 서버에 저장했습니다.');
                  } catch {
                    alert('자동 메세지 설정 서버 저장에 실패했습니다.');
                  } finally {
                    setSyncing(false);
                  }
                }}
              >
                {syncing ? '동기화 중...' : '서버에 저장'}
              </button>
              <button
                type="button"
                className="btn btn-outline-success me-2"
                disabled={syncing}
                onClick={async () => {
                  setSyncing(true);
                  try {
                    const loaded = await syncCategoryFromServer('messageTemplates');
                    if (loaded) {
                      setTemplates(storageService.getMessageTemplates());
                      alert('서버에서 자동 메세지 설정을 불러왔습니다.');
                    } else {
                      alert('서버에 저장된 자동 메세지 데이터가 없습니다.');
                    }
                  } catch {
                    alert('서버에서 자동 메세지 설정 불러오기에 실패했습니다.');
                  } finally {
                    setSyncing(false);
                  }
                }}
              >
                {syncing ? '동기화 중...' : '서버에서 불러오기'}
              </button>
            </>
          )}
          <hr className="my-3" />
          <h5>전체 데이터 동기화</h5>
          {canSync && (
            <>
              <button
                type="button"
                className="btn btn-outline-primary me-2"
                disabled={syncing}
                onClick={async () => {
                  setSyncing(true);
                  try {
                    await syncToServer();
                    alert('모든 데이터를 서버에 저장했습니다.');
                  } catch {
                    alert('서버 저장에 실패했습니다.');
                  } finally {
                    setSyncing(false);
                  }
                }}
              >
                {syncing ? '동기화 중...' : '전체 서버에 저장'}
              </button>
              <button
                type="button"
                className="btn btn-outline-success me-2"
                disabled={syncing}
                onClick={async () => {
                  setSyncing(true);
                  try {
                    const loaded = await syncFromServer();
                    if (loaded) {
                      // 테이블과 템플릿 새로고침
                      const newChars = storageService.getCharacters();
                      setCharacters(newChars);
                      if (allyTabulatorInstance.current) {
                        allyTabulatorInstance.current.replaceData(newChars);
                      }
                      const newEnemyChars = storageService.getEnemyCharacters();
                      setEnemyCharacters(newEnemyChars);
                      if (enemyTabulatorInstance.current) {
                        enemyTabulatorInstance.current.replaceData(newEnemyChars);
                      }
                      setTemplates(storageService.getMessageTemplates());
                      alert('서버에서 모든 데이터를 불러왔습니다.');
                    } else {
                      alert('서버에 저장된 데이터가 없습니다.');
                    }
                  } catch {
                    alert('서버에서 데이터 불러오기에 실패했습니다.');
                  } finally {
                    setSyncing(false);
                  }
                }}
              >
                {syncing ? '동기화 중...' : '전체 서버에서 불러오기'}
              </button>
            </>
          )}
        </div>
        <p>
          %적이름% : 적 이름<br />
          %적체력% : 적 체력<br />
          %적다이스% : 적 다이스 숫자<br />
          %캐이름% : 캐릭터 이름<br />
          %캐체력% : 캐릭터 체력<br />
          %캐다이스% : 캐릭터 다이스 숫자(디버프 포함)<br />
          %데미지% : 적에게 입힌 피해 / 캐릭터가 받은 피해<br />
          %계산식% : 데미지 계산 과정
        </p>
        <p>
          <strong>조사 자동 처리</strong><br />
          이름 뒤에 조사를 붙이면 받침에 맞게 자동으로 변환됩니다.<br />
          예: <code>%캐이름이/가%</code> → &quot;홍길동이&quot; 또는 &quot;나나가&quot;<br />
          예: <code>%적이름을/를%</code> → &quot;드래곤을&quot; 또는 &quot;오크를&quot;<br />
          지원 조사: 이/가, 을/를, 은/는, 와/과, 으로/로 등
        </p>
      </div>
    </>
  );
}
