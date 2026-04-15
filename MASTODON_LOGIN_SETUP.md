# Mastodon 로그인 설정 가이드

이 문서는 커뮤 전투 계산기에서 Mastodon 계정 로그인 기능을 활성화하기 위한 Mastodon OAuth 설정 방법을 안내합니다.

## 1. Mastodon 앱 생성

1. 사용할 Mastodon 서버에 로그인합니다 (예: `mastodon.social`, `pawoo.net` 등).
2. **설정** → **개발** 메뉴로 이동합니다.
3. **새 애플리케이션** 버튼을 클릭합니다.
4. 다음과 같이 설정합니다:

| 항목 | 설정값 |
|------|--------|
| **애플리케이션 이름** | `커뮤 전투 계산기` (원하는 이름) |
| **애플리케이션 웹사이트** | `https://your-domain.com` |
| **리다이렉트 URI** | `https://your-domain.com/mastodon/callback` |
| **권한 범위(Scopes)** | `read:accounts` (계정 정보 읽기만 필요) |

> ⚠️ **리다이렉트 URI**는 클라이언트 앱의 `/mastodon/callback` 경로를 정확히 입력해야 합니다.
> 예: `https://calc.yumeka.xyz/mastodon/callback`

5. **제출** 버튼을 클릭합니다.

## 2. 클라이언트 키 확인

앱이 생성되면 다음 정보가 표시됩니다:

- **클라이언트 키 (Client ID)** — OAuth 2.0 클라이언트 ID
- **클라이언트 시크릿 (Client Secret)** — OAuth 2.0 클라이언트 시크릿

> ⚠️ 이 정보를 안전한 곳에 저장해 두세요.

## 3. 서버 환경변수 설정

서버의 `.env` 파일에 다음 환경변수를 추가합니다. 최대 5개의 Mastodon 서버를 연동할 수 있습니다.

### 첫 번째 서버 (접미사 없음)

```env
# Mastodon 서버 1 설정
MASTODON_DOMAIN=mastodon.social
MASTODON_SERVER_NAME=마스토돈
MASTODON_CLIENT_ID=your_client_id_here
MASTODON_CLIENT_SECRET=your_client_secret_here
MASTODON_REDIRECT_URI=https://your-domain.com/mastodon/callback
MASTODON_ICON_URL=
```

### 추가 서버 (2~5번째, _2 ~ _5 접미사 사용)

```env
# Mastodon 서버 2 설정
MASTODON_DOMAIN_2=misskey.example.com
MASTODON_SERVER_NAME_2=미스키
MASTODON_CLIENT_ID_2=your_client_id_here
MASTODON_CLIENT_SECRET_2=your_client_secret_here
MASTODON_REDIRECT_URI_2=https://your-domain.com/mastodon/callback
MASTODON_ICON_URL_2=https://example.com/misskey-icon.png

# Mastodon 서버 3 설정
MASTODON_DOMAIN_3=another.instance.com
MASTODON_SERVER_NAME_3=다른 서버
MASTODON_CLIENT_ID_3=your_client_id_here
MASTODON_CLIENT_SECRET_3=your_client_secret_here
MASTODON_REDIRECT_URI_3=https://your-domain.com/mastodon/callback
MASTODON_ICON_URL_3=

# 서버 4, 5도 같은 패턴으로 _4, _5 접미사 사용
```

### 환경변수 설명

