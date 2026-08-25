import { describe, expect, it, vi } from 'vitest';
import {
  AuditLogger,
  ListAuditLogs,
  ListPermissions,
  ListRoles,
} from '../../../src/modules/admin/application/audit-logger';
import type {
  IAuditLogRepository,
  IPermissionRepository,
  IRoleRepository,
} from '../../../src/modules/admin/application/ports';

describe('Admin Application - AuditLogger & Lists', () => {
  describe('AuditLogger', () => {
    it('appends a redacted audit log via the repository', async () => {
      const repository = {
        append: vi.fn(async () => undefined),
      } as unknown as IAuditLogRepository;
      const logger = new AuditLogger(repository);

      await logger.record({
        actorId: 'u1',
        actorRole: 'role1',
        action: 'UPDATE_USER',
        entityType: 'User',
        entityId: 'u2',
        before: { password: 'old', name: 'John' },
        after: { password: 'new', name: 'Johnny' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      // Assert redactSnapshot was called implicitly (passwords redacted)
      expect(repository.append).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'u1',
          action: 'UPDATE_USER',
          before: { password: '[REDACTED]', name: 'John' },
          after: { password: '[REDACTED]', name: 'Johnny' },
        }),
      );
    });
  });

  describe('ListAuditLogs', () => {
    it('returns recent audit logs, capping the limit at 100', async () => {
      const repository = {
        findRecent: vi.fn(async () => []),
      } as unknown as IAuditLogRepository;
      const listCmd = new ListAuditLogs(repository);

      await listCmd.execute(150); // exceeds max limit of 100
      expect(repository.findRecent).toHaveBeenCalledWith(100);

      await listCmd.execute(50); // under max limit
      expect(repository.findRecent).toHaveBeenCalledWith(50);
    });
  });

  describe('ListRoles', () => {
    it('returns all roles', async () => {
      const roles = {
        findAll: vi.fn(async () => [{ id: 'role1' }]),
      } as unknown as IRoleRepository;
      const listRoles = new ListRoles(roles);

      const result = await listRoles.execute();
      expect(result).toEqual([{ id: 'role1' }]);
      expect(roles.findAll).toHaveBeenCalled();
    });
  });

  describe('ListPermissions', () => {
    it('returns all permissions', async () => {
      const permissions = {
        findAll: vi.fn(async () => [{ key: 'users.read' }]),
      } as unknown as IPermissionRepository;
      const listPerms = new ListPermissions(permissions);

      const result = await listPerms.execute();
      expect(result).toEqual([{ key: 'users.read' }]);
      expect(permissions.findAll).toHaveBeenCalled();
    });
  });
});
