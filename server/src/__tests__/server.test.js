const request = require('supertest');
const { createApp } = require('../index');
const config = require('../config');

let app;

beforeAll(() => {
  app = createApp();
});

describe('GET /health', () => {
  it('returns health status with version info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      serverVersion: config.serverVersion,
      minClientVersion: config.minClientVersion,
    });
  });

  it('has correct version 0.5.0', () => {
    expect(config.serverVersion).toBe('0.5.0');
    expect(config.minClientVersion).toBe('0.5.0');
  });
});

describe('GET /legal/terms', () => {
  it('returns terms of service as text', async () => {
    const res = await request(app).get('/legal/terms');
    expect(res.status).toBe(200);
    expect(res.text).toContain('이용약관');
    expect(res.text).toContain('제1조');
  });
});

describe('GET /legal/privacy', () => {
  it('returns privacy policy as text', async () => {
    const res = await request(app).get('/legal/privacy');
    expect(res.status).toBe(200);
    expect(res.text).toContain('개인정보 처리방침');
    expect(res.text).toContain('수집하는 개인정보');
  });
});

describe('404 handling', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: '요청한 리소스를 찾을 수 없습니다.' });
  });
});
