import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GET } from '@/app/api/sync/pull-smtp/route';

// Mocks
jest.mock('@/lib/prisma', () => ({
  user: { findUnique: jest.fn() },
  sMTPSettings: { findFirst: jest.fn() },
}));

jest.mock('@/lib/jwt', () => ({
  verifyToken: jest.fn().mockReturnValue({ userId: 1, email: 'admin@sems.local', roleId: 1 }),
}));

// Utility to build a minimal AuthenticatedRequest-like object
const buildRequest = (overrides: Partial<Request & { user?: any }> = {}) => {
  const headers = new Headers({
    authorization: 'Bearer token',
    origin: 'http://localhost:3000',
    ...(overrides.headers instanceof Headers ? Object.fromEntries(overrides.headers.entries()) : (overrides.headers as any) || {}),
  });
  return {
    method: 'GET',
    headers,
    user: { userId: 1, email: 'admin@sems.local', roleId: 1 },
    ...overrides,
  } as any;
};

// Helpers to extract JSON from NextResponse
const parseJson = async (res: any) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

describe('GET /api/sync/pull-smtp', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('should return 401 if user not set by auth', async () => {
    // Simulate withAuth failing to attach user by bypassing auth header
    const req = buildRequest({ headers: new Headers({ origin: 'http://localhost:3000' }), user: undefined });
    // Directly invoke exported GET which includes withAuth wrapper
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await parseJson(res);
    expect(body).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });

  test('should forbid non-admin users (403)', async () => {
    // Mock prisma user lookup to return non-admin role
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, role: { name: 'user' } });
    const req = buildRequest();
    const res = await GET(req);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 }, include: { role: true } });
    expect(res.status).toBe(403);
    const body = await parseJson(res);
    expect(body).toEqual(expect.objectContaining({ error: 'Forbidden - Admin only' }));
  });

  test('should return success with null data when no SMTP settings exist', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, role: { name: 'admin' } });
    (prisma.sMTPSettings.findFirst as jest.Mock).mockResolvedValue(null);

    const req = buildRequest();
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res);
    expect(body).toEqual(expect.objectContaining({ success: true, data: null }));
  });

  test('should hide password and include timestamps when settings exist', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, role: { name: 'admin' } });
    const now = new Date();
    const settings = {
      id: 10,
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      username: 'smtp-user',
      password: 'encrypted-secret',
      fromEmail: 'noreply@example.com',
      fromName: 'SEMS',
      adminEmail: 'admin@example.com',
      replyToEmail: 'reply@example.com',
      enabled: true,
      testStatus: 'success',
      lastTestedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    (prisma.sMTPSettings.findFirst as jest.Mock).mockResolvedValue(settings);

    const req = buildRequest();
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res);

    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.password).toBe('***HIDDEN***');
    expect(body.data.createdAt).toBe(now.getTime());
    expect(body.data.updatedAt).toBe(now.getTime());
    expect(body.data.lastTestedAt).toBe(now.getTime());
  });

  test('should handle internal errors and respond 500', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, role: { name: 'admin' } });
    (prisma.sMTPSettings.findFirst as jest.Mock).mockRejectedValue(new Error('DB down'));

    const req = buildRequest();
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await parseJson(res);
    expect(body).toEqual(expect.objectContaining({ error: 'Failed to fetch SMTP settings' }));
  });
});
