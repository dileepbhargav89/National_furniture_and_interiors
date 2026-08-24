// Regression guard for the malformed-id -> 500 defect found during Sprint 1 closure.
//
// `POST /auth/mfa/setup` and `POST /auth/mfa/verify` are UNAUTHENTICATED and take a
// client-supplied `userId`. Passing anything Mongoose cannot cast to an ObjectId threw a
// CastError, which the error handler could only classify as 500 INTERNAL_ERROR. Two consequences:
// any caller could manufacture 500s on demand and inflate the 5xx rate docs/10 §6.2 alerts on,
// and a malformed id behaved observably differently from a non-existent one, which is an
// enumeration signal docs/09 §10 rules out for the auth surface.
//
// The repository now returns null for an id that is not 24 hex characters, so both cases
// converge on 401 "Invalid session".
import { describe, expect, it, vi } from 'vitest';

const findOne = vi.fn();

vi.mock('../../../src/modules/auth/infrastructure/user.schema', () => ({
  UserModel: {
    findOne: (...args: unknown[]) => findOne(...args),
  },
}));

const { MongoAuthUserRepository } =
  await import('../../../src/modules/auth/infrastructure/auth-user.repository');

describe('MongoAuthUserRepository.findById', () => {
  const malformed = [
    ['not-an-objectid', 'plain text'],
    ['', 'empty string'],
    ['123', 'too short'],
    ['deadbeefdeadbeefdeadbeefdeadbeef', 'too long'],
    ['zzzzzzzzzzzzzzzzzzzzzzzz', 'right length, non-hex'],
    ['../../etc/passwd', 'path traversal shape'],
    ['{"$ne":null}', 'operator-injection shape'],
  ] as const;

  it.each(malformed)('returns null for %s (%s) without querying the database', async (id) => {
    findOne.mockClear();
    const repo = new MongoAuthUserRepository();

    await expect(repo.findById(id)).resolves.toBeNull();
    // Not querying at all is the point: it is what stops Mongoose raising CastError.
    expect(findOne).not.toHaveBeenCalled();
  });

  it('still queries for a well-formed 24-hex id', async () => {
    findOne.mockClear();
    findOne.mockReturnValue({ lean: async () => null });
    const repo = new MongoAuthUserRepository();

    await expect(repo.findById('deadbeefdeadbeefdeadbeef')).resolves.toBeNull();
    expect(findOne).toHaveBeenCalledWith({ _id: 'deadbeefdeadbeefdeadbeef', isDeleted: false });
  });

  it('applies the isDeleted: false filter docs/03 §3.1 requires at the repository layer', async () => {
    findOne.mockClear();
    findOne.mockReturnValue({ lean: async () => null });
    const repo = new MongoAuthUserRepository();

    await repo.findById('aaaaaaaaaaaaaaaaaaaaaaaa');
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({ isDeleted: false }) as Record<string, unknown>,
    );
  });
});
