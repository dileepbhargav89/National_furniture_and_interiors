// bcrypt password hashing — docs/07_technology_decision_record.md §6.2 (LOCKED: "bcrypt with
// per-user salt, configurable cost factor"), docs/02 §9.1.
//
// Package note: `bcryptjs` (pure-JS) rather than `bcrypt` (native). docs/07 §6.2 locks the
// ALGORITHM, not a package. bcryptjs produces and verifies standard `$2a$` hashes, and avoids a
// native build toolchain in the node:22-alpine runtime image (docs/10 §4.1) — an operational
// choice within an already-locked decision, in the same category as ioredis implementing "Redis".
import bcrypt from 'bcryptjs';
import type { IPasswordHasher } from '../application/ports';

/** docs/07 §6.2 — "configurable cost factor". 12 is the current operational value. */
const BCRYPT_COST = 12;

export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, BCRYPT_COST);
  }

  async verify(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}
