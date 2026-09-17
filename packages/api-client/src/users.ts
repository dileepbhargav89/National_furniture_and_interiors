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
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED' | 'BANNED' | 'INVITED';
  roleId?: string;
  avatarUrl?: string | null;
  addresses?: UserAddress[];
  mfaEnabled: boolean;
  createdAt: string;
  companyName?: string | null;
  gstin?: string | null;
  onboardingStatus?: 'INVITED' | 'PENDING_PASSWORD' | 'COMPLETED';
  onboardingToken?: string | null;
  onboardingTokenExpiresAt?: string | null;
  invitedAt?: string | null;
  lastLoginAt?: string | null;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  mustChangePassword?: boolean;
  ordersCount?: number;
  totalSpend?: number; // in paise
  lastOrderAt?: string | null;
  authProviders?: string[];
  // Backward-compatibility alias
  user?: User;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    addresses?: UserAddress[];
  };
}

export interface UnregisteredLead {
  id: string;
  name: string;
  fullName?: string | undefined;
  email?: string | null | undefined;
  phone: string;
  source: string;
  interestType: string;
  interestedCategory?: string | undefined;
  projectType?: string | null | undefined;
  budgetRange?: { min: number; max: number } | undefined;
  estimatedBudget?: number | undefined;
  score: number;
  priority: 'HOT' | 'WARM' | 'COLD';
  leadScore?: 'HIGH' | 'MEDIUM' | 'LOW' | undefined;
  status: string;
  notes?: string | null | undefined;
  lastContactedAt?: string | null | undefined;
  createdAt: string;
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
  },
};
