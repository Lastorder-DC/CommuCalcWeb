import { APP_TITLE } from '../config';

export default function GuidePage() {
  return (
    <div className="row" style={{ paddingTop: '10px' }}>
      <h2>계산식 설명서</h2>
      <p className="text-muted">{APP_TITLE} — 계산 방식 상세 설명</p>

      <div className="col-12">
        {/* 기본 개요 */}
        <div className="card mb-3">
          <div className="card-header"><strong>1. 기본 개요</strong></div>
          <div className="card-body">
            <p>전투는 <strong>공격 모드</strong>와 <strong>방어 모드</strong> 두 가지로 나뉩니다.</p>
            <p>매 전투마다 <strong>적 다이스(1~6)</strong>와 <strong>캐릭터 다이스(1~6)</strong>를 각각 굴립니다.</p>
            <pre className="bg-light p-2 rounded">
{`적 다이스 = dice(6)  // 1~6 랜덤
캐릭터 다이스 = dice(6)  // 1~6 랜덤`}
            </pre>
          </div>
        </div>

        {/* 성공/실패 판정 */}
        <div className="card mb-3">
          <div className="card-header"><strong>2. 성공/실패 판정</strong></div>
          <div className="card-body">
            <p>캐릭터 다이스에 <strong>디버프 값</strong>을 더한 후, 적 다이스와 비교합니다.</p>
            <pre className="bg-light p-2 rounded">
{`판정값 = 캐릭터 다이스 + 디버프
성공 조건: 판정값 >= 적 다이스`}
            </pre>
            <div className="alert alert-info">
              <strong>디버프</strong>는 보통 0 또는 음수(-1, -2 등)입니다.
              디버프가 클수록 성공 확률이 낮아집니다.
            </div>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>캐릭터 다이스</th>
                  <th>디버프</th>
                  <th>판정값</th>
                  <th>적 다이스</th>
                  <th>결과</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>5</td><td>-1</td><td>4</td><td>3</td><td className="text-success">성공</td></tr>
                <tr><td>3</td><td>-2</td><td>1</td><td>4</td><td className="text-danger">실패</td></tr>
                <tr><td>4</td><td>0</td><td>4</td><td>4</td><td className="text-success">성공 (같으면 성공)</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 공격 모드 */}
        <div className="card mb-3">
          <div className="card-header"><strong>3. 공격 모드</strong></div>
          <div className="card-body">
            <h5 className="text-success">공격 성공 시</h5>
            <p>캐릭터의 공격력과 무기 데미지를 합산하여 적에게 피해를 줍니다.</p>
            <pre className="bg-light p-2 rounded">
{`데미지 = 공격력 + 무기 데미지
적 체력 = 적 체력 - 데미지
(적 체력이 0 이하면 적 쓰러짐)`}
            </pre>

            <h5 className="text-danger mt-3">공격 실패 시</h5>
            <p>적이 반격합니다. 적 다이스 × 적 공격력에서 캐릭터의 방어력과 방어구를 뺀 만큼 피해를 받습니다.</p>
            <pre className="bg-light p-2 rounded">
{`데미지 = (적 다이스 × 적 공격력) - 방어력 - 방어구
(데미지가 0 미만이면 0으로 처리)
캐릭터 체력 = 캐릭터 체력 - 데미지
(캐릭터 체력이 0 이하면 0으로 고정)`}
            </pre>

            <div className="alert alert-warning">
              <strong>예시:</strong> 적 다이스 5, 적 공격력 2, 캐릭터 방어력 3, 방어구 1<br />
              → 데미지 = (5 × 2) - 3 - 1 = <strong>6</strong>
            </div>
          </div>
        </div>

        {/* 방어 모드 */}
        <div className="card mb-3">
          <div className="card-header"><strong>4. 방어 모드</strong></div>
          <div className="card-body">
            <h5 className="text-success">방어 성공 시</h5>
            <p>적의 공격을 완전히 방어합니다. 피해 없음.</p>
            <pre className="bg-light p-2 rounded">
{`데미지 = 0
캐릭터 체력 변화 없음`}
            </pre>

            <h5 className="text-danger mt-3">방어 실패 시</h5>
            <p>공격 실패와 동일하게 적의 반격 피해를 받습니다.</p>
            <pre className="bg-light p-2 rounded">
{`데미지 = (적 다이스 × 적 공격력) - 방어력 - 방어구
(데미지가 0 미만이면 0으로 처리)
캐릭터 체력 = 캐릭터 체력 - 데미지`}
            </pre>
          </div>
        </div>

        {/* 입력값 설명 */}
        <div className="card mb-3">
          <div className="card-header"><strong>5. 각 입력값이 미치는 영향</strong></div>
          <div className="card-body">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>입력값</th>
                  <th>사용 위치</th>
                  <th>영향</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>공격력 (atk)</strong></td>
                  <td>공격 성공 시 데미지 계산</td>
                  <td>높을수록 적에게 더 큰 피해</td>
                </tr>
                <tr>
                  <td><strong>방어력 (def)</strong></td>
                  <td>공격/방어 실패 시 받는 데미지 감소</td>
                  <td>높을수록 받는 피해 감소</td>
                </tr>
                <tr>
                  <td><strong>무기 데미지 (atkb)</strong></td>
                  <td>공격 성공 시 공격력에 추가</td>
                  <td>공격력과 합산되어 적 피해 증가</td>
                </tr>
                <tr>
                  <td><strong>방어구 (defb)</strong></td>
                  <td>공격/방어 실패 시 방어력에 추가</td>
                  <td>방어력과 합산되어 받는 피해 감소</td>
                </tr>
                <tr>
                  <td><strong>디버프 (debuff)</strong></td>
                  <td>성공/실패 판정</td>
                  <td>음수일수록 성공 확률 감소 (다이스에 가산)</td>
                </tr>
                <tr>
                  <td><strong>체력 (hp)</strong></td>
                  <td>피해를 받을 때 감소</td>
                  <td>0이 되면 사망, 행동 불가</td>
                </tr>
                <tr>
                  <td><strong>적 공격력</strong></td>
                  <td>적의 반격 데미지 계산</td>
                  <td>적 다이스와 곱해져 반격 피해 결정</td>
                </tr>
                <tr>
                  <td><strong>적 체력</strong></td>
                  <td>공격 성공 시 차감 대상</td>
                  <td>0 이하가 되면 적 쓰러짐</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 메세지 템플릿 */}
        <div className="card mb-3">
          <div className="card-header"><strong>6. 메세지 템플릿 변수</strong></div>
          <div className="card-body">
            <p>전투 결과 메세지에서 사용할 수 있는 치환 변수입니다.</p>
            <table className="table table-bordered">
              <thead>
                <tr><th>변수</th><th>설명</th></tr>
              </thead>
              <tbody>
                <tr><td><code>%적이름%</code></td><td>적 이름</td></tr>
                <tr><td><code>%적체력%</code></td><td>전투 후 적 체력</td></tr>
                <tr><td><code>%적다이스%</code></td><td>적 다이스 결과 (1~6)</td></tr>
                <tr><td><code>%캐이름%</code></td><td>캐릭터 이름</td></tr>
                <tr><td><code>%캐체력%</code></td><td>전투 후 캐릭터 체력</td></tr>
                <tr><td><code>%캐다이스%</code></td><td>캐릭터 다이스 결과 (디버프가 있으면 표시)</td></tr>
                <tr><td><code>%데미지%</code></td><td>이번 전투에서 발생한 피해량</td></tr>
              </tbody>
            </table>
            <h5 className="mt-3">조사 자동 처리</h5>
            <p>
              이름 변수 뒤에 조사를 붙이면 받침 유무에 따라 자동으로 올바른 조사가 선택됩니다.
            </p>
            <table className="table table-bordered">
              <thead>
                <tr><th>사용법</th><th>예시 (캐이름=&quot;홍길동&quot;)</th><th>예시 (캐이름=&quot;나나&quot;)</th></tr>
              </thead>
              <tbody>
                <tr><td><code>%캐이름이/가%</code></td><td>홍길동이</td><td>나나가</td></tr>
                <tr><td><code>%캐이름을/를%</code></td><td>홍길동을</td><td>나나를</td></tr>
                <tr><td><code>%캐이름은/는%</code></td><td>홍길동은</td><td>나나는</td></tr>
                <tr><td><code>%캐이름과/와%</code></td><td>홍길동과</td><td>나나와</td></tr>
                <tr><td><code>%적이름으로/로%</code></td><td>드래곤으로</td><td>오크로</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 플로우차트 */}
        <div className="card mb-3">
          <div className="card-header"><strong>7. 전투 흐름 요약</strong></div>
          <div className="card-body">
            <pre className="bg-light p-3 rounded" style={{ fontSize: '0.9rem' }}>
{`[전투 시작]
  │
  ├─ 적 다이스 (1~6) 굴림
  ├─ 캐릭터 다이스 (1~6) 굴림
  │
  ├─ 판정: (캐릭터 다이스 + 디버프) >= 적 다이스?
  │   │
  │   ├─ [공격 모드]
  │   │   ├─ 성공 → 데미지 = 공격력 + 무기  → 적 체력 감소
  │   │   └─ 실패 → 반격 데미지 = (적다이스 × 적공격력) - 방어력 - 방어구 → 캐릭터 체력 감소
  │   │
  │   └─ [방어 모드]
  │       ├─ 성공 → 피해 없음
  │       └─ 실패 → 반격 데미지 = (적다이스 × 적공격력) - 방어력 - 방어구 → 캐릭터 체력 감소
  │
  └─ [결과 출력] (메세지 템플릿에 값 치환)`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
