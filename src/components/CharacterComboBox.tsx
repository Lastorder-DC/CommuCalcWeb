import { useState, useRef, useEffect, useCallback } from 'react';

interface ComboBoxOption {
  value: string;
  label: string;
}

interface CharacterComboBoxProps {
  id: string;
  options: ComboBoxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * 드롭다운 선택과 텍스트 검색을 모두 지원하는 콤보박스 컴포넌트
 */
export default function CharacterComboBox({ id, options, value, onChange, placeholder = '캐릭터 검색...' }: CharacterComboBoxProps) {
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<ComboBoxOption[]>(options);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // value가 바뀌면 input 텍스트도 업데이트
  useEffect(() => {
    const selected = options.find(o => o.value === value);
    setInputText(selected ? selected.label : '');
  }, [value, options]);

  // 옵션 목록이 바뀌면 필터 갱신
  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // 선택되지 않은 텍스트가 있으면 원래 값으로 복원
        const selected = options.find(o => o.value === value);
        setInputText(selected ? selected.label : '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [options, value]);

  const sortOptions = useCallback((text: string) => {
    if (text === '') return options;
    const lower = text.toLowerCase();
    const matching: ComboBoxOption[] = [];
    const rest: ComboBoxOption[] = [];
    for (const o of options) {
      if (o.label.toLowerCase().includes(lower)) {
        matching.push(o);
      } else {
        rest.push(o);
      }
    }
    return [...matching, ...rest];
  }, [options]);

  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    setIsOpen(true);
    setFilteredOptions(sortOptions(text));
  }, [sortOptions]);

  const handleSelect = useCallback((opt: ComboBoxOption) => {
    onChange(opt.value);
    setInputText(opt.label);
    setIsOpen(false);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      const selected = options.find(o => o.value === value);
      setInputText(selected ? selected.label : '');
    } else if (e.key === 'Enter') {
      // 매칭되는 결과가 하나이면 자동 선택
      const lower = inputText.toLowerCase();
      const matching = filteredOptions.filter(o => o.label.toLowerCase().includes(lower));
      if (matching.length === 1) {
        handleSelect(matching[0]);
      }
    }
  }, [options, value, inputText, filteredOptions, handleSelect]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div className="input-group">
        <input
          id={id}
          ref={inputRef}
          type="text"
          className="form-control"
          value={inputText}
          placeholder={placeholder}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => {
            setIsOpen(true);
            setFilteredOptions(sortOptions(inputText));
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setFilteredOptions(sortOptions(inputText));
              inputRef.current?.focus();
            }
          }}
          tabIndex={-1}
        >
          ▼
        </button>
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <ul
          className="list-group"
          style={{
            position: 'absolute',
            zIndex: 1050,
            width: '100%',
            maxHeight: '200px',
            overflowY: 'auto',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {filteredOptions.map(opt => (
            <li
              key={opt.value}
              className={`list-group-item list-group-item-action${opt.value === value ? ' active' : ''}`}
              style={{ cursor: 'pointer', padding: '6px 12px' }}
              onMouseDown={e => {
                e.preventDefault(); // blur 방지
                handleSelect(opt);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
