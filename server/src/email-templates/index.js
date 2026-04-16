/**
 * 이메일 템플릿 모듈.
 * 각 템플릿 함수는 { subject, html } 객체를 반환합니다.
 * 수정 시 이 디렉토리의 파일만 변경하면 됩니다.
 */
const verification = require('./verification');
const emailChangeVerification = require('./emailChangeVerification');
const emailChangeNotifyOld = require('./emailChangeNotifyOld');
const emailChangeComplete = require('./emailChangeComplete');
const passwordChanged = require('./passwordChanged');
const passwordReset = require('./passwordReset');

module.exports = {
  verification,
  emailChangeVerification,
  emailChangeNotifyOld,
  emailChangeComplete,
  passwordChanged,
  passwordReset,
};
