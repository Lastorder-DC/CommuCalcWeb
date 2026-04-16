# 이메일 발송 설정 가이드 (SMTP)

커뮤 전투 계산기 서버는 이메일 인증, 비밀번호 찾기 등의 기능을 위해 SMTP 이메일 발송이 **필수**입니다.

> ⚠️ SMTP 설정이 없으면 서버가 구동되지 않습니다.

## 환경변수 설정

서버의 `.env` 파일에 다음 환경변수를 추가하세요:

```env
# SMTP 이메일 설정 (필수)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
SMTP_FROM="커뮤 전투 계산기 <noreply@example.com>"

# 프론트엔드 URL (이메일 내 링크 생성용)
FRONTEND_URL=https://calc.yumeka.xyz
```

### 환경변수 설명

| 변수 | 필수 | 설명 |
|------|------|------|
| `SMTP_HOST` | ✅ | SMTP 서버 주소 |
| `SMTP_PORT` | ✅ | SMTP 서버 포트 (일반적으로 587 또는 465) |
| `SMTP_SECURE` | ❌ | SSL/TLS 사용 여부 (`true` 또는 `false`, 기본값: `false`). 포트 465 사용 시 `true`로 설정 |
| `SMTP_USER` | ✅ | SMTP 인증 사용자명 (이메일 주소) |
| `SMTP_PASS` | ✅ | SMTP 인증 비밀번호 또는 앱 비밀번호 |
| `SMTP_FROM` | ✅ | 발신자 이메일 주소. `"이름 <email>"` 형식 권장 |
| `FRONTEND_URL` | ❌ | 이메일 내 링크에 사용할 프론트엔드 URL (기본값: `http://localhost:5173`) |

## 주요 이메일 서비스 설정 예시

### Gmail (Google)

1. Google 계정에서 [2단계 인증](https://myaccount.google.com/signinoptions/two-step-verification)을 활성화합니다.
2. [앱 비밀번호](https://myaccount.google.com/apppasswords)를 생성합니다.
3. 생성된 앱 비밀번호를 `SMTP_PASS`에 입력합니다.

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="커뮤 전투 계산기 <your-email@gmail.com>"
```

### Naver

1. 네이버 메일 설정 → POP3/SMTP 설정에서 SMTP 사용을 활성화합니다.

```env
SMTP_HOST=smtp.naver.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-id@naver.com
SMTP_PASS=your-password
SMTP_FROM="커뮤 전투 계산기 <your-id@naver.com>"
```

### Daum/Kakao

```env
SMTP_HOST=smtp.daum.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-id@daum.net
SMTP_PASS=your-password
SMTP_FROM="커뮤 전투 계산기 <your-id@daum.net>"
```

### AWS SES (Amazon Simple Email Service)

```env
SMTP_HOST=email-smtp.ap-northeast-2.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
SMTP_FROM="커뮤 전투 계산기 <noreply@your-verified-domain.com>"
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-smtp-password
SMTP_FROM="커뮤 전투 계산기 <noreply@your-domain.mailgun.org>"
```

## 이메일 발송 상황

다음 상황에서 이메일이 발송됩니다:

1. **회원가입** - 이메일 인증 코드/링크 발송 (24시간 유효)
2. **이메일 변경** - 새 이메일로 인증 코드/링크 발송, 완료 시 이전/새 이메일 모두에 알림
3. **비밀번호 변경** - 변경 완료 알림 발송
4. **비밀번호 찾기** - 임시 비밀번호 및 재설정 링크 발송

## 이메일 템플릿 수정

이메일 템플릿은 `server/src/email-templates/` 디렉토리에 있습니다:

| 파일 | 용도 |
|------|------|
| `verification.js` | 회원가입 이메일 인증 |
| `emailChangeVerification.js` | 이메일 변경 인증 |
| `emailChangeNotifyOld.js` | 이메일 변경 알림 (이전 메일) |
| `emailChangeComplete.js` | 이메일 변경 완료 알림 (새 메일) |
| `passwordChanged.js` | 비밀번호 변경 알림 |
| `passwordReset.js` | 비밀번호 찾기 (임시 비밀번호) |

각 템플릿은 `{ subject, html }` 객체를 반환하는 함수입니다. HTML 형식으로 작성되어 있으며, 자유롭게 수정할 수 있습니다.

## 문제 해결

### 서버가 시작되지 않음

```
[FATAL] 이메일 발송에 필요한 환경변수가 설정되지 않았습니다: SMTP_HOST, SMTP_PORT, ...
```

→ `.env` 파일에 모든 필수 SMTP 환경변수를 설정했는지 확인하세요.

### 이메일이 발송되지 않음

- SMTP 서버 주소와 포트가 올바른지 확인하세요.
- 인증 정보(사용자명/비밀번호)가 올바른지 확인하세요.
- Gmail의 경우 일반 비밀번호가 아닌 **앱 비밀번호**를 사용해야 합니다.
- 방화벽에서 SMTP 포트(587 또는 465)가 차단되어 있지 않은지 확인하세요.

### 이메일이 스팸함으로 이동

- `SMTP_FROM`에 실제 인증된 이메일 주소를 사용하세요.
- SPF, DKIM, DMARC 레코드를 올바르게 설정하세요.
- 전용 이메일 발송 서비스(AWS SES, Mailgun 등)를 사용하는 것을 권장합니다.
