import { apiClient } from './client';
import { User } from './users';

export interface Role {
  _id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
}

export interface Permission {
  _id: string;
  key: string;
  description: string;
  group: string;
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
  listUsers: async (params?: { page?: number; limit?: number; roleId?: string; status?: string }) => {
    return apiClient.get<{ items: User[]; total: number }>('/api/v1/admin/users', { ...(params ? { params: params as Record<string, unknown> } : {}) });
  },
  
  createUser: async (data: { email: string; userType: string; roleId?: string; profile?: Record<string, unknown> }) => {
    return apiClient.post<{ user: User }>('/api/v1/admin/users', data);
  },

  // RBAC
  listRoles: async () => {
    return apiClient.get<{ items: Role[] }>('/api/v1/admin/roles');
  },
  
  listPermissions: async () => {
    return apiClient.get<{ items: Permission[] }>('/api/v1/admin/permissions');
  },

  // Audit
  listAuditLogs: async (params?: { page?: number; limit?: number; action?: string; actorId?: string }) => {
    return apiClient.get<{ items: AuditLog[]; total: number }>('/api/v1/admin/audit-logs', { ...(params ? { params: params as Record<string, unknown> } : {}) });
  }
};
