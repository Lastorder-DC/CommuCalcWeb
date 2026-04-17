import type { ChangelogData } from '../types';

interface ChangelogViewProps {
  data: ChangelogData | null;
  loading: boolean;
  error: string;
  /** 헤더 제목 */
  title: string;
  /** 데이터 재조회 핸들러 (재시도 버튼용, 선택) */
  onRetry?: () => void;
}

/** 변경 이력(JSON) 공통 뷰어. 클라이언트/서버 changelog 페이지에서 재사용. */
export default function ChangelogView({ data, loading, error, title, onRetry }: ChangelogViewProps) {
  return (
    <div className="row" style={{ paddingTop: '10px' }}>
      <div className="col-lg-10">
        <h2>{title}</h2>
        {data?.intro && <p className="text-muted">{data.intro}</p>}

        {loading && <div className="text-muted">불러오는 중...</div>}
        {error && (
          <div className="alert alert-warning">
            {error}
            {onRetry && (
              <button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={onRetry}>
                다시 시도
              </button>
            )}
          </div>
        )}

        {data && data.entries.length === 0 && !loading && (
          <div className="text-muted">표시할 변경 이력이 없습니다.</div>
        )}

        {data && data.entries.map((entry, idx) => {
          const heading = entry.version
            ? `v${entry.version}${entry.date ? ` - ${entry.date}` : ''}`
            : entry.date || '(미지정)';
          const key = `${entry.version ?? 'none'}-${entry.date ?? idx}`;
          return (
            <div className="card mb-3" key={key}>
              <div className="card-header"><strong>{heading}</strong></div>
              <div className="card-body">
                {Object.entries(entry.sections).map(([section, items]) => (
                  <div className="mb-3" key={section}>
                    <h6>{section}</h6>
                    <ul className="mb-0">
                      {items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {Object.keys(entry.sections).length === 0 && (
                  <div className="text-muted">변경 내용 없음</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
