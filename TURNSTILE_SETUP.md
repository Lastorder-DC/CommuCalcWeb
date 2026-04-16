# Cloudflare Turnstile 설정 가이드

[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)은 사용자 경험을 해치지 않는 CAPTCHA 대안입니다.

커뮤 전투 계산기에서는 **로그인**과 **비밀번호 찾기** 페이지에 Turnstile을 적용하여 봇의 무차별 대입 공격을 방지합니다.

> ℹ️ Turnstile 설정은 **선택사항**입니다. 설정하지 않으면 Turnstile 검증 없이 동작합니다.

## 1. Cloudflare Turnstile 위젯 생성

1. [Cloudflare 대시보드](https://dash.cloudflare.com/)에 로그인합니다.
2. 좌측 메뉴에서 **Turnstile**을 클릭합니다.
3. **위젯 추가**를 클릭합니다.
4. 다음 정보를 입력합니다:
   - **위젯 이름**: 커뮤 전투 계산기 (원하는 이름)
   - **도메인**: 서비스의 프론트엔드 도메인 (예: `calc.yumeka.xyz`)
   - **위젯 모드**: 
     - `Managed` (권장) - Cloudflare가 자동으로 챌린지 방식을 결정
     - `Non-interactive` - 사용자 상호작용 없이 백그라운드에서 검증
     - `Invisible` - 완전히 보이지 않는 방식으로 검증
5. **만들기**를 클릭합니다.

## 2. 키 확인

위젯을 생성하면 다음 두 개의 키가 발급됩니다:

- **사이트 키 (Site Key)**: 클라이언트(브라우저)에서 사용
- **비밀 키 (Secret Key)**: 서버에서 검증에 사용

## 3. 환경변수 설정

서버의 `.env` 파일에 다음 환경변수를 추가하세요:

```env
# Cloudflare Turnstile 설정 (선택)
TURNSTILE_SITE_KEY=0x4AAAAAAXXXXXXXXXXXXXX
TURNSTILE_SECRET_KEY=0x4AAAAAAXXXXXXXXXXXXXX
```

### 환경변수 설명

| 변수 | 필수 | 설명 |
|------|------|------|
| `TURNSTILE_SITE_KEY` | ❌ | Turnstile 사이트 키 (클라이언트용) |
| `TURNSTILE_SECRET_KEY` | ❌ | Turnstile 비밀 키 (서버 검증용) |

> 두 키가 모두 설정되어야 Turnstile이 활성화됩니다. 하나만 설정하면 비활성화 상태로 동작합니다.

## 4. 적용 범위

Turnstile이 활성화되면 다음 페이지에서 검증이 수행됩니다:

| 페이지 | API 엔드포인트 | 설명 |
|--------|---------------|------|
| 로그인 | `POST /auth/login` | 로그인 시 Turnstile 토큰 검증 |
| 비밀번호 찾기 | `POST /auth/forgot-password` | 비밀번호 찾기 요청 시 검증 |

## 5. 개발 환경에서 테스트

Cloudflare에서 제공하는 테스트 키를 사용할 수 있습니다:

### 항상 성공하는 키

```env
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

### 항상 실패하는 키

```env
TURNSTILE_SITE_KEY=2x00000000000000000000AB
TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AB
```

### 강제 인터랙티브 챌린지

```env
TURNSTILE_SITE_KEY=3x00000000000000000000FF
TURNSTILE_SECRET_KEY=0x4AAAAAAASh5sODaHdMnav1
```

자세한 테스트 키 목록은 [Cloudflare 문서](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)를 참고하세요.

## 6. 동작 방식

1. 클라이언트가 `/health` 엔드포인트에서 `turnstileEnabled`와 `turnstileSiteKey`를 받습니다.
2. Turnstile이 활성화되어 있으면 로그인/비밀번호 찾기 폼에 Turnstile 위젯이 표시됩니다.
3. 사용자가 Turnstile 검증을 통과하면 토큰이 생성됩니다.
4. 클라이언트가 API 요청 시 `turnstileToken`을 함께 전송합니다.
5. 서버에서 Cloudflare API(`https://challenges.cloudflare.com/turnstile/v0/siteverify`)를 통해 토큰을 검증합니다.

## 문제 해결

### Turnstile 위젯이 표시되지 않음

- `TURNSTILE_SITE_KEY`와 `TURNSTILE_SECRET_KEY`가 모두 `.env`에 설정되어 있는지 확인하세요.
- 서버를 재시작한 후 클라이언트를 새로고침하세요.
- 브라우저의 개발자 도구에서 `challenges.cloudflare.com` 스크립트 로딩을 확인하세요.

### 보안 인증 실패 오류

- Turnstile 키가 올바른지 확인하세요 (사이트 키와 비밀 키가 바뀌지 않았는지).
- 위젯에 설정된 도메인과 실제 서비스 도메인이 일치하는지 확인하세요.
- Turnstile 위젯이 만료되었을 수 있습니다 - 페이지를 새로고침하세요.
