/**
 * 비밀번호 변경 알림 템플릿.
 * @returns {{ subject: string, html: string }}
 */
module.exports = function passwordChanged() {
  return {
    subject: '[커뮤 전투 계산기] 비밀번호가 변경되었습니다',
    html: `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">커뮤 전투 계산기 - 비밀번호 변경 알림</h2>
  <p>회원님의 비밀번호가 변경되었습니다.</p>

  <p style="color: #999; font-size: 13px; margin-top: 30px;">
    본인이 변경한 것이 아니라면 즉시 비밀번호를 재설정하고 계정 보안을 확인해주세요.
  </p>
</body>
</html>`.trim(),
  };
};
