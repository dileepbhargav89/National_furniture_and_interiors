// PermissionResolver — the `admin` module's exported Application-layer interface implementation.
//
// This is the single cross-module export other modules consume (docs/08 §8's `admin` row:
// dependencies = "Every module"). `auth` depends on the IPermissionResolver *interface* declared
// in its own application/ports.ts and receives THIS implementation at the composition root —
// so `auth` never imports `admin`'s infrastructure or domain (docs/06 §4.3 / §1.6).
//
// Resolves roles.permissionIds[] -> permissions.key, which docs/03 §9.1.2-9.1.3 and docs/02 §18
// establish as the single enforcement source of truth.
import type { IPermissionRepository, IRoleRepository } from './ports';

export class PermissionResolver {
  constructor(
    private readonly roles: IRoleRepository,
    private readonly permissions: IPermissionRepository,
  ) {}

  async resolvePermissionKeys(roleId: string): Promise<string[]> {
    const role = await this.roles.findById(roleId);
    if (!role) {
      // Fail-closed (docs/09 §2.2): an unresolvable role yields NO permissions, never a default set.
      return [];
    }
    const permissions = await this.permissions.findByIds(role.permissionIds);
    return permissions.map((permission) => permission.key);
  }

  async resolveRoleName(roleId: string): Promise<string> {
    const role = await this.roles.findById(roleId);
    return role?.name ?? 'UNKNOWN';
  }
}
