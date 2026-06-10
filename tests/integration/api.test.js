import request from 'supertest';
import app from '../../src/app.js';

describe('Health endpoint', () => {
  test('GET /api/health returns health status with dependency checks', async () => {
    const response = await request(app).get('/api/health');

    expect([200, 503]).toContain(response.status);
    expect(['OK', 'DEGRADED']).toContain(response.body.status);
    expect(response.body.timestamp).toEqual(expect.any(String));
    expect(response.body.uptime).toEqual(expect.any(Number));
    expect(response.body.checks).toEqual(
      expect.objectContaining({
        database: expect.any(Boolean),
        redis: expect.any(Boolean),
        queue: expect.any(Boolean)
      })
    );
  });
});

describe('Auth validation', () => {
  test('POST /api/auth/login rejects empty body', async () => {
    const response = await request(app).post('/api/auth/login').send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Protected routes', () => {
  test('GET /api/tasks requires authentication', async () => {
    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
