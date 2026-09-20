import { describe, it, expect } from 'vitest';
import {
  isSuperAdmin,
  isTargetSuperAdmin,
  canManageUserCredentials,
  canChangeUserStatus,
  canProvisionRole,
} from '../../lib/rbac-hierarchy';

describe('RBAC Command Centre Logic Suite', () => {
  const ROLE_ORDER = [
    'SUPER_ADMIN',
    'ADMIN',
    'SALES_MANAGER',
    'DESIGN_MANAGER',
    'DESIGNER',
    'CATALOG_MANAGER',
    'SUPPORT_AGENT',
    'CUSTOMER',
  ];

  const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];
  const STAFF_ROLES = [
    'SALES_MANAGER',
    'DESIGN_MANAGER',
    'DESIGNER',
    'CATALOG_MANAGER',
    'SUPPORT_AGENT',
  ];

  function roleToUserType(roleName: string): 'ADMIN' | 'STAFF' | null {
    if (['SUPER_ADMIN', 'ADMIN'].includes(roleName)) return 'ADMIN';
    if (
      ['SALES_MANAGER', 'DESIGN_MANAGER', 'DESIGNER', 'CATALOG_MANAGER', 'SUPPORT_AGENT'].includes(
        roleName,
      )
    )
      return 'STAFF';
    return null;
  }

  function getInitials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase();
  }

  function generateSecurePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
  }

  describe('Role Hierarchy & Sorting', () => {
    it('sorts roles correctly according to executive hierarchy', () => {
      const unsorted = [
        { name: 'CUSTOMER' },
        { name: 'DESIGNER' },
        { name: 'SUPER_ADMIN' },
        { name: 'ADMIN' },
        { name: 'SALES_MANAGER' },
      ];

      const sorted = [...unsorted].sort((a, b) => {
        const ai = ROLE_ORDER.indexOf(a.name);
        const bi = ROLE_ORDER.indexOf(b.name);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });

      expect(sorted.map((r) => r.name)).toEqual([
        'SUPER_ADMIN',
        'ADMIN',
        'SALES_MANAGER',
        'DESIGNER',
        'CUSTOMER',
      ]);
    });
  });

  describe('Role to userType Mapping', () => {
    it('maps executive and admin roles to ADMIN', () => {
      expect(roleToUserType('SUPER_ADMIN')).toBe('ADMIN');
      expect(roleToUserType('ADMIN')).toBe('ADMIN');
    });

    it('maps operational roles to STAFF', () => {
      expect(roleToUserType('SALES_MANAGER')).toBe('STAFF');
      expect(roleToUserType('DESIGN_MANAGER')).toBe('STAFF');
      expect(roleToUserType('DESIGNER')).toBe('STAFF');
      expect(roleToUserType('CATALOG_MANAGER')).toBe('STAFF');
      expect(roleToUserType('SUPPORT_AGENT')).toBe('STAFF');
    });

    it('returns null for customer-facing or unknown roles', () => {
      expect(roleToUserType('CUSTOMER')).toBeNull();
      expect(roleToUserType('GUEST')).toBeNull();
    });
  });

  describe('Scope Filtering for Staff Provisioning', () => {
    const allMockRoles = [
      { name: 'SUPER_ADMIN' },
      { name: 'ADMIN' },
      { name: 'SALES_MANAGER' },
      { name: 'DESIGNER' },
      { name: 'CUSTOMER' },
    ];

    it('filters admin roles when scope is ADMIN', () => {
      const filtered = allMockRoles.filter((r) => ADMIN_ROLES.includes(r.name));
      expect(filtered.map((r) => r.name)).toEqual(['SUPER_ADMIN', 'ADMIN']);
    });

    it('filters operator roles when scope is STAFF', () => {
      const filtered = allMockRoles.filter((r) => STAFF_ROLES.includes(r.name));
      expect(filtered.map((r) => r.name)).toEqual(['SALES_MANAGER', 'DESIGNER']);
    });
  });

  describe('Initials Generation', () => {
    it('generates two-letter uppercase initials for full names', () => {
      expect(getInitials('Aarav Deshmukh')).toBe('AD');
      expect(getInitials('Priya Sharma')).toBe('PS');
    });

    it('handles single names and extra whitespace gracefully', () => {
      expect(getInitials('Rajesh')).toBe('R');
      expect(getInitials('  Vikram   Aditya  ')).toBe('VA');
      expect(getInitials('')).toBe('?');
      expect(getInitials(undefined)).toBe('?');
    });
  });

  describe('Password Handling & Generator', () => {
    it('generates a 12-character high-entropy password', () => {
      const pwd = generateSecurePassword();
      expect(pwd.length).toBe(12);
      expect(typeof pwd).toBe('string');
      // Verify randomness: 5 generated passwords must all be distinct
      const set = new Set(Array.from({ length: 5 }, () => generateSecurePassword()));
      expect(set.size).toBe(5);
    });

    it('validates custom password minimum length policy (8 chars)', () => {
      const isValidPassword = (p: string) => Boolean(p && p.length >= 8);
      expect(isValidPassword('Secret12!')).toBe(true);
      expect(isValidPassword('Short1!')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('Custom Staff Provisioning Modes', () => {
    it('builds direct active provisioning payload with custom password', () => {
      const input = {
        fullName: 'Custom Admin',
        email: 'custom.admin@nationalinteriors.com',
        password: 'CustomSecretPassword123!',
        phone: '+91 9988776655',
        scope: 'ADMIN' as const,
        roleName: 'ADMIN',
      };

      const payload = {
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        userType: input.scope,
        roleName: input.roleName,
        phone: input.phone.trim() || null,
      };

      expect(payload).toEqual({
        fullName: 'Custom Admin',
        email: 'custom.admin@nationalinteriors.com',
        password: 'CustomSecretPassword123!',
        userType: 'ADMIN',
        roleName: 'ADMIN',
        phone: '+91 9988776655',
      });
    });

    it('builds invitation onboarding payload with sendInvite flag', () => {
      const input = {
        fullName: 'Priya Verma',
        email: 'priya.verma@nationalinteriors.com',
        password: 'TemporaryPass456!',
        phone: '',
        scope: 'STAFF' as const,
        roleName: 'SALES_MANAGER',
      };

      const payload = {
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        temporaryPassword: input.password,
        userType: input.scope,
        roleName: input.roleName,
        phone: input.phone.trim() || null,
        sendInvite: true,
      };

      expect(payload).toEqual({
        fullName: 'Priya Verma',
        email: 'priya.verma@nationalinteriors.com',
        temporaryPassword: 'TemporaryPass456!',
        userType: 'STAFF',
        roleName: 'SALES_MANAGER',
        phone: null,
        sendInvite: true,
      });
    });
  });

  describe('Permission Grouping Fallback', () => {
    it('groups by group or falls back to module or UNDEFINED', () => {
      const perms = [
        { id: '1', key: 'users.read', group: 'users', module: 'users' },
        { id: '2', key: 'orders.read', module: 'orders' }, // no group
        { id: '3', key: 'custom.action' }, // neither
      ];

      const grouped = perms.reduce(
        (acc, p) => {
          const g = p.group || p.module || 'UNDEFINED';
          if (!acc[g]) acc[g] = [];
          acc[g].push(p.key);
          return acc;
        },
        {} as Record<string, string[]>,
      );

      expect(grouped['users']).toEqual(['users.read']);
      expect(grouped['orders']).toEqual(['orders.read']);
      expect(grouped['UNDEFINED']).toEqual(['custom.action']);
    });
  });

  describe('RBAC Hierarchy Protection & Credential Immutability', () => {
    const superAdminActor = { roleName: 'SUPER_ADMIN', userType: 'ADMIN' as const };
    const adminActor = { roleName: 'ADMIN', userType: 'ADMIN' as const };
    const staffActor = { roleName: 'SALES_MANAGER', userType: 'STAFF' as const };

    const superAdminTarget = { roleName: 'SUPER_ADMIN', userType: 'ADMIN' as const };
    const adminTarget = { roleName: 'ADMIN', userType: 'ADMIN' as const };
    const staffTarget = { roleName: 'DESIGNER', userType: 'STAFF' as const };
    const customerTarget = { roleName: 'CUSTOMER', userType: 'CUSTOMER' as const };

    describe('isSuperAdmin & isTargetSuperAdmin', () => {
      it('correctly identifies super admin actor and target', () => {
        expect(isSuperAdmin(superAdminActor)).toBe(true);
        expect(isSuperAdmin(adminActor)).toBe(false);
        expect(isSuperAdmin(staffActor)).toBe(false);
        expect(isSuperAdmin(null)).toBe(false);

        expect(isTargetSuperAdmin(superAdminTarget)).toBe(true);
        expect(isTargetSuperAdmin({ userType: 'SUPER_ADMIN' })).toBe(true);
        expect(isTargetSuperAdmin(adminTarget)).toBe(false);
        expect(isTargetSuperAdmin(null)).toBe(false);
      });
    });

    describe('canManageUserCredentials', () => {
      it('blocks regular ADMIN and STAFF from resetting SUPER_ADMIN credentials', () => {
        expect(canManageUserCredentials(adminActor, superAdminTarget)).toBe(false);
        expect(canManageUserCredentials(staffActor, superAdminTarget)).toBe(false);
      });

      it('permits SUPER_ADMIN to manage SUPER_ADMIN credentials', () => {
        expect(canManageUserCredentials(superAdminActor, superAdminTarget)).toBe(true);
      });

      it('blocks regular ADMIN from resetting another ADMIN credentials', () => {
        expect(canManageUserCredentials(adminActor, adminTarget)).toBe(false);
      });

      it('permits SUPER_ADMIN to reset ADMIN credentials', () => {
        expect(canManageUserCredentials(superAdminActor, adminTarget)).toBe(true);
      });

      it('permits ADMIN and SUPER_ADMIN to reset STAFF and CUSTOMER credentials', () => {
        expect(canManageUserCredentials(adminActor, staffTarget)).toBe(true);
        expect(canManageUserCredentials(adminActor, customerTarget)).toBe(true);
        expect(canManageUserCredentials(superAdminActor, staffTarget)).toBe(true);
      });

      it('blocks STAFF from resetting any credentials', () => {
        expect(canManageUserCredentials(staffActor, staffTarget)).toBe(false);
        expect(canManageUserCredentials(staffActor, customerTarget)).toBe(false);
      });
    });

    describe('canChangeUserStatus', () => {
      it('strictly prohibits changing status of SUPER_ADMIN accounts for anyone', () => {
        expect(canChangeUserStatus(superAdminActor, superAdminTarget)).toBe(false);
        expect(canChangeUserStatus(adminActor, superAdminTarget)).toBe(false);
        expect(canChangeUserStatus(staffActor, superAdminTarget)).toBe(false);
      });

      it('permits only SUPER_ADMIN to change status of ADMIN accounts', () => {
        expect(canChangeUserStatus(superAdminActor, adminTarget)).toBe(true);
        expect(canChangeUserStatus(adminActor, adminTarget)).toBe(false);
      });

      it('permits ADMIN and SUPER_ADMIN to toggle status for STAFF and CUSTOMER accounts', () => {
        expect(canChangeUserStatus(adminActor, staffTarget)).toBe(true);
        expect(canChangeUserStatus(adminActor, customerTarget)).toBe(true);
        expect(canChangeUserStatus(superAdminActor, staffTarget)).toBe(true);
      });

      it('permits SUPER_ADMIN to deactivate and re-activate every staff role in the roster', () => {
        const staffRoles = [
          'SALES_MANAGER',
          'DESIGN_MANAGER',
          'DESIGNER',
          'CATALOG_MANAGER',
          'SUPPORT_AGENT',
        ];
        for (const role of staffRoles) {
          expect(
            canChangeUserStatus(superAdminActor, {
              id: 'staff-123',
              roleName: role,
              userType: 'STAFF',
            }),
          ).toBe(true);
        }
      });
    });

    describe('canProvisionRole', () => {
      it('blocks regular ADMIN and STAFF from provisioning SUPER_ADMIN role', () => {
        expect(canProvisionRole(adminActor, 'SUPER_ADMIN')).toBe(false);
        expect(canProvisionRole(staffActor, 'SUPER_ADMIN')).toBe(false);
      });

      it('permits SUPER_ADMIN to provision SUPER_ADMIN role', () => {
        expect(canProvisionRole(superAdminActor, 'SUPER_ADMIN')).toBe(true);
      });

      it('permits ADMIN to provision operational roles', () => {
        expect(canProvisionRole(adminActor, 'ADMIN')).toBe(true);
        expect(canProvisionRole(adminActor, 'SALES_MANAGER')).toBe(true);
      });
    });
  });
});
