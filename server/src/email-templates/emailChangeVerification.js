/**
 * 이메일 변경 인증 템플릿 (새 이메일로 발송).
 * @param {{ code: string, verifyUrl: string }} params
 * @returns {{ subject: string, html: string }}
 */
module.exports = function emailChangeVerification({ code, verifyUrl }) {
  return {
    subject: '[커뮤 전투 계산기] 이메일 변경 인증',
    html: `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">커뮤 전투 계산기 - 이메일 변경 인증</h2>
  <p>이메일 주소를 변경하려면 아래 인증 코드를 입력하거나 인증 링크를 클릭해주세요.</p>

  <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
    <p style="margin: 0 0 8px 0; color: #666;">인증 코드</p>
    <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 0; color: #333;">${code}</p>
  </div>

  <p style="text-align: center;">
    <a href="${verifyUrl}" style="display: inline-block; background: #0d6efd; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">이메일 인증하기</a>
  </p>

  <p style="color: #999; font-size: 13px; margin-top: 30px;">
    본인이 이메일 변경을 요청하지 않았다면 이 이메일을 무시해주세요.
  </p>
</body>
</html>`.trim(),
  };
};
