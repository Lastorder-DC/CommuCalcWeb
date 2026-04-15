# X (Twitter) API 설정 가이드

이 문서는 커뮤 전투 계산기에서 X(구 Twitter) 계정 로그인 기능을 활성화하기 위한 X API 설정 방법을 안내합니다.

## 1. X Developer 계정 생성

1. [X Developer Portal](https://developer.x.com/)에 접속합니다.
2. X 계정으로 로그인합니다.
3. Developer 계정이 없다면 가입 절차를 진행합니다.

## 2. X App 생성

1. Developer Portal에서 **Projects & Apps** 메뉴로 이동합니다.
2. **+ Create App** 버튼을 클릭하여 새 앱을 생성합니다.
3. 앱 이름을 입력합니다 (예: `커뮤 전투 계산기`).

## 3. OAuth 2.0 설정

1. 생성한 앱의 **Settings** 탭으로 이동합니다.
2. **User authentication settings** 섹션에서 **Set up** 버튼을 클릭합니다.
3. 다음과 같이 설정합니다:

| 항목 | 설정값 |
|------|--------|
| **App permissions** | `Read` (읽기 전용) |
| **Type of App** | `Web App, Automated App or Bot` (Confidential client) |
| **Callback URI / Redirect URL** | `https://your-domain.com/x/callback` |
| **Website URL** | `https://your-domain.com` |

> ⚠️ **Callback URI**는 클라이언트 앱의 `/x/callback` 경로를 정확히 입력해야 합니다.
> 예: `https://calc.yumeka.xyz/x/callback`

4. **Save** 버튼을 클릭합니다.

## 4. Keys & Tokens 확인

1. 앱의 **Keys and tokens** 탭으로 이동합니다.
2. 다음 정보를 확인합니다:
   - **Client ID** — OAuth 2.0 클라이언트 ID
   - **Client Secret** — OAuth 2.0 클라이언트 시크릿 (Confidential Client인 경우)

> ⚠️ Client Secret은 생성 시 한 번만 표시됩니다. 안전한 곳에 저장해 두세요.

## 5. 서버 환경변수 설정

서버의 `.env` 파일에 다음 환경변수를 추가합니다:

```env
# X (Twitter) OAuth 2.0 설정
X_CLIENT_ID=your_client_id_here
X_CLIENT_SECRET=your_client_secret_here
X_CALLBACK_URL=https://your-domain.com/x/callback
```

| 환경변수 | 설명 | 예시 |
|----------|------|------|
| `X_CLIENT_ID` | X Developer Console의 Client ID | `M1M5R3BMVy13Qm...` |
| `X_CLIENT_SECRET` | X Developer Console의 Client Secret | `rG9n6402A3dbUJ...` |
| `X_CALLBACK_URL` | 클라이언트 앱의 콜백 URL | `https://calc.yumeka.xyz/x/callback` |

> ⚠️ `X_CALLBACK_URL`은 X Developer Console에 등록한 **Callback URI**와 정확히 일치해야 합니다.

## 6. 데이터베이스 마이그레이션

X 로그인 기능을 사용하려면 `users` 테이블에 `x_id` 컬럼이 필요합니다.
`init-db.js` 스크립트를 실행하면 자동으로 추가됩니다:

```bash
cd server
npm run init-db
```

기존 테이블이 있는 경우에도 자동으로 `x_id` 컬럼을 추가합니다.

## 7. 동작 확인

1. 서버를 재시작합니다.
2. `/health` 엔드포인트에서 `xLoginEnabled: true`가 반환되는지 확인합니다:
   ```bash
   curl https://your-api-server.com/health
   ```
   응답 예시:
   ```json
   {
     "status": "ok",
     "serverVersion": "0.7.0",
     "minClientVersion": "0.6.0",
     "xLoginEnabled": true
   }
   ```
3. 로그인 페이지에 **X 계정으로 로그인** 버튼이 표시되는지 확인합니다.

## 8. 비활성화

X 로그인을 비활성화하려면 `.env` 파일에서 `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_CALLBACK_URL` 중 하나 이상을 제거하거나 비워두면 됩니다. 세 값이 모두 설정되어 있어야만 X 로그인이 활성화됩니다.

서버에서 X API 환경변수가 미설정 상태이면:
- `/health`의 `xLoginEnabled`가 `false`로 반환됩니다.
- 클라이언트 로그인 페이지에서 X 로그인 버튼이 표시되지 않습니다.

## OAuth 2.0 인증 플로우 요약

```
사용자 → [X 로그인 버튼 클릭]
       → 서버 GET /auth/x/login (authorize URL + PKCE code_challenge 생성)
       → X 인증 페이지로 리다이렉트
       → 사용자 승인
       → /x/callback?code=...&state=... 으로 리다이렉트
       → 클라이언트 POST /auth/x/callback (code, state 전달)
       → 서버: code → access_token 교환 (X API)
       → 서버: access_token으로 X 사용자 정보 조회
       → 서버: DB에서 사용자 조회
         ├─ 기존 사용자: JWT 발급 → 로그인 완료
         └─ 신규 사용자: needsEmail 응답 (X 이메일 포함 시 사전 입력)
            → 이메일 입력 + 약관 동의 → POST /auth/complete-signup → JWT 발급 → 가입 완료
```

## 주의사항

- X API는 **OAuth 2.0 Authorization Code Flow with PKCE**를 사용합니다.
- Confidential Client (Web App) 타입으로 설정해야 Client Secret을 사용할 수 있습니다.
- X OAuth state는 10분 후 만료됩니다.
- X 계정으로 처음 로그인 시 이메일 입력 및 약관/개인정보처리방침 동의 페이지로 이동합니다. X API에서 이메일을 가져올 수 있는 경우 이메일 필드에 자동으로 채워집니다.
- 이메일 입력과 약관 동의가 완료되어야 가입이 최종 처리됩니다.