| 환경변수 | 설명 | 예시 |
|----------|------|------|
| `MASTODON_DOMAIN[_N]` | Mastodon 서버 도메인 (https:// 제외) | `mastodon.social` |
| `MASTODON_SERVER_NAME[_N]` | 로그인 버튼에 표시할 서버 이름 (선택사항) | `마스토돈` |
| `MASTODON_CLIENT_ID[_N]` | Mastodon 앱의 클라이언트 키 | `a1b2c3d4e5...` |
| `MASTODON_CLIENT_SECRET[_N]` | Mastodon 앱의 클라이언트 시크릿 | `f6g7h8i9j0...` |
| `MASTODON_REDIRECT_URI[_N]` | 클라이언트 앱의 콜백 URL | `https://calc.yumeka.xyz/mastodon/callback` |
| `MASTODON_ICON_URL[_N]` | 로그인 버튼에 표시할 커스텀 아이콘 URL (선택사항) | `https://example.com/icon.png` |

> `[_N]`은 서버 번호 접미사입니다. 첫 번째 서버는 접미사 없이, 2~5번째 서버는 `_2` ~ `_5`를 붙입니다.

> ⚠️ `MASTODON_REDIRECT_URI`는 Mastodon 앱 설정에 등록한 **리다이렉트 URI**와 정확히 일치해야 합니다. 모든 서버가 동일한 콜백 URL을 사용할 수 있습니다.

> ℹ️ `MASTODON_SERVER_NAME`은 선택사항입니다. 설정하면 로그인 버튼에 "마스토돈으로 로그인" 대신 설정한 이름이 표시됩니다. 미설정 시 기본값으로 "Mastodon으로 로그인"이 표시됩니다.

> ℹ️ `MASTODON_ICON_URL`은 선택사항입니다. 설정하면 로그인 버튼과 마이페이지의 연동 버튼에서 기본 Mastodon 로고 대신 지정한 아이콘이 표시됩니다. SVG, PNG 등 이미지 형식을 지원합니다. 미설정 시 기본 Mastodon 로고가 사용됩니다.

## 4. 데이터베이스 마이그레이션

Mastodon 로그인 기능을 사용하려면 `users` 테이블에 `mastodon_id` 컬럼이 필요합니다.
`init-db.js` 스크립트를 실행하면 자동으로 추가됩니다:

```bash
cd server
npm run init-db
```

기존 테이블이 있는 경우에도 자동으로 `mastodon_id` 컬럼을 추가합니다.

## 5. 동작 확인

1. 서버를 재시작합니다.
2. `/health` 엔드포인트에서 `mastodonLoginEnabled: true`가 반환되는지 확인합니다:
   ```bash
   curl https://your-api-server.com/health
   ```
   응답 예시 (서버 2개 구성):
   ```json
   {
     "status": "ok",
     "serverVersion": "0.9.1",
     "minClientVersion": "0.9.1",
     "xLoginEnabled": false,
     "mastodonLoginEnabled": true,
     "mastodonServers": [
       { "index": 0, "serverName": "마스토돈" },
       { "index": 1, "serverName": "미스키", "iconUrl": "https://example.com/misskey-icon.png" }
     ],
     "mastodonServerName": "마스토돈"
   }
   ```
3. 로그인 페이지에 각 Mastodon 서버별 로그인 버튼이 표시되는지 확인합니다.

## 6. 비활성화

Mastodon 로그인을 비활성화하려면 `.env` 파일에서 각 서버의 `MASTODON_DOMAIN`, `MASTODON_CLIENT_ID`, `MASTODON_CLIENT_SECRET`, `MASTODON_REDIRECT_URI` 중 하나 이상을 제거하거나 비워두면 됩니다. 네 값이 모두 설정되어 있어야만 해당 서버의 Mastodon 로그인이 활성화됩니다. 모든 서버가 비활성화되면 Mastodon 로그인 기능이 전체적으로 비활성화됩니다.

서버에서 Mastodon API 환경변수가 미설정 상태이면:
- `/health`의 `mastodonLoginEnabled`가 `false`로 반환됩니다.
- 클라이언트 로그인 페이지에서 Mastodon 로그인 버튼이 표시되지 않습니다.

## OAuth 인증 플로우 요약

```
사용자 → [Mastodon 로그인 버튼 클릭 (서버 N 선택)]
       → 서버 GET /auth/mastodon/login?serverIndex=N (authorize URL + state 생성)
       → Mastodon 인증 페이지로 리다이렉트
       → 사용자 승인
       → /mastodon/callback?code=...&state=... 으로 리다이렉트
       → 클라이언트 POST /auth/mastodon/callback (code, state 전달)
       → 서버: state에서 서버 인덱스 확인 → 해당 서버의 설정으로 처리
       → 서버: code → access_token 교환 (Mastodon API)
       → 서버: access_token으로 Mastodon 사용자 정보 조회 (verify_credentials)
       → 서버: DB에서 사용자 조회
         ├─ 기존 사용자: JWT 발급 → 로그인 완료
         └─ 신규 사용자: needsEmail 응답 → 이메일 입력 페이지
            → 이메일 + 약관 동의 → POST /auth/complete-signup → JWT 발급 → 가입 완료
```

## 주의사항

- Mastodon은 **OAuth 2.0 Authorization Code Flow**를 사용합니다 (PKCE 불필요).
- 요청하는 권한 범위(scope)는 `read:accounts`만으로 충분합니다.
- Mastodon OAuth state는 10분 후 만료됩니다.
- 처음 로그인하는 사용자는 이메일 주소를 직접 입력하고, 이용약관 및 개인정보처리방침에 동의해야 가입이 완료됩니다.
- 최대 5개의 Mastodon 서버를 연동할 수 있습니다. 각 서버별로 별도의 Mastodon 앱을 생성하고 환경변수를 설정해야 합니다.
- Mastodon ID는 `{user_id}@{domain}` 형식으로 저장되어 서버 간 고유성이 보장됩니다.
- 모든 서버가 동일한 콜백 URL(`/mastodon/callback`)을 공유합니다. 서버 인덱스는 state 파라미터를 통해 전달됩니다.
- 커스텀 아이콘(`MASTODON_ICON_URL`)은 SVG, PNG 등 이미지 형식을 지원하며, 높이 18px에 너비 자동(비율 유지)으로 표시됩니다.
