// Application-layer re-export of the bounds the users module's Zod validators need — same
// rationale as auth/application/policy.ts (docs/06 §4.3's presentation -> application-only rule).
//
// The password bounds come from `auth`'s APPLICATION layer, not its domain: docs/06 §4.3 permits
// importing "another module's application/ exported interface only". `auth` owns the password
// policy (docs/09 §2.7); `users` consumes it for its admin account-creation schema rather than
// restating the numbers, which would be the duplicate-rule defect docs/18 §4.3 forbids.
export { MAX_ADDRESSES } from '../domain/address';
export { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../auth/application/policy';
