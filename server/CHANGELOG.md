# Changelog

커뮤 전투 계산기 API 서버의 변경 이력입니다. 서버는 클라이언트 버전(`src/config.ts`의 `APP_VERSION`)과 동일한 시맨틱 버저닝을 사용하며, `serverVersion` / `minClientVersion`은 `server/src/config.js`에 정의됩니다.

## [1.1.2] - 2026-04-17

### Added
- `GET /changelog` 엔드포인트: `server/CHANGELOG.md`를 읽어 클라이언트가 사용할 수 있는 JSON 형태로 반환. `legal` 라우트와 동일한 캐시 패턴을 따름.
- 프로덕션 환경(`NODE_ENV=production`)에서 `JWT_SECRET`이 기본값(`change-this-secret`)이거나 미설정인 경우 서버 구동을 중단하도록 검증 로직 추가.

### Changed
- `/auth/reset-password` 엔드포인트를 이메일 관련 속도 제한(15분당 5회) 대상에 포함시켜, 토큰 탈취 후 반복 재사용 시도를 제한.
- 이메일을 받는 엔드포인트(`/auth/register`, `/auth/complete-signup`, `/auth/request-email-change`, `/auth/forgot-password`, `/auth/resend-verification`)에 서버 측 이메일 형식 검증 추가. `forgot-password`·`resend-verification`는 사용자 열거 공격을 피하기 위해 잘못된 형식에도 성공과 동일한 응답을 반환.

## [1.1.1] - 2026-04-17

### Added
- 이메일 발송을 유발하는 엔드포인트(`/auth/register`, `/auth/forgot-password`, `/auth/complete-signup`, `/auth/resend-verification`, `/auth/request-email-change`)에 15분당 5회의 IP별 속도 제한 적용.
- `/auth/register`, `/auth/complete-signup`, `/auth/resend-verification`에도 Cloudflare Turnstile 검증 확대 적용.

## [1.1.0] - 2026-04-17

### Added
- 이메일 인증 시스템: `email_verification_tokens`, `email_change_tokens`, `password_reset_tokens` 테이블 추가. 가입 시 인증 필요, 기존 사용자는 마이그레이션 시 자동 인증 처리.
- 비밀번호 찾기 API: `/auth/forgot-password`, `/auth/reset-password`. 임시 비밀번호 메일 발송.
- 이메일 변경 API: `/auth/request-email-change`, `/auth/verify-email-change`. 변경 완료 시 이전/새 이메일로 알림 메일 발송.
- 닉네임 변경 API(`PUT /auth/username`, 중복 허용).
- OAuth 최초 가입 완료 API(`POST /auth/complete-signup`). OAuth 가입자도 실제 이메일 입력·인증 필요.
- Cloudflare Turnstile 검증 헬퍼(`turnstile.js`) 및 로그인/비밀번호 찾기 적용.
- SMTP 이메일 발송 서비스(nodemailer 기반) 및 이메일 템플릿(`email-templates/`).

### Changed
- SMTP 환경 변수(`SMTP_HOST`/`PORT`/`USER`/`PASS`/`FROM`)가 하나라도 누락되면 서버 구동 중단(테스트 환경 제외).

## [1.0.0] - 2026-04-16

### Added
- 서버 테스트에 시맨틱 버전 형식 검증 추가.

### Changed
- 서버 종속성 업데이트(주요 패키지 마이너/메이저 업).

## [0.9.1] - 2026-04-16

### Added
- Mastodon 서버 멀티 설정 지원. 환경 변수 접미사 `_2~_5`로 최대 5개 서버 구성, `MASTODON_ICON_URL`로 서버 아이콘 지정.
- `/health` 응답에 `mastodonServers` 배열 포함(서버 이름·아이콘).

## [0.9.0] - 2026-04-16

### Added
- Mastodon OAuth 라우트(`/auth/mastodon`) 추가.
- OAuth 가입자에 대한 이메일 강제화: X/Mastodon 콜백이 `{needsEmail:true, provider, providerId, username}`을 반환, `/auth/complete-signup`에서 마무리.

## [0.8.3] - 2026-04-15

### Chore
- 서버 버전을 클라이언트 버전과 맞춰 0.8.3으로 정리.

## [0.8.2] - 2026-04-14

### Changed
- 로그인/회원가입/X 콜백 응답에 `hasPassword`, `xLinked` 필드 추가.

### Fixed
- X 로그인 시 기존 사용자의 실제 이메일을 가짜 `@x.user` 이메일로 덮어쓰지 않도록 수정.

## [0.8.1] - 2026-04-14

### Added
- X OAuth 스코프에 `users.email`을 포함하고 `confirmed_email` 필드로 이메일 조회.

### Fixed
- X API의 `client-not-enrolled` 오류에 대한 폴백 및 사용자 친화적 에러 메시지.

## [0.8.0] - 2026-04-14

### Added
- 계정 관리 API(마이페이지 지원): 사용자 정보 조회, 비밀번호 변경, 계정 삭제, X 연동/해제.

## [0.7.0] - 2026-04-14

### Added
- X(트위터) OAuth 2.0 로그인 지원. 환경 변수: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_CALLBACK_URL`.

## [0.6.0] - 2026-04-13

### Added
- 사용자 정의 PvE/PvP 피해 공식과 설정을 서버 DB에 저장하도록 스키마 확장.
- 이용약관·개인정보처리방침을 파일(`server/legal/terms.md`, `privacy.md`)에서 읽어 제공하는 `/legal/*` 라우트 추가(결과 캐시).

## [0.5.1] - 2026-04-13

### Added
- 이용약관·개인정보처리방침 기본 템플릿 문서(`*.example.md`) 추가.

## [0.5.0] - 2026-04-09

### Added
- 서버 측 단위 테스트 추가(Jest + supertest).

## [0.3.1] - 2026-04-09

### Fixed
- 프록시 뒤에서 `express-rate-limit`이 X-Forwarded-For 헤더로 오류를 내던 문제 해결(`app.set('trust proxy', 1)`).

## [0.3.0] - 2026-04-09

### Added
- `/health` 엔드포인트에 `serverVersion`, `minClientVersion` 포함. 클라이언트가 주기적으로 폴링해 최소 버전 체크.

## [0.2.0] - 2026-04-09

### Added
- Node.js 기반 API 서버 최초 구현(Express 5).
- 인증(회원가입·로그인, JWT), 사용자 데이터 저장/조회, CORS, 기본 속도 제한, Helmet 보안 헤더.
- MySQL 연결(`mysql2`) 및 `init-db.js` 스크립트로 초기 테이블 생성.
