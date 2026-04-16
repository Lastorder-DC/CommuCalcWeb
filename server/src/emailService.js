/**
 * SMTP 기반 이메일 발송 서비스.
 * nodemailer를 사용하며, 템플릿은 email-templates 디렉토리에서 로드합니다.
 */
const nodemailer = require('nodemailer');
const config = require('./config');
const templates = require('./email-templates');

let transporter = null;

/** SMTP 트랜스포터를 초기화합니다. */
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
}

/**
 * 이메일 발송 공통 함수.
 * @param {string} to - 수신자 이메일
 * @param {string} subject - 제목
 * @param {string} html - HTML 본문
 */
async function sendMail(to, subject, html) {
  const transport = getTransporter();
  await transport.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
  });
}

/**
 * 회원가입 인증 메일 발송.
 * @param {string} to - 수신자 이메일
 * @param {string} code - 인증 코드
 * @param {string} verifyUrl - 인증 링크 URL
 */
async function sendVerificationEmail(to, code, verifyUrl) {
  const { subject, html } = templates.verification({ code, verifyUrl });
  await sendMail(to, subject, html);
}

/**
 * 이메일 변경 인증 메일 발송 (새 이메일로).
 * @param {string} to - 새 이메일 주소
 * @param {string} code - 인증 코드
 * @param {string} verifyUrl - 인증 링크 URL
 */
async function sendEmailChangeVerification(to, code, verifyUrl) {
  const { subject, html } = templates.emailChangeVerification({ code, verifyUrl });
  await sendMail(to, subject, html);
}

/**
 * 이메일 변경 완료 알림 (이전 이메일로).
 * @param {string} to - 이전 이메일 주소
 * @param {string} newEmail - 새 이메일 주소
 */
async function sendEmailChangeNotifyOld(to, newEmail) {
  const { subject, html } = templates.emailChangeNotifyOld({ newEmail });
  await sendMail(to, subject, html);
}

/**
 * 이메일 변경 완료 알림 (새 이메일로).
 * @param {string} to - 새 이메일 주소
 */
async function sendEmailChangeComplete(to) {
  const { subject, html } = templates.emailChangeComplete();
  await sendMail(to, subject, html);
}

/**
 * 비밀번호 변경 알림 메일 발송.
 * @param {string} to - 수신자 이메일
 */
async function sendPasswordChangeNotification(to) {
  const { subject, html } = templates.passwordChanged();
  await sendMail(to, subject, html);
}

/**
 * 비밀번호 찾기 (임시 비밀번호) 메일 발송.
 * @param {string} to - 수신자 이메일
 * @param {string} tempPassword - 임시 비밀번호
 * @param {string} resetUrl - 임시 비밀번호로 변경하는 링크
 */
async function sendPasswordResetEmail(to, tempPassword, resetUrl) {
  const { subject, html } = templates.passwordReset({ tempPassword, resetUrl });
  await sendMail(to, subject, html);
}

module.exports = {
  sendVerificationEmail,
  sendEmailChangeVerification,
  sendEmailChangeNotifyOld,
  sendEmailChangeComplete,
  sendPasswordChangeNotification,
  sendPasswordResetEmail,
};
