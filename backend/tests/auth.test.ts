import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { User } from '../src/models/User.js';

describe('Authentication & Authorization Endpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const testUser = {
    name: 'Alice Security',
    email: 'alice@recon.test',
    password: 'SuperSecurePassword123!',
  };

  it('POST /api/auth/register - should register a new analyst', async () => {
    vi.spyOn(User, 'findOne').mockResolvedValue(null as any);
    vi.spyOn(User, 'create').mockResolvedValue({
      _id: '64a1b2c3d4e5f6a7b8c9d0e1',
      name: testUser.name,
      email: testUser.email,
      createdAt: new Date(),
    } as any);

    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/auth/register - should reject duplicate email', async () => {
    vi.spyOn(User, 'findOne').mockResolvedValue({
      _id: '64a1b2c3d4e5f6a7b8c9d0e1',
      email: testUser.email,
    } as any);

    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('POST /api/auth/register - should reject password shorter than 8 chars', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob',
        email: 'bob@recon.test',
        password: 'short',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login - should authenticate existing user with valid password', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(testUser.password, salt);

    vi.spyOn(User, 'findOne').mockResolvedValue({
      _id: '64a1b2c3d4e5f6a7b8c9d0e1',
      name: testUser.name,
      email: testUser.email,
      passwordHash,
      createdAt: new Date(),
    } as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/auth/login - should reject invalid password', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(testUser.password, salt);

    vi.spyOn(User, 'findOne').mockResolvedValue({
      _id: '64a1b2c3d4e5f6a7b8c9d0e1',
      name: testUser.name,
      email: testUser.email,
      passwordHash,
    } as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me - should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/logout - should clear session cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
