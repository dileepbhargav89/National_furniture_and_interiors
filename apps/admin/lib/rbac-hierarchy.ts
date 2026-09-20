/**
 * Role-Based Access Control (RBAC) Hierarchy & Protection Helpers
 *
 * Strict hierarchy enforcement rules:
 * 1. SUPER_ADMIN accounts are immutable to non-super-admins:
 *    - No ADMIN or STAFF may reset password, alter status, or resend tokens for a SUPER_ADMIN.
 * 2. SUPER_ADMIN accounts cannot be suspended or deactivated by anyone (system protection).
 * 3. Only a SUPER_ADMIN can manage credentials or alter status of another ADMIN.
 * 4. Only a SUPER_ADMIN can invite or provision accounts with the SUPER_ADMIN role.
 */

export interface RoleActor {
  id?: string | undefined;
  roleName?: string | null | undefined;
  userType?: string | null | undefined;
}

export interface RoleTarget {
  id?: string | undefined;
  _id?: string | undefined;
  roleName?: string | null | undefined;
  userType?: string | null | undefined;
}

/**
 * Returns true if the actor has the universal SUPER_ADMIN role.
 */
export function isSuperAdmin(actor?: RoleActor | null): boolean {
  return actor?.roleName === 'SUPER_ADMIN';
}

/**
 * Returns true if the target user is a SUPER_ADMIN.
 */
export function isTargetSuperAdmin(target?: RoleTarget | null): boolean {
  if (!target) return false;
  return target.roleName === 'SUPER_ADMIN' || target.userType === 'SUPER_ADMIN';
}

/**
 * Determines whether the actor has authorization to reset or manage credentials for the target user.
 */
export function canManageUserCredentials(
  actor?: RoleActor | null,
  target?: RoleTarget | null,
): boolean {
  if (!actor || !target) return false;

  // If target is a SUPER_ADMIN, strictly only another SUPER_ADMIN may manage credentials
  if (isTargetSuperAdmin(target)) {
    return isSuperAdmin(actor);
  }

  // If target is an ADMIN, strictly only a SUPER_ADMIN may reset credentials
  if (target.roleName === 'ADMIN' || target.userType === 'ADMIN') {
    return isSuperAdmin(actor);
  }

  // For STAFF and CUSTOMER targets, an ADMIN or SUPER_ADMIN may reset credentials
  return actor.userType === 'ADMIN' || isSuperAdmin(actor) || actor.roleName === 'ADMIN';
}

/**
 * Determines whether the actor has authorization to alter the status (suspend, re-activate, ban)
 * of the target user.
 */
export function canChangeUserStatus(actor?: RoleActor | null, target?: RoleTarget | null): boolean {
  if (!actor || !target) return false;

  // SUPER_ADMIN accounts are strictly immutable in status
  if (isTargetSuperAdmin(target)) {
    return false;
  }

  // ADMIN accounts can only have their status altered by a SUPER_ADMIN
  if (target.roleName === 'ADMIN' || target.userType === 'ADMIN') {
    return isSuperAdmin(actor);
  }

  // For STAFF and CUSTOMER targets, an ADMIN or SUPER_ADMIN can toggle status
  return actor.userType === 'ADMIN' || isSuperAdmin(actor) || actor.roleName === 'ADMIN';
}

/**
 * Determines whether the actor can provision or invite an account with the specified role.
 */
export function canProvisionRole(
  actor?: RoleActor | null,
  targetRoleName?: string | null,
): boolean {
  if (!actor) return false;

  // Only SUPER_ADMIN can provision SUPER_ADMIN accounts
  if (targetRoleName === 'SUPER_ADMIN') {
    return isSuperAdmin(actor);
  }

  // ADMIN or SUPER_ADMIN can provision other roles
  return isSuperAdmin(actor) || actor.roleName === 'ADMIN' || actor.userType === 'ADMIN';
}
