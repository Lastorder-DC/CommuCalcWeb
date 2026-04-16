/**
 * 이메일 변경 완료 알림 (새 이메일로 발송).
 * @returns {{ subject: string, html: string }}
 */
module.exports = function emailChangeComplete() {
  return {
    subject: '[커뮤 전투 계산기] 이메일 인증이 완료되었습니다',
    html: `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">커뮤 전투 계산기 - 이메일 인증 완료</h2>
  <p>새 이메일 주소의 인증이 완료되었습니다.</p>
  <p>이제 이 이메일 주소로 로그인할 수 있습니다.</p>

  <p style="color: #999; font-size: 13px; margin-top: 30px;">
    본인이 변경한 것이 아니라면 즉시 계정 보안을 확인해주세요.
  </p>
</body>
</html>`.trim(),
  };
};
