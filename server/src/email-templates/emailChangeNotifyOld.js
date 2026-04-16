/**
 * 이메일 변경 완료 알림 (이전 이메일로 발송).
 * @param {{ newEmail: string }} params
 * @returns {{ subject: string, html: string }}
 */
module.exports = function emailChangeNotifyOld({ newEmail }) {
  return {
    subject: '[커뮤 전투 계산기] 이메일 주소가 변경되었습니다',
    html: `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">커뮤 전투 계산기 - 이메일 변경 알림</h2>
  <p>회원님의 이메일 주소가 다음으로 변경되었습니다:</p>

  <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold;">${newEmail}</p>
  </div>

  <p style="color: #999; font-size: 13px; margin-top: 30px;">
    본인이 변경한 것이 아니라면 즉시 계정 보안을 확인해주세요.
  </p>
</body>
</html>`.trim(),
  };
};
