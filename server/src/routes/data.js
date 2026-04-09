const { Router } = require('express');
const pool = require('../db');
const authMiddleware = require('../authMiddleware');

const router = Router();

/** GET /data – 사용자 데이터 불러오기 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT data FROM user_data WHERE user_id = ?',
      [req.user.id],
    );

    if (rows.length === 0) {
      return res.status(204).end();
    }

    const parsed = JSON.parse(rows[0].data);
    res.json(parsed);
  } catch (err) {
    console.error('데이터 불러오기 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/** PUT /data – 사용자 데이터 저장 */
router.put('/', authMiddleware, async (req, res) => {
  try {
    const data = JSON.stringify(req.body);

    await pool.execute(
      `INSERT INTO user_data (user_id, data) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE data = ?, updated_at = NOW()`,
      [req.user.id, data, data],
    );

    res.status(204).end();
  } catch (err) {
    console.error('데이터 저장 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
