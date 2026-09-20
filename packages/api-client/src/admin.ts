import { apiClient } from './client';
import { UnregisteredLead, User } from './users';

export interface Role {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  permissionIds?: string[];
  isSystem: boolean;
  isSystemRole?: boolean;
  createdAt?: string;
}

export interface Permission {
  _id: string;
  id?: string;
  key: string;
  description: string;
  group?: string;
  module?: string;
}

export interface AuditLog {
  _id: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export const AdminService = {
  // User Management
  listUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    userType?: string;
    status?: string;
  }) => {
    return apiClient.get<{ items: User[]; total: number }>('/api/v1/admin/users', {
      ...(params ? { params: params as Record<string, unknown> } : {}),
    });
  },

  listUsersWithFilters: async (
    params?:
      | {
          page?: number | undefined;
          limit?: number | undefined;
          search?: string | undefined;
          userType?: string | undefined;
          status?: string | undefined;
        }
      | undefined,
  ) => {
    return apiClient.get<{ items: User[]; total: number }>('/api/v1/admin/users', {
      ...(params ? { params: params as Record<string, unknown> } : {}),
    });
  },

  getUserById: async (id: string) => {
    return apiClient.get<User>(`/api/v1/admin/users/${id}`);
  },

  listNonRegisteredUsers: async () => {
    return apiClient.get<{ items: UnregisteredLead[]; total: number }>(
      '/api/v1/admin/users/non-registered',
    );
  },

  createUser: async (data: {
    email: string;
    userType: 'STAFF' | 'ADMIN' | 'CUSTOMER';
    roleName: string;
    fullName: string;
    password: string;
    phone?: string | null | undefined;
  }) => {
    return apiClient.post<User>('/api/v1/admin/users', data);
  },

  onboardUser: async (data: {
    email: string;
    fullName?: string | undefined;
    phone?: string | null | undefined;
    userType?: 'CUSTOMER' | 'STAFF' | 'ADMIN' | undefined;
    roleName?: string | undefined;
    companyName?: string | null | undefined;
    gstin?: string | null | undefined;
    temporaryPassword?: string | undefined;
    sendInvite?: boolean | undefined;
  }) => {
    return apiClient.post<User>('/api/v1/admin/users/onboard', data);
  },

  resendOnboarding: async (id: string) => {
    return apiClient.post<{
      success: boolean;
      message: string;
      onboardingToken?: string;
      onboardingUrl?: string;
    }>(`/api/v1/admin/users/${id}/resend-onboarding`);
  },

  bulkOnboardUsers: async (
    users: Array<{
      email: string;
      fullName?: string | undefined;
      phone?: string | null | undefined;
      userType?: 'CUSTOMER' | 'STAFF' | 'ADMIN' | undefined;
      companyName?: string | null | undefined;
      gstin?: string | null | undefined;
    }>,
  ) => {
    return apiClient.post<{
      success: boolean;
      totalRequested: number;
      successCount: number;
      errorCount: number;
      created: User[];
      errors: Array<{ email: string; error: string }>;
    }>('/api/v1/admin/users/bulk-onboard', { users });
  },

  adminResetPassword: async (
    id: string,
    data: {
      newPassword?: string | undefined;
      mustChangePassword?: boolean | undefined;
      sendEmailLink?: boolean | undefined;
    },
  ) => {
    return apiClient.post<{ success: boolean; message: string; temporaryPassword?: string }>(
      `/api/v1/admin/users/${id}/reset-password`,
      data,
    );
  },

  updateUserStatus: async (
    id: string,
    statusOrData:
      | 'ACTIVE'
      | 'SUSPENDED'
      | 'BANNED'
      | 'INVITED'
      | { status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'INVITED' },
  ) => {
    const status = typeof statusOrData === 'string' ? statusOrData : statusOrData.status;
    return apiClient.patch<User>(`/api/v1/admin/users/${id}/status`, { status });
  },

  // RBAC
  listRoles: async () => {
    return apiClient.get<{ items: Role[] }>('/api/v1/admin/roles');
  },

  listPermissions: async () => {
    return apiClient.get<{ items: Permission[] }>('/api/v1/admin/permissions');
  },

  /** Convenience: list users filtered by userType (for staff roster on RBAC page). */
  listUsersByRole: async (
    userType: 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'SUPER_ADMIN',
    params?: {
      page?: number;
      limit?: number;
      status?: string;
    },
  ) => {
    return apiClient.get<{ items: User[]; total: number }>('/api/v1/admin/users', {
      params: { userType, ...params } as Record<string, unknown>,
    });
  },

  /** Convenience: onboard a new admin or staff member (invite-first flow). */
  inviteStaffMember: async (data: {
    fullName: string;
    email: string;
    phone?: string | null;
    userType: 'ADMIN' | 'STAFF';
    roleName: string;
    sendInvite?: boolean;
    temporaryPassword?: string;
  }) => {
    return apiClient.post<User>('/api/v1/admin/users/onboard', {
      ...data,
      sendInvite: data.sendInvite ?? true,
    });
  },

  // Audit
  listAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    action?: string;
    actorId?: string;
  }) => {
    return apiClient.get<{ items: AuditLog[]; total: number }>('/api/v1/admin/audit-logs', {
      ...(params ? { params: params as Record<string, unknown> } : {}),
    });
  },
};
