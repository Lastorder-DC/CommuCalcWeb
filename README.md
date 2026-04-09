# CommuCalcWeb — 커뮤 전투 계산기

커뮤니티 기반 텍스트 RPG 전투 계산기 웹 앱입니다.

## 주요 기능

- **전투 시뮬레이션** — 공격/방어 모드 선택, 다이스 기반 전투 계산
- **캐릭터 관리** — 캐릭터 목록 추가/편집/삭제 (Tabulator 테이블)
- **자동 메세지 생성** — 전투 결과를 커스텀 메세지 템플릿으로 자동 생성
- **계산식 설명서** — 입력값이 전투에 어떻게 영향을 미치는지 설명

## 기술 스택

- **React 19** + **TypeScript**
- **Vite** (빌드 도구)
- **Bootstrap 5** (UI 프레임워크)
- **Tabulator** (테이블 컴포넌트)
- **React Router** (SPA 라우팅)

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 린트
npm run lint
```

## 프로젝트 구조

```
src/
├── components/     # 공통 컴포넌트 (Layout 등)
├── contexts/       # React Context (AuthContext 등)
├── pages/          # 페이지 컴포넌트
│   ├── HomePage.tsx
│   ├── CalcPage.tsx
│   ├── CharacterPage.tsx
│   └── GuidePage.tsx
├── services/       # 비즈니스 로직
│   ├── battleService.ts    # 전투 계산 로직
│   └── storageService.ts   # 데이터 저장/불러오기
├── styles/         # 글로벌 스타일
├── config.ts       # 앱 버전/설정
├── types.ts        # TypeScript 타입 정의
├── App.tsx
└── main.tsx
```

## 버전 관리

앱 버전은 `src/config.ts`에서 관리됩니다.

## CI/CD

GitHub Actions를 통해 push/PR 시 자동 빌드되며, 빌드 결과물은 artifact로 업로드됩니다.

## 라이선스

[LICENSE](LICENSE) 파일을 참고하세요.
