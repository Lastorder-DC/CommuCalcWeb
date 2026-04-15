const request = require('supertest');
const { createApp } = require('../index');
const config = require('../config');

let app;

beforeAll(() => {
  app = createApp();
});

const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z0-9-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z0-9-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

describe('GET /health', () => {
  it('returns health status with version info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      serverVersion: config.serverVersion,
      minClientVersion: config.minClientVersion,
      xLoginEnabled: config.xLoginEnabled,
      mastodonLoginEnabled: config.mastodonLoginEnabled,
    });
  });

  it('has valid semver versions', () => {
    expect(config.serverVersion).toMatch(semverRegex);
    expect(config.minClientVersion).toMatch(semverRegex);
  });
});

describe('GET /legal/terms', () => {
  it('returns terms of service as valid text', async () => {
    const res = await request(app).get('/legal/terms');
    expect(res.status).toBe(200);
    
    expect(typeof res.text).toBe('string');
    expect(res.text.trim().length).toBeGreaterThan(0);
  });
});

describe('GET /legal/privacy', () => {
  it('returns privacy policy as valid text', async () => {
    const res = await request(app).get('/legal/privacy');
    expect(res.status).toBe(200);
    
    expect(typeof res.text).toBe('string');
    expect(res.text.trim().length).toBeGreaterThan(0);
  });
});

describe('404 handling', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: '요청한 리소스를 찾을 수 없습니다.' });
  });
});
