// Migration 0004 — bootstrap the first SUPER_ADMIN account.
//
// Authorized by ADR-0002 Option A (approved 2026-08-11): "The initial SUPER_ADMIN is bootstrapped
// by a migration (docs/13_deployment_strategy.md §5.4's reference-data exception), not by any HTTP
// endpoint." This is the only path by which a privileged account can exist before any privileged
// account exists — the chicken-and-egg case POST /admin/users cannot solve.
//
// SECURITY DESIGN — read before changing:
//   * Credentials come from the environment, never from source (docs/09 §5.1, docs/18 §8 "Do not
//     hardcode secrets"). No default password exists anywhere in this file.
//   * If either variable is unset the migration is a NO-OP. It does NOT invent a fallback account.
//     A default-credential admin would be a worse security hole than having no admin at all.
//   * The password is bcrypt-hashed before storage (docs/07 §6.2, docs/02 §9.1).
//   * The account is created with mfaEnabled=false and no TOTP secret; docs/09 §2.8 requires the
//     holder to enrol MFA before privileged access, which the auth module enforces at login.
//
// Category: `backfill` (docs/13 §5.1). Idempotent: upserts by email, never overwrites an existing
// account's credentials on re-run.
import bcrypt from 'bcryptjs';
import type { Db } from './types';
import type { Migration } from './types';

const BCRYPT_COST = 12;

export const migration: Migration = {
  id: '0004',
  description: 'Bootstrap the initial SUPER_ADMIN account (no-op unless env vars are set)',
  category: 'backfill',

  async apply(db: Db): Promise<void> {
    const email = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL;
    const password = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.log(
        '[0004] BOOTSTRAP_SUPER_ADMIN_EMAIL / _PASSWORD not set — skipping (no default account is created by design)',
      );
      return;
    }

    // docs/09 §2.7's policy floor, re-checked here because a migration bypasses the API layer's
    // Zod validation entirely.
    if (password.length < 10 || password.length > 128) {
      throw new Error(
        '[0004] BOOTSTRAP_SUPER_ADMIN_PASSWORD must be 10-128 characters (docs/09 §2.7)',
      );
    }

    const superAdminRole = await db.collection('roles').findOne({ name: 'SUPER_ADMIN' });
    if (!superAdminRole) {
      throw new Error('[0004] SUPER_ADMIN role not found — run migrations 0002 and 0003 first');
    }

    const existing = await db.collection('users').findOne({ email, isDeleted: false });
    if (existing) {
      console.log('[0004] bootstrap account already exists — leaving credentials untouched');
      return;
    }

    const now = new Date();
    await db.collection('users').insertOne({
      fullName: 'Platform Super Admin',
      email,
      phone: null,
      passwordHash: await bcrypt.hash(password, BCRYPT_COST),
      authProviders: ['LOCAL'],
      googleId: null,
      isEmailVerified: true,
      isPhoneVerified: false,
      userType: 'ADMIN',
      roleId: superAdminRole._id,
      additionalRoleIds: [],
      status: 'ACTIVE',
      avatarUrl: null,
      avatarPublicId: null,
      addresses: [],
      // docs/09 §2.8 — MFA is mandatory for STAFF/ADMIN. The account is created un-enrolled; the
      // auth module blocks privileged access until enrolment completes.
      mfaEnabled: false,
      mfaSecret: null,
      lastLoginAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordHistory: [],
      createdAt: now,
      updatedAt: now,
      createdBy: null,
      updatedBy: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      version: 0,
    });

    console.log(
      `[0004] bootstrap SUPER_ADMIN created for ${email} (MFA enrolment required at first login)`,
    );
  },

  async verify(db: Db): Promise<void> {
    const email = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL;
    if (!email) {
      return; // no-op run — nothing to verify
    }
    const user = await db.collection('users').findOne({ email, isDeleted: false });
    if (!user) {
      throw new Error('[0004] verification failed: bootstrap account was not created');
    }
    if (user.userType !== 'ADMIN') {
      throw new Error('[0004] verification failed: bootstrap account is not userType ADMIN');
    }
    if (typeof user.passwordHash !== 'string' || !user.passwordHash.startsWith('$2')) {
      throw new Error('[0004] verification failed: password is not bcrypt-hashed');
    }
  },
};
