import request from 'supertest';
import app from '../../src/app.js';

describe('Admin dashboard endpoints', () => {
  test('GET /api/admin/dashboard/stats requires admin auth', async () => {
    const response = await request(app).get('/api/admin/dashboard/stats');
    expect(response.status).toBe(401);
  });

  test('GET /api/admin/me requires admin auth', async () => {
    const response = await request(app).get('/api/admin/me');
    expect(response.status).toBe(401);
  });

  test('GET /api/admin/config requires admin auth', async () => {
    const response = await request(app).get('/api/admin/config');
    expect(response.status).toBe(401);
  });

  test('GET /api/admin/api-keys requires admin auth', async () => {
    const response = await request(app).get('/api/admin/api-keys');
    expect(response.status).toBe(401);
  });

  test('GET /api/admin/ui-strings requires admin auth', async () => {
    const response = await request(app).get('/api/admin/ui-strings');
    expect(response.status).toBe(401);
  });
});
