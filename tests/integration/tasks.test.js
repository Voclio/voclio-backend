import request from 'supertest';
import app from '../../src/app.js';
import { syncDatabase } from '../../src/models/orm/index.js';
import { User, Session, UserSettings } from '../../src/models/orm/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Tasks API Integration Tests', () => {
  let authToken;
  let testUserId;
  let createdTaskId;

  beforeAll(async () => {
    await syncDatabase(true);

    // Create test user
    const hashedPassword = await bcrypt.hash('Test123!@#', 10);
    const user = await User.create({
      email: `tasks-test-${Date.now()}@example.com`,
      password: hashedPassword,
      name: 'Task Test User',
      email_verified: true
    });
    testUserId = user.user_id;
    await UserSettings.create({ user_id: testUserId });

    // Generate token directly
    authToken = jwt.sign(
      { userId: testUserId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await Session.create({
      user_id: testUserId,
      refresh_token: 'test-refresh-token',
      expires_at: new Date(Date.now() + 86400000)
    });
  });

  afterAll(async () => {
    await User.destroy({ where: { user_id: testUserId } });
  });

  describe('POST /api/tasks', () => {
    it('should create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test description',
          priority: 'high',
          status: 'todo'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('Test Task');
      expect(res.body.data.task.priority).toBe('high');

      createdTaskId = res.body.data.task.task_id;
    });

    it('should reject task without title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'No title' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid priority', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Task', priority: 'ultra' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tasks', () => {
    it('should return task list', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/tasks?status=todo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.data.tasks.forEach(t => expect(t.status).toBe('todo'));
    });

    it('should filter by priority', async () => {
      const res = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.data.tasks.forEach(t => expect(t.priority).toBe('high'));
    });

    it('should enforce max limit of 100', async () => {
      const res = await request(app)
        .get('/api/tasks?limit=999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBeLessThanOrEqual(100);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return a specific task', async () => {
      const res = await request(app)
        .get(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.task.task_id).toBe(createdTaskId);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .get('/api/tasks/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Task', status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.title).toBe('Updated Task');
      expect(res.body.data.task.status).toBe('in_progress');
    });
  });

  describe('POST /api/tasks/:id/complete', () => {
    it('should mark task as complete', async () => {
      const res = await request(app)
        .post(`/api/tasks/${createdTaskId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('completed');
    });
  });

  describe('POST /api/tasks/:id/subtasks', () => {
    it('should create a subtask', async () => {
      const res = await request(app)
        .post(`/api/tasks/${createdTaskId}/subtasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Subtask 1' });

      expect(res.status).toBe(201);
      expect(res.body.data.subtask.title).toBe('Subtask 1');
    });
  });

  describe('GET /api/tasks/stats', () => {
    it('should return task statistics', async () => {
      const res = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats).toHaveProperty('total');
      expect(res.body.data.stats).toHaveProperty('completed');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 after deletion', async () => {
      const res = await request(app)
        .get(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
