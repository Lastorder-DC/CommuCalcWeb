/**
 * 비밀번호 찾기 (임시 비밀번호) 템플릿.
 * @param {{ tempPassword: string, resetUrl: string }} params
 * @returns {{ subject: string, html: string }}
 */
module.exports = function passwordReset({ tempPassword, resetUrl }) {
  return {
    subject: '[커뮤 전투 계산기] 임시 비밀번호 안내',
    html: `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">커뮤 전투 계산기 - 임시 비밀번호</h2>
  <p>비밀번호 찾기를 요청하셨습니다. 아래 임시 비밀번호로 로그인한 후 비밀번호를 변경해주세요.</p>

  <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
    <p style="margin: 0 0 8px 0; color: #666;">임시 비밀번호</p>
    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 0; color: #333; font-family: monospace;">${tempPassword}</p>
  </div>

  <p style="text-align: center;">
    <a href="${resetUrl}" style="display: inline-block; background: #0d6efd; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">임시 비밀번호로 로그인</a>
  </p>

  <p style="color: #999; font-size: 13px; margin-top: 30px;">
    로그인 후 반드시 비밀번호를 변경해주세요.<br>
    본인이 요청하지 않았다면 이 이메일을 무시해주세요.
  </p>
</body>
</html>`.trim(),
  };
};
