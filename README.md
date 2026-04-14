# CommuCalcWeb — 커뮤 전투 계산기

커뮤니티 기반 텍스트 RPG 전투 계산기 웹 앱입니다.

## 주요 기능

- **전투 시뮬레이션** — 공격/방어 모드 선택, 다이스 기반 전투 계산
- **캐릭터 관리** — 캐릭터 목록 추가/편집/삭제 (Tabulator 테이블)
- **자동 메세지 생성** — 전투 결과를 커스텀 메세지 템플릿으로 자동 생성
- **계산식 설명서** — 입력값이 전투에 어떻게 영향을 미치는지 설명
- **다크모드/라이트모드** — 테마 전환 지원 (시스템 설정 자동 감지)
- **커스텀 데미지 수식** — 곱/합 외에 사용자 정의 수식 입력 지원 (문법 검증 포함)
- **전투 기록** — 전투 결과를 별도로 저장 및 초기화, 서버 동기화 지원
- **세분화된 서버 동기화** — 아군 캐릭터, 적 캐릭터, 자동 메세지 설정, 데미지 수식 설정, 전투 기록을 각각 개별 저장/불러오기 가능
- **X (Twitter) 로그인** — X OAuth 2.0 PKCE 기반 소셜 로그인 지원
- **계정 관리 (마이페이지)** — 이메일 변경, 비밀번호 변경/설정, X 계정 연동/해제, 계정 삭제

## 기술 스택

- **React 19** + **TypeScript**
- **Vite** (빌드 도구)
- **Bootstrap 5** (UI 프레임워크, 다크모드 지원)
- **Tabulator** (테이블 컴포넌트)
- **React Router** (SPA 라우팅)

## 서버

- **Express 5** (API 서버)
- **MySQL** (데이터 저장)
- **JWT** (인증)
- **bcrypt** (비밀번호 암호화)
- **X OAuth 2.0** (소셜 로그인)

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

# 테스트
npm run test
```

### 서버 실행

```bash
cd server
npm install
npm start
```

서버 설정은 `.env` 파일을 통해 관리합니다. 기본 포트는 3000입니다.

X 로그인을 사용하려면 `.env`에 `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_CALLBACK_URL`을 설정하세요.
자세한 설정 방법은 [X_API_SETUP.md](X_API_SETUP.md)를 참고하세요.

## 프로젝트 구조

```
src/
├── components/     # 공통 컴포넌트 (Layout, Footer 등)
├── contexts/       # React Context (AuthContext, ThemeContext 등)
├── hooks/          # 커스텀 훅 (useDataSync 등)
├── pages/          # 페이지 컴포넌트
│   ├── HomePage.tsx
│   ├── CalcPage.tsx        # 전투 시뮬레이션 + 전투 기록
│   ├── CharacterPage.tsx   # 캐릭터 관리 + 서버 동기화
│   ├── GuidePage.tsx
│   ├── SettingsPage.tsx
│   ├── LoginPage.tsx       # 로그인 (이메일 + X 로그인)
│   ├── RegisterPage.tsx    # 회원가입
│   ├── MyPage.tsx          # 마이페이지 (계정 관리)
│   ├── XCallbackPage.tsx   # X OAuth 콜백 처리
│   ├── TermsPage.tsx
│   └── PrivacyPage.tsx
├── services/       # 비즈니스 로직
│   ├── battleService.ts    # 전투 계산 로직
│   ├── storageService.ts   # 데이터 저장/불러오기
│   ├── formulaService.ts   # 커스텀 수식 파서/검증
│   └── apiService.ts       # API 통신
├── styles/         # 글로벌 스타일
├── config.ts       # 앱 버전/설정
├── types.ts        # TypeScript 타입 정의
├── App.tsx
└── main.tsx

server/
├── legal/          # 법적 문서 (.md 파일)
│   ├── terms.example.md
│   └── privacy.example.md
└── src/
    ├── routes/     # API 라우트
    │   ├── auth.js     # 인증 (회원가입/로그인/비밀번호/이메일)
    │   ├── xAuth.js    # X OAuth 2.0 (로그인/연동/해제)
    │   ├── data.js     # 전체/부분 데이터 저장
    │   ├── health.js
    │   └── legal.js    # 법적 문서 (파일 기반)
    ├── config.js   # 서버 설정/버전
    └── index.js
```

## 법적 문서 관리

이용약관과 개인정보처리방침은 `server/legal/` 디렉토리에서 관리됩니다:

- `terms.md` / `privacy.md` — 사용자 정의 문서 (git 무시)
- `terms.example.md` / `privacy.example.md` — 기본 예제 문서

사용자 정의 파일이 없으면 자동으로 예제 파일을 사용합니다.

## 버전 관리

앱 버전은 `src/config.ts`에서, 서버 버전은 `server/src/config.js`에서 관리됩니다.

## CI/CD

GitHub Actions를 통해 push/PR 시 자동 빌드되며, 빌드 결과물은 artifact로 업로드됩니다.

## 라이선스

[LICENSE](LICENSE) 파일을 참고하세요.
