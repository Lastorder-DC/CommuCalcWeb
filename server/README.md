# 커뮤 전투 계산기 API 서버

커뮤 전투 계산기 웹 앱의 백엔드 API 서버입니다.

## 기능

- 사용자 인증 (회원가입, 로그인, 로그아웃)
- 사용자 데이터 클라우드 저장/불러오기
- 이용약관 및 개인정보처리방침 제공
- 헬스 체크 엔드포인트

## 기술 스택

- **런타임:** Node.js
- **프레임워크:** Express
- **데이터베이스:** MySQL (mysql2)
- **인증:** JWT (jsonwebtoken) + bcrypt
- **보안:** Helmet, CORS, express-rate-limit

---

## 설치

### 1. 의존성 설치

```bash
cd server
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 값을 수정합니다.

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 데이터베이스 비밀번호와 JWT 비밀 키를 설정합니다.

```dotenv
# 서버 포트
PORT=3000

# MySQL 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=commucalc
DB_PASSWORD=your_secure_password
DB_NAME=commucalc

# JWT 비밀 키 (반드시 안전한 랜덤 문자열로 변경하세요)
JWT_SECRET=your-random-secret-key-here

# JWT 토큰 만료 시간
JWT_EXPIRES_IN=7d

# CORS 허용 오리진 (콤마로 구분)
CORS_ORIGIN=http://localhost:5173,https://calc.yumeka.xyz
```

> ⚠️ **주의:** `JWT_SECRET`은 반드시 안전한 랜덤 문자열로 변경하세요.

---

## MySQL 데이터베이스 설정

### 1. MySQL 설치

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install mysql-server

# MySQL 보안 설정
sudo mysql_secure_installation
```

### 2. DB 사용자 및 권한 생성

MySQL에 root로 접속하여 전용 사용자를 생성합니다.

```bash
sudo mysql -u root -p
```

```sql
-- 사용자 생성
CREATE USER 'commucalc'@'localhost' IDENTIFIED BY 'your_secure_password';

-- 데이터베이스 생성
CREATE DATABASE commucalc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 권한 부여
GRANT ALL PRIVILEGES ON commucalc.* TO 'commucalc'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

### 3. 테이블 초기화

`.env` 파일에 DB 접속 정보를 설정한 후 초기화 스크립트를 실행합니다.

```bash
npm run init-db
```

정상적으로 실행되면 아래와 같이 출력됩니다:

```
MySQL 서버에 연결되었습니다.
데이터베이스 'commucalc'가 준비되었습니다.
테이블 'users'가 준비되었습니다.
테이블 'user_data'가 준비되었습니다.

데이터베이스 초기화가 완료되었습니다.
```

---

## 서버 실행

### 개발 환경

```bash
npm start
```

### PM2를 활용한 프로덕션 배포

#### PM2 설치

```bash
sudo npm install -g pm2
```

#### 서버 시작

```bash
# 서버 시작
pm2 start src/index.js --name commu-calc-api

# 시스템 부팅 시 자동 시작 등록
pm2 startup
pm2 save
```

#### PM2 관리 명령어

```bash
# 상태 확인
pm2 status

# 로그 확인
pm2 logs commu-calc-api

# 실시간 로그
pm2 logs commu-calc-api --lines 100

# 서버 재시작
pm2 restart commu-calc-api

# 서버 중지
pm2 stop commu-calc-api

# 서버 삭제
pm2 delete commu-calc-api

# 모니터링 대시보드
pm2 monit
```

#### 무중단 재시작 (변경사항 적용)

```bash
pm2 reload commu-calc-api
```

---

## API 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/health` | ✗ | 서버 상태 확인 |
| POST | `/auth/register` | ✗ | 회원가입 |
| POST | `/auth/login` | ✗ | 로그인 |
| POST | `/auth/logout` | ✗ | 로그아웃 |
| GET | `/auth/me` | ✓ | 현재 사용자 정보 |
| GET | `/data` | ✓ | 사용자 데이터 불러오기 |
| PUT | `/data` | ✓ | 사용자 데이터 저장 |
| GET | `/legal/terms` | ✗ | 이용약관 |
| GET | `/legal/privacy` | ✗ | 개인정보처리방침 |
