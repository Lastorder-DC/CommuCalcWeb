import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { storageService, DEFAULT_TEMPLATES } from '../services/storageService';
import type { Character, MessageTemplateKey } from '../types';
import { TabulatorFull as Tabulator, type CellComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import 'tabulator-tables/dist/css/tabulator_modern.min.css';

export default function CharacterPage() {
  const tableRef = useRef<HTMLDivElement>(null);
  const tabulatorInstance = useRef<Tabulator | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [templates, setTemplates] = useState(storageService.getMessageTemplates());

  const updateChars = useCallback((chars: Character[]) => {
    setCharacters(chars);
    storageService.setCharacters(chars);
  }, []);

  // Tabulator 초기화
  useEffect(() => {
    const chars = storageService.getCharacters();
    setCharacters(chars);

    if (!tableRef.current) return;

    const table = new Tabulator(tableRef.current, {
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
      footerElement:
        '<button class="tabulator-page" id="addCharBtn">새 캐릭터</button>' +
        '<button class="tabulator-page" id="emptyDataBtn">데이터 비우기</button>',
      initialSort: [{ column: 'num', dir: 'asc' }],
      columns: [
        { title: '번호', field: 'num', width: 80 },
        { title: '이름', field: 'name', editor: 'input', minWidth: 100 },
        { title: '공격력', field: 'atk', editor: 'input', width: 100 },
        { title: '방어력', field: 'def', editor: 'input', width: 100 },
        { title: '무기', field: 'atkb', editor: 'input', width: 100 },
        { title: '방어구', field: 'defb', editor: 'input', width: 100 },
        { title: '디버프', field: 'debuff', editor: 'input', width: 100 },
        { title: '체력', field: 'hp', editor: 'input', width: 100 },
        {
          title: '관리',
          field: 'manage',
          editor: undefined,
          formatter: () => '❌',
          cellClick: (_e: UIEvent, cell: CellComponent) => {
            const row = cell.getRow();
            const num = row.getData().num;
            const current = table.getData() as Character[];
            let id = 1;
            const filtered: Character[] = [];
            for (const c of current) {
              if (c.num === num) continue;
              filtered.push({ ...c, id, num: id });
              id++;
            }
            table.replaceData(filtered);
            updateChars(filtered);
          },
          width: 80,
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

    tabulatorInstance.current = table;

    // 푸터 버튼 이벤트 연결
    const addBtn = document.getElementById('addCharBtn');
    const emptyBtn = document.getElementById('emptyDataBtn');

    const handleAdd = () => {
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
        hp: 100,
      };
      const updated = [...current, newChar];
      table.replaceData(updated);
      updateChars(updated);
    };

    const handleEmpty = () => {
      table.replaceData([]);
      updateChars([]);
    };

    addBtn?.addEventListener('click', handleAdd);
    emptyBtn?.addEventListener('click', handleEmpty);

    return () => {
      addBtn?.removeEventListener('click', handleAdd);
      emptyBtn?.removeEventListener('click', handleEmpty);
      table.destroy();
    };
  }, [updateChars]);

  // characters state가 변경될 때 tabulator와 동기화 (외부 변경 시)
  useEffect(() => {
    if (tabulatorInstance.current && characters.length >= 0) {
      // 이미 tabulator 내부에서 관리되므로 별도 동기화 불필요
    }
  }, [characters]);

  const handleTemplateChange = useCallback((key: MessageTemplateKey, e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTemplates(prev => ({ ...prev, [key]: value }));
    storageService.setMessageTemplate(key, value);
  }, []);

  return (
    <>
      <div className="row" style={{ paddingTop: '10px' }}>
        <h2>캐릭터 목록</h2>
        <div id="charDB" ref={tableRef} style={{ padding: 0 }}></div>
      </div>
      <div className="row" style={{ paddingTop: '10px' }}>
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
        </div>
        <p>
          %적이름% : 적 이름<br />
          %적체력% : 적 체력<br />
          %적다이스% : 적 다이스 숫자<br />
          %캐이름% : 캐릭터 이름<br />
          %캐체력% : 캐릭터 체력<br />
          %캐다이스% : 캐릭터 다이스 숫자(디버프 포함)<br />
          %데미지% : 적에게 입힌 피해 / 캐릭터가 받은 피해
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
