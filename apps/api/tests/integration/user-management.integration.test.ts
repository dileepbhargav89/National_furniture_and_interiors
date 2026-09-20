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
    const roleName = (req.headers['x-test-role'] as string) || 'ADMIN';
    req.auth = {
      sub: (req.headers['x-test-sub'] as string) || 'admin_super_user',
      userType: 'ADMIN',
      roleId: 'role-admin',
      roleName,
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
      execute: vi.fn(async (id: string) => {
        if (id === 'usr_super_admin') {
          return {
            ...mockDossier,
            id: 'usr_super_admin',
            roleId: 'role_super_admin',
            userType: 'ADMIN',
          };
        }
        if (id === 'usr_admin_standard') {
          return {
            ...mockDossier,
            id: 'usr_admin_standard',
            roleId: 'role_admin',
            userType: 'ADMIN',
          };
        }
        if (id === 'usr_staff_designer') {
          return {
            ...mockDossier,
            id: 'usr_staff_designer',
            roleId: 'role_designer',
            userType: 'STAFF',
          };
        }
        if (id === 'usr_patron_100') {
          return mockDossier;
        }
        return null;
      }),
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
    resolveRoleNameById: vi.fn(async (id: string) => {
      if (id === 'role_super_admin') return 'SUPER_ADMIN';
      if (id === 'role_admin') return 'ADMIN';
      if (id === 'role_designer') return 'DESIGNER';
      return 'CUSTOMER';
    }),
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

    it('blocks non-super-admin from resetting a SUPER_ADMIN password with 403 Forbidden', async () => {
      const payload = {
        mustChangePassword: true,
        sendEmailLink: false,
      };

      const response = await fetch(`${baseUrl}/admin/users/usr_super_admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toContain(
        'Only a Super Administrator can reset passwords for Super Administrator accounts',
      );
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

    it('allows super-admin to deactivate a staff member with 200 OK', async () => {
      const payload = { status: 'SUSPENDED' };

      const response = await fetch(`${baseUrl}/admin/users/usr_staff_designer/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-test-role': 'SUPER_ADMIN',
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('SUSPENDED');
    });

    it('allows super-admin to re-activate a staff member with 200 OK', async () => {
      const payload = { status: 'ACTIVE' };

      const response = await fetch(`${baseUrl}/admin/users/usr_staff_designer/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-test-role': 'SUPER_ADMIN',
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('ACTIVE');
    });

    it('blocks non-super-admin from altering SUPER_ADMIN account status with 403 Forbidden', async () => {
      const payload = { status: 'SUSPENDED' };

      const response = await fetch(`${baseUrl}/admin/users/usr_super_admin/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toContain(
        'Super Administrator accounts cannot be modified or suspended by non-Super Administrators',
      );
    });

    it('blocks deactivating a SUPER_ADMIN account even by another Super Admin with 403 Forbidden', async () => {
      const payload = { status: 'SUSPENDED' };

      const response = await fetch(`${baseUrl}/admin/users/usr_super_admin/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-test-role': 'SUPER_ADMIN',
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toContain(
        'Super Administrator accounts are permanent and cannot be deactivated or suspended',
      );
    });

    it('blocks non-super-admin from altering ADMIN account status with 403 Forbidden', async () => {
      const payload = { status: 'SUSPENDED' };

      const response = await fetch(`${baseUrl}/admin/users/usr_admin_standard/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-test-role': 'ADMIN',
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toContain(
        'Only a Super Administrator can alter the status of an Administrator account',
      );
    });
  });

  describe('RBAC Privilege Escalation Prevention', () => {
    it('blocks non-super-admin from provisioning a SUPER_ADMIN account with 403 Forbidden', async () => {
      const payload = {
        fullName: 'Rogue Admin',
        email: 'rogue@nationalinteriors.com',
        password: 'Password123!',
        userType: 'ADMIN',
        roleName: 'SUPER_ADMIN',
      };

      const response = await fetch(`${baseUrl}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toContain(
        'Only a Super Administrator can provision Super Administrator accounts',
      );
    });

    it('blocks non-super-admin from re-issuing onboarding tokens for SUPER_ADMIN with 403 Forbidden', async () => {
      const response = await fetch(`${baseUrl}/admin/users/usr_super_admin/resend-onboarding`, {
        method: 'POST',
      });

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toContain(
        'Only a Super Administrator can resend onboarding for Super Administrator accounts',
      );
    });
  });
});
