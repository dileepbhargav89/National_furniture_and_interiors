import { apiClient } from './client';

export interface UserAddress {
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  _id?: string;
  fullName: string;
  email: string;
  phone?: string | null;
  userType: 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  roleId?: string;
  avatarUrl?: string | null;
  addresses?: UserAddress[];
  mfaEnabled: boolean;
  createdAt: string;
  companyName?: string | null;
  gstin?: string | null;
  // Backward-compatibility alias
  user?: User;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    addresses?: UserAddress[];
  };
}

export interface UpdateOwnProfilePayload {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  companyName?: string | null;
  gstin?: string | null;
  addresses?: UserAddress[];
}

export const UsersService = {
  getOwnProfile: async () => {
    const res = await apiClient.get<User>('/api/v1/users/me');
    if (res.data) {
      if (!res.data.user) {
        res.data.user = res.data;
      }
      if (!res.data._id && res.data.id) {
        res.data._id = res.data.id;
      }
    }
    return res as typeof res & { data: User & { user: User } };
  },
  
  updateOwnProfile: async (data: UpdateOwnProfilePayload) => {
    const res = await apiClient.patch<User>('/api/v1/users/me', data);
    if (res.data) {
      if (!res.data.user) {
        res.data.user = res.data;
      }
      if (!res.data._id && res.data.id) {
        res.data._id = res.data.id;
      }
    }
    return res as typeof res & { data: User & { user: User } };
  }
};
