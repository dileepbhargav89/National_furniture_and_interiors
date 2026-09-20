import type { Server } from 'node:http';
import express, { type RequestHandler } from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  createUsersRoutes,
  type UsersRoutesDeps,
} from '../../src/modules/users/presentation/users.routes';
import { errorHandlerMiddleware } from '../../src/core/exceptions';
import type { UserDetailDossier, UserProfile } from '../../src/modules/users/application/ports';

let server: Server;
let baseUrl: string;

const mockUser: UserProfile = {
  id: 'usr_patron_100',
  email: 'singhania@luxuryresidences.in',
  phone: '+919876543210',
  fullName: 'Vikramaditya Singhania',
  firstName: 'Vikramaditya',
  lastName: 'Singhania',
  userType: 'CUSTOMER',
  status: 'ACTIVE',
  companyName: 'Singhania Estates',
  gstin: '29AAAAA0000A1Z5',
  onboardingStatus: 'COMPLETED',
  addresses: [],
  joinedAt: new Date(),
  lastLoginAt: null,
};

const mockDossier: UserDetailDossier = {
  ...mockUser,
  ordersCount: 4,
  totalSpend: 28000000, // 2,80,000 INR
  lastOrderAt: new Date(),
  authProviders: ['LOCAL'],
};

beforeAll(async () => {
  const app = express();
  app.use(express.json());

  // Test auth middleware injecting admin credentials with users.read and users.write
  const testAuthMiddleware: RequestHandler = (req, _res, next) => {
    req.auth = {
      sub: 'admin_super_user',
      userType: 'ADMIN',
      roleId: 'role-admin',
      roleName: 'ADMIN',
      permissions: ['users.read', 'users.write', 'users.read_self', '*'],
    };
    next();
  };

  const mockDeps: UsersRoutesDeps = {
    getOwnProfile: {
      execute: vi.fn(async () => mockUser),
    } as unknown as UsersRoutesDeps['getOwnProfile'],
    updateOwnProfile: {
      execute: vi.fn(async () => mockUser),
    } as unknown as UsersRoutesDeps['updateOwnProfile'],
    adminListUsers: {
      execute: vi.fn(async () => [mockUser]),
    } as unknown as UsersRoutesDeps['adminListUsers'],
    adminListUsersWithFilters: {
      execute: vi.fn(async () => ({ items: [mockUser], total: 1 })),
    } as unknown as UsersRoutesDeps['adminListUsersWithFilters'],
    adminGetUserDetail: {
      execute: vi.fn(async (id: string) => (id === 'usr_patron_100' ? mockDossier : null)),
    } as unknown as UsersRoutesDeps['adminGetUserDetail'],
    adminCreateUser: {
      execute: vi.fn(async () => mockUser),
    } as unknown as UsersRoutesDeps['adminCreateUser'],
    adminOnboardUser: {
      execute: vi.fn(async () => mockUser),
    } as unknown as UsersRoutesDeps['adminOnboardUser'],
    adminResendOnboarding: {
      execute: vi.fn(async (_id: string) => ({
        success: true,
        message: `Onboarding invitation re-dispatched to ${mockUser.email}`,
      })),
    } as unknown as UsersRoutesDeps['adminResendOnboarding'],
    adminResetUserPassword: {
      execute: vi.fn(async (_id: string, newPassword?: string) => ({
        success: true,
        message: 'Password reset successfully for patron',
        temporaryPassword: newPassword || 'GeneratedTempPass99#',
      })),
    } as unknown as UsersRoutesDeps['adminResetUserPassword'],
    adminUpdateUserStatus: {
      execute: vi.fn(async (_id: string, status: string) => ({ ...mockUser, status })),
    } as unknown as UsersRoutesDeps['adminUpdateUserStatus'],
    hashPassword: vi.fn(async (pw: string) => `hashed_${pw}`),
    listLeads: {
      execute: vi.fn(async () => ({
        leads: [
          {
            id: 'lead-test-1',
            name: 'Ananya Deshmukh',
            email: 'ananya@atelierdesign.in',
            phone: '+919876543211',
            source: 'DESIGN_INQUIRY',
            interestType: 'PENTHOUSE_INTERIORS',
            score: 95,
            priority: 'HOT' as const,
            status: 'NEW',
            createdAt: new Date(),
          },
        ],
        total: 1,
      })),
    },
    resolveRoleIdByName: vi.fn(async () => '6aa05745ad65cf3101da30f0'),
    recordAudit: vi.fn(async () => {}),
  };

  const router = createUsersRoutes(mockDeps, testAuthMiddleware);
  app.use('/api/v1', router);
  app.use(errorHandlerMiddleware);

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Expected server to bind to a TCP port');
  }
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('User Management End-to-End API Integration Suite', () => {
  describe('GET /api/v1/admin/users/non-registered', () => {
    it('returns non-registered trade leads with 200 OK', async () => {
      const response = await fetch(`${baseUrl}/admin/users/non-registered`);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.items).toHaveLength(1);
      expect(json.data.items[0].name).toBe('Ananya Deshmukh');
      expect(json.data.items[0].priority).toBe('HOT');
    });
  });

  describe('GET /api/v1/admin/users', () => {
    it('returns registered patron roster with filters and pagination metadata', async () => {
      const response = await fetch(
        `${baseUrl}/admin/users?search=Singhania&userType=CUSTOMER&page=1&limit=15`,
      );
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.items).toHaveLength(1);
      expect(json.data.items[0].fullName).toBe('Vikramaditya Singhania');
      expect(json.data.total).toBe(1);
    });
  });

  describe('GET /api/v1/admin/users/:id', () => {
    it('returns comprehensive patron dossier including commercial LTV and auth metadata', async () => {
      const response = await fetch(`${baseUrl}/admin/users/usr_patron_100`);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('usr_patron_100');
      expect(json.data.ordersCount).toBe(4);
      expect(json.data.totalSpend).toBe(28000000);
      expect(json.data.authProviders).toContain('LOCAL');
    });
  });

  describe('POST /api/v1/admin/users/onboard', () => {
    it('successfully provisions a new patron account with 201 Created', async () => {
      const payload = {
        fullName: 'Vikramaditya Singhania',
        email: 'singhania@luxuryresidences.in',
        phone: '+919876543210',
        userType: 'CUSTOMER',
        companyName: 'Singhania Estates',
        gstin: '29AAAAA0000A1Z5',
        sendInvite: true,
      };

      const response = await fetch(`${baseUrl}/admin/users/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.email).toBe('singhania@luxuryresidences.in');
    });
  });

  describe('POST /api/v1/admin/users/bulk-onboard', () => {
    it('processes bulk CSV roster and returns summary counts', async () => {
      const payload = {
        users: [
          {
            fullName: 'Vikramaditya Singhania',
            email: 'singhania@luxuryresidences.in',
            phone: '+919876543210',
            userType: 'CUSTOMER',
            companyName: 'Singhania Estates',
          },
          {
            fullName: 'Ananya Deshmukh',
            email: 'ananya@atelierdesign.in',
            userType: 'STAFF',
          },
        ],
      };

      const response = await fetch(`${baseUrl}/admin/users/bulk-onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.totalRequested).toBe(2);
      expect(json.data.successCount).toBe(2);
      expect(json.data.errorCount).toBe(0);
    });
  });

  describe('POST /api/v1/admin/users/:id/resend-onboarding', () => {
    it('dispatches onboarding invitation link to user', async () => {
      const response = await fetch(`${baseUrl}/admin/users/usr_patron_100/resend-onboarding`, {
        method: 'POST',
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.message).toContain('singhania@luxuryresidences.in');
    });
  });

  describe('POST /api/v1/admin/users/:id/reset-password', () => {
    it('resets password and returns generated temporary password', async () => {
      const payload = {
        mustChangePassword: true,
        sendEmailLink: false,
      };

      const response = await fetch(`${baseUrl}/admin/users/usr_patron_100/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.temporaryPassword).toBeDefined();
    });
  });

  describe('PATCH /api/v1/admin/users/:id/status', () => {
    it('updates patron status to SUSPENDED with 200 OK', async () => {
      const payload = { status: 'SUSPENDED' };

      const response = await fetch(`${baseUrl}/admin/users/usr_patron_100/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('SUSPENDED');
    });
  });
});
