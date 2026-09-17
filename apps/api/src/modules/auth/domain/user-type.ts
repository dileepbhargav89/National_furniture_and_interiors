// docs/03_database_design.md §9.1.1 — `userType` enum. Framework-free (docs/06 §4.3).
export const USER_TYPES = ['CUSTOMER', 'STAFF', 'ADMIN'] as const;
export type UserType = (typeof USER_TYPES)[number];

/** docs/09 §2.8 — MFA is mandatory for STAFF/ADMIN, not required for CUSTOMER. */
export function requiresMfa(userType: UserType): boolean {
  return userType === 'STAFF' || userType === 'ADMIN';
}

export const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'BANNED', 'INVITED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
