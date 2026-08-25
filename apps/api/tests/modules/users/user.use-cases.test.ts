import { describe, expect, it, vi } from 'vitest';
import {
  AdminCreateUser,
  AdminListUsers,
  GetOwnProfile,
  UpdateOwnProfile,
} from '../../../src/modules/users/application/user.use-cases';
import { ConflictError, NotFoundError, ValidationError } from '../../../src/core/exceptions';
import type {
  IUserProfileRepository,
  UserProfile,
} from '../../../src/modules/users/application/ports';

const mockProfile: UserProfile = {
  id: 'u1',
  email: 'test@example.com',
  phone: '1234567890',
  firstName: 'Test',
  lastName: 'User',
  userType: 'CUSTOMER',
  status: 'ACTIVE',
  addresses: [],
  joinedAt: new Date(),
  lastLoginAt: null,
};

function build() {
  const repository = {
    findById: vi.fn(async () => mockProfile),
    findByEmail: vi.fn(async (email) => (email === 'test@example.com' ? mockProfile : null)),
    updateOwn: vi.fn(async () => mockProfile),
    list: vi.fn(async () => [mockProfile]),
    createPrivileged: vi.fn(async () => mockProfile),
  } as unknown as IUserProfileRepository;

  return { repository };
}

describe('Users Use Cases', () => {
  describe('GetOwnProfile', () => {
    it('returns the profile if found', async () => {
      const { repository } = build();
      const useCase = new GetOwnProfile(repository);

      const result = await useCase.execute('u1');
      expect(result.id).toBe('u1');
      expect(repository.findById).toHaveBeenCalledWith('u1');
    });

    it('throws NotFoundError if profile does not exist', async () => {
      const { repository } = build();
      vi.mocked(repository.findById).mockResolvedValueOnce(null);
      const useCase = new GetOwnProfile(repository);

      await expect(useCase.execute('u2')).rejects.toThrowError(NotFoundError);
    });
  });

  describe('UpdateOwnProfile', () => {
    it('updates the profile successfully', async () => {
      const { repository } = build();
      const useCase = new UpdateOwnProfile(repository);

      const result = await useCase.execute('u1', { firstName: 'Updated' });
      expect(result).toBeDefined();
      expect(repository.updateOwn).toHaveBeenCalledWith('u1', { firstName: 'Updated' });
    });

    it('rejects if address array exceeds the 10 item bound', async () => {
      const { repository } = build();
      const useCase = new UpdateOwnProfile(repository);

      const manyAddresses = Array(11).fill({ street: '123 St' });
      await expect(
        useCase.execute('u1', { addresses: manyAddresses as unknown as UserProfile['addresses'] }),
      ).rejects.toThrowError(ValidationError);
      expect(repository.updateOwn).not.toHaveBeenCalled();
    });

    it('throws NotFoundError if profile fails to update (not found)', async () => {
      const { repository } = build();
      vi.mocked(repository.updateOwn).mockResolvedValueOnce(null);
      const useCase = new UpdateOwnProfile(repository);

      await expect(useCase.execute('u1', { firstName: 'Updated' })).rejects.toThrowError(
        NotFoundError,
      );
    });
  });

  describe('AdminListUsers', () => {
    it('returns a list of users, enforcing max limit of 100', async () => {
      const { repository } = build();
      const useCase = new AdminListUsers(repository);

      await useCase.execute(150);
      expect(repository.list).toHaveBeenCalledWith(100);

      await useCase.execute(0); // tests lower bound max(limit, 1)
      expect(repository.list).toHaveBeenCalledWith(1);
    });
  });

  describe('AdminCreateUser', () => {
    it('creates a privileged user if email is not taken', async () => {
      const { repository } = build();
      const useCase = new AdminCreateUser(repository);

      const input = {
        email: 'new@example.com',
        firstName: 'Admin',
        lastName: 'User',
        userType: 'ADMIN' as const,
        roleId: 'role-admin',
      };

      await useCase.execute(input);
      expect(repository.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(repository.createPrivileged).toHaveBeenCalledWith(input);
    });

    it('throws ConflictError if email is already in use', async () => {
      const { repository } = build();
      const useCase = new AdminCreateUser(repository);

      const input = {
        email: 'test@example.com', // returns mockProfile in build()
        firstName: 'Admin',
        lastName: 'User',
        userType: 'ADMIN' as const,
        roleId: 'role-admin',
      };

      await expect(useCase.execute(input)).rejects.toThrowError(ConflictError);
      expect(repository.createPrivileged).not.toHaveBeenCalled();
    });
  });
});
