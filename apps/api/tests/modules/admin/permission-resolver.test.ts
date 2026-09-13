import { describe, expect, it, vi } from 'vitest';
import { PermissionResolver } from '../../../src/modules/admin/application/permission-resolver';
import type {
  IPermissionRepository,
  IRoleRepository,
} from '../../../src/modules/admin/application/ports';

function build(roleExists = true, roleName = 'STAFF') {
  const roles = {
    findById: vi.fn(async () =>
      roleExists ? { id: 'role1', name: roleName, permissionIds: ['p1', 'p2'], description: '', isSystemRole: false } : null,
    ),
  } as unknown as IRoleRepository;

  const permissions = {
    findAll: vi.fn(async () => [
      { id: 'p1', key: 'users.read', module: 'users', description: '' },
      { id: 'p2', key: 'users.write', module: 'users', description: '' },
    ]),
    findByIds: vi.fn(async () => [
      { id: 'p1', key: 'users.read', module: 'users', description: '' },
      { id: 'p2', key: 'users.write', module: 'users', description: '' },
    ]),
  } as unknown as IPermissionRepository;

  return { resolver: new PermissionResolver(roles, permissions), roles, permissions };
}

describe('PermissionResolver', () => {
  describe('resolvePermissionKeys', () => {
    it('resolves a standard role ID to its corresponding permission keys', async () => {
      const { resolver, roles, permissions } = build(true, 'STAFF');

      const keys = await resolver.resolvePermissionKeys('role1');

      expect(roles.findById).toHaveBeenCalledWith('role1');
      expect(permissions.findByIds).toHaveBeenCalledWith(['p1', 'p2']);
      expect(keys).toEqual(['users.read', 'users.write']);
    });

    it('resolves an ADMIN or SUPER_ADMIN role to wildcard and all permissions', async () => {
      const { resolver, roles, permissions } = build(true, 'ADMIN');

      const keys = await resolver.resolvePermissionKeys('role1');

      expect(roles.findById).toHaveBeenCalledWith('role1');
      expect(permissions.findAll).toHaveBeenCalled();
      expect(keys).toEqual(['*', 'users.read', 'users.write']);
    });

    it('returns an empty array if the role is not found (fail-closed)', async () => {
      const { resolver, permissions } = build(false);

      const keys = await resolver.resolvePermissionKeys('unknown-role');

      expect(keys).toEqual([]);
      expect(permissions.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('resolveRoleName', () => {
    it('resolves a role ID to its name', async () => {
      const { resolver } = build(true, 'ADMIN');
      const name = await resolver.resolveRoleName('role1');
      expect(name).toBe('ADMIN');
    });

    it('returns UNKNOWN if the role is not found', async () => {
      const { resolver } = build(false);
      const name = await resolver.resolveRoleName('unknown-role');
      expect(name).toBe('UNKNOWN');
    });
  });
});
