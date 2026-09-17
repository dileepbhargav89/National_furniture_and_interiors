import { describe, expect, it, vi } from 'vitest';
import {
  AdminCreateUser,
  AdminGetUserDetail,
  AdminListUsers,
  AdminListUsersWithFilters,
  AdminOnboardUser,
  AdminResendOnboarding,
  AdminResetUserPassword,
  AdminUpdateUserStatus,
  GetOwnProfile,
  UpdateOwnProfile,
} from '../../../src/modules/users/application/user.use-cases';
import { ConflictError, NotFoundError, ValidationError } from '../../../src/core/exceptions';
import type {
  IUserProfileRepository,
  UserDetailDossier,
  UserProfile,
} from '../../../src/modules/users/application/ports';

const mockProfile: UserProfile = {
  id: 'u1',
  email: 'test@example.com',
  phone: '1234567890',
  fullName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  userType: 'CUSTOMER',
  status: 'ACTIVE',
  addresses: [],
  joinedAt: new Date(),
  lastLoginAt: null,
};

const mockDossier: UserDetailDossier = {
  ...mockProfile,
  ordersCount: 3,
  totalSpend: 15000000, // 1,50,000 INR in paise
  lastOrderAt: new Date(),
  authProviders: ['LOCAL'],
};

function build() {
  const repository = {
    findById: vi.fn(async (id: string) => (id === 'u1' ? mockProfile : null)),
    findByIdDetailed: vi.fn(async (id: string) => (id === 'u1' ? mockDossier : null)),
    findByEmail: vi.fn(async (email: string) =>
      email === 'test@example.com' ? mockProfile : null,
    ),
    updateOwn: vi.fn(async () => mockProfile),
    list: vi.fn(async () => [mockProfile]),
    listWithFilters: vi.fn(async () => ({ items: [mockProfile], total: 1 })),
    createPrivileged: vi.fn(async () => mockProfile),
    onboardUser: vi.fn(async () => mockProfile),
    updateStatus: vi.fn(async (id: string, status: string) =>
      id === 'u1' ? { ...mockProfile, status } : null,
    ),
    resetPassword: vi.fn(async () => true),
    recordOnboardingInvite: vi.fn(async () => true),
  } as unknown as IUserProfileRepository;

  const hashPassword = vi.fn(async (pw: string) => `hashed_${pw}`);
  const generateTemporaryPassword = vi.fn(() => 'SecureTemp123!');

  return { repository, hashPassword, generateTemporaryPassword };
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

  describe('AdminListUsersWithFilters', () => {
    it('applies pagination defaults and limits to repository', async () => {
      const { repository } = build();
      const useCase = new AdminListUsersWithFilters(repository);

      const result = await useCase.execute({
        search: 'Vikram',
        userType: 'CUSTOMER',
        status: 'ACTIVE',
        page: 2,
        limit: 25,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(repository.listWithFilters).toHaveBeenCalledWith({
        search: 'Vikram',
        userType: 'CUSTOMER',
        status: 'ACTIVE',
        page: 2,
        limit: 25,
      });
    });

    it('clamps limit to maximum 100 and minimum 1', async () => {
      const { repository } = build();
      const useCase = new AdminListUsersWithFilters(repository);

      await useCase.execute({ limit: 500, page: -2 });
      expect(repository.listWithFilters).toHaveBeenCalledWith({
        limit: 100,
        page: 1,
      });
    });
  });

  describe('AdminGetUserDetail', () => {
    it('returns rich user dossier when patron exists', async () => {
      const { repository } = build();
      const useCase = new AdminGetUserDetail(repository);

      const dossier = await useCase.execute('u1');
      expect(dossier.id).toBe('u1');
      expect(dossier.ordersCount).toBe(3);
      expect(dossier.totalSpend).toBe(15000000);
      expect(dossier.authProviders).toContain('LOCAL');
    });

    it('throws NotFoundError if patron does not exist', async () => {
      const { repository } = build();
      const useCase = new AdminGetUserDetail(repository);

      await expect(useCase.execute('non-existent-id')).rejects.toThrowError(NotFoundError);
    });
  });

  describe('AdminOnboardUser', () => {
    it('onboards new patron with custom or generated password and hashes it', async () => {
      const { repository, hashPassword, generateTemporaryPassword } = build();
      const useCase = new AdminOnboardUser(repository, hashPassword, generateTemporaryPassword);

      const input = {
        email: 'singhania@luxuryresidences.in',
        fullName: 'Vikramaditya Singhania',
        phone: '+919876543210',
        userType: 'CUSTOMER' as const,
        roleId: 'role-customer',
        companyName: 'Singhania Estates',
        gstin: '29AAAAA0000A1Z5',
        temporaryPassword: 'CustomSecret123!',
        sendInvite: true,
      };

      const result = await useCase.execute(input);
      expect(result).toBeDefined();
      expect(repository.findByEmail).toHaveBeenCalledWith('singhania@luxuryresidences.in');
      expect(hashPassword).toHaveBeenCalledWith('CustomSecret123!');
      expect(repository.onboardUser).toHaveBeenCalledWith(input, 'hashed_CustomSecret123!');
    });

    it('auto-generates temporary password when none provided', async () => {
      const { repository, hashPassword, generateTemporaryPassword } = build();
      const useCase = new AdminOnboardUser(repository, hashPassword, generateTemporaryPassword);

      const input = {
        email: 'deshmukh@atelierdesign.in',
        fullName: 'Ananya Deshmukh',
        userType: 'CUSTOMER' as const,
        roleId: 'role-customer',
      };

      await useCase.execute(input);
      expect(generateTemporaryPassword).toHaveBeenCalled();
      expect(hashPassword).toHaveBeenCalledWith('SecureTemp123!');
    });

    it('throws ConflictError if email is already registered', async () => {
      const { repository, hashPassword, generateTemporaryPassword } = build();
      const useCase = new AdminOnboardUser(repository, hashPassword, generateTemporaryPassword);

      const input = {
        email: 'test@example.com', // existing
        fullName: 'Duplicate User',
        userType: 'CUSTOMER' as const,
        roleId: 'role-customer',
      };

      await expect(useCase.execute(input)).rejects.toThrowError(ConflictError);
      expect(repository.onboardUser).not.toHaveBeenCalled();
    });
  });

  describe('AdminResendOnboarding', () => {
    it('records invite timestamp and dispatches invitation for existing user', async () => {
      const { repository } = build();
      const useCase = new AdminResendOnboarding(repository);

      const result = await useCase.execute('u1');
      expect(result.success).toBe(true);
      expect(result.message).toContain('test@example.com');
      expect(repository.recordOnboardingInvite).toHaveBeenCalledWith('u1');
    });

    it('throws NotFoundError if target user does not exist', async () => {
      const { repository } = build();
      const useCase = new AdminResendOnboarding(repository);

      await expect(useCase.execute('non-existent')).rejects.toThrowError(NotFoundError);
    });
  });

  describe('AdminResetUserPassword', () => {
    it('generates secure temp password, hashes, and updates repository', async () => {
      const { repository, hashPassword, generateTemporaryPassword } = build();
      const useCase = new AdminResetUserPassword(
        repository,
        hashPassword,
        generateTemporaryPassword,
      );

      const result = await useCase.execute('u1', undefined, true);
      expect(result.success).toBe(true);
      expect(result.temporaryPassword).toBe('SecureTemp123!');
      expect(hashPassword).toHaveBeenCalledWith('SecureTemp123!');
      expect(repository.resetPassword).toHaveBeenCalledWith('u1', 'hashed_SecureTemp123!', true);
    });

    it('uses provided custom password if supplied', async () => {
      const { repository, hashPassword } = build();
      const useCase = new AdminResetUserPassword(repository, hashPassword, () => 'fallback');

      const result = await useCase.execute('u1', 'MyCustomPassword99#', false);

      expect(result.success).toBe(true);
      expect(result.temporaryPassword).toBe('MyCustomPassword99#');
      expect(hashPassword).toHaveBeenCalledWith('MyCustomPassword99#');
      expect(repository.resetPassword).toHaveBeenCalledWith(
        'u1',
        'hashed_MyCustomPassword99#',
        false,
      );
    });

    it('throws NotFoundError when user is missing', async () => {
      const { repository, hashPassword } = build();
      const useCase = new AdminResetUserPassword(repository, hashPassword, () => 'temp');

      await expect(useCase.execute('missing-id')).rejects.toThrowError(NotFoundError);
    });
  });

  describe('AdminUpdateUserStatus', () => {
    it('updates user status to ACTIVE, SUSPENDED, or BANNED', async () => {
      const { repository } = build();
      const useCase = new AdminUpdateUserStatus(repository);

      const updated = await useCase.execute('u1', 'SUSPENDED');
      expect(updated.status).toBe('SUSPENDED');
      expect(repository.updateStatus).toHaveBeenCalledWith('u1', 'SUSPENDED');
    });

    it('throws NotFoundError if target user is not found', async () => {
      const { repository } = build();
      const useCase = new AdminUpdateUserStatus(repository);

      await expect(useCase.execute('missing-id', 'BANNED')).rejects.toThrowError(NotFoundError);
    });
  });
});
