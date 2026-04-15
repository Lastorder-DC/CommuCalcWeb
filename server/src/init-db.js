/**
 * 데이터베이스 테이블 초기화 스크립트.
 *
 * 사용법:
 *   node src/init-db.js
 *
 * .env 파일에 DB 접속 정보를 설정한 후 실행하세요.
 * 이미 존재하는 테이블은 건너뜁니다 (IF NOT EXISTS).
 */
require('dotenv').config();

const mysql = require('mysql2/promise');
const config = require('./config');

async function initDatabase() {
  let connection;

  try {
    // 데이터베이스 없이 먼저 연결하여 DB 생성
    connection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
    });

    console.log('MySQL 서버에 연결되었습니다.');

    // 데이터베이스 생성
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`데이터베이스 '${config.db.database}'가 준비되었습니다.`);

    // 데이터베이스 선택
    await connection.changeUser({ database: config.db.database });

    // users 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL DEFAULT '',
        username VARCHAR(100) NOT NULL,
        x_id VARCHAR(64) DEFAULT NULL,
        mastodon_id VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        UNIQUE INDEX idx_x_id (x_id),
        UNIQUE INDEX idx_mastodon_id (mastodon_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("테이블 'users'가 준비되었습니다.");

    // 기존 테이블에 x_id 컬럼이 없으면 추가
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'x_id'`,
      [config.db.database],
    );
    if (columns.length === 0) {
      await connection.execute('ALTER TABLE users ADD COLUMN x_id VARCHAR(64) DEFAULT NULL AFTER username');
      await connection.execute('ALTER TABLE users ADD UNIQUE INDEX idx_x_id (x_id)');
      console.log("'users' 테이블에 'x_id' 컬럼이 추가되었습니다.");
    }

    // 기존 테이블에 mastodon_id 컬럼이 없으면 추가
    const [mastodonColumns] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'mastodon_id'`,
      [config.db.database],
    );
    if (mastodonColumns.length === 0) {
      await connection.execute('ALTER TABLE users ADD COLUMN mastodon_id VARCHAR(255) DEFAULT NULL AFTER x_id');
      await connection.execute('ALTER TABLE users ADD UNIQUE INDEX idx_mastodon_id (mastodon_id)');
      console.log("'users' 테이블에 'mastodon_id' 컬럼이 추가되었습니다.");
    }

    // user_data 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_data (
        user_id BIGINT UNSIGNED PRIMARY KEY,
        data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_data_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("테이블 'user_data'가 준비되었습니다.");

    console.log('\n데이터베이스 초기화가 완료되었습니다.');
  } catch (err) {
    console.error('데이터베이스 초기화 오류:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
