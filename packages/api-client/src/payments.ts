import { apiClient } from './client';

export type PaymentStatusType =
  'CREATED' | 'AUTHORIZED' | 'CAPTURED' | 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';

export interface PaymentReconciliationInfo {
  utrNumber: string;
  bankName?: string | undefined;
  verifiedBy?: string | undefined;
  reconciledAt: string;
  notes?: string | undefined;
}

export interface PaymentRefundInfo {
  amount: number;
  reason: string;
  refundReference?: string | undefined;
  refundedAt: string;
}

export interface PaymentSnapshot {
  id: string;
  payableType?: string | undefined;
  payableId?: string | undefined;
  orderId: string;
  amount: number; // paise
  currency: string;
  status: PaymentStatusType;
  gateway?: string | undefined;
  method?: string | undefined;
  gatewayOrderId?: string | undefined;
  gatewayPaymentId?: string | undefined;
  customerName?: string | undefined;
  customerEmail?: string | undefined;
  customerPhone?: string | undefined;
  reconciliationDetails?: PaymentReconciliationInfo | undefined;
  refundDetails?: PaymentRefundInfo | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentKpis {
  totalRevenue: number;
  pendingCount: number;
  capturedCount: number;
  failedCount: number;
  refundedCount: number;
  totalCount: number;
  averageOrderValue: number;
}

export interface VerifyPaymentRequest {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
  orderId?: string;
}

export interface ReconcilePaymentRequest {
  utrNumber: string;
  bankName?: string;
  notes?: string;
}

export interface RecordRefundRequest {
  amount?: number;
  reason: string;
  refundReference?: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  orderId: string;
}

export interface CreatePaymentIntentResponse {
  gatewayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export const PaymentsService = {
  createPaymentIntent: async (
    payload: CreatePaymentIntentRequest,
    accessToken?: string,
  ): Promise<{ data: CreatePaymentIntentResponse }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.post<any>('/api/v1/payments/create-intent', payload, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    return response.data;
  },

  listPayments: async (
    params?: { limit?: number; offset?: number; status?: string; search?: string },
    accessToken?: string,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.get<any>('/api/v1/admin/payments', {
      params: {
        limit: (params?.limit ?? 20).toString(),
        offset: (params?.offset ?? 0).toString(),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.search ? { search: params.search } : {}),
      },
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });

    return response.data;
  },

  getPaymentById: async (paymentId: string, accessToken?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.get<any>(`/api/v1/admin/payments/${paymentId}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    return response.data;
  },

  getPaymentKpis: async (accessToken?: string): Promise<{ data: PaymentKpis }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.get<any>('/api/v1/admin/payments/kpis', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    return response.data;
  },

  verifyPayment: async (payload: VerifyPaymentRequest, accessToken?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.post<any>('/api/v1/payments/verify', payload, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    return response.data;
  },

  reconcilePayment: async (
    paymentId: string,
    payload: ReconcilePaymentRequest,
    accessToken?: string,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.post<any>(
      `/api/v1/admin/payments/${paymentId}/reconcile`,
      payload,
      {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    );
    return response.data;
  },

  recordRefund: async (paymentId: string, payload: RecordRefundRequest, accessToken?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.post<any>(
      `/api/v1/admin/payments/${paymentId}/refund`,
      payload,
      {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    );
    return response.data;
  },

  getInvoiceDownloadUrl: async (paymentId: string, accessToken?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.get<any>(`/api/v1/payments/${paymentId}/invoice`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    return response.data;
  },

  getInvoiceByOrderId: async (orderId: string, accessToken?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.get<any>(`/api/v1/orders/${orderId}/invoice`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    return response.data;
  },

  adminGetInvoiceDownloadUrl: async (paymentId: string, accessToken?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.get<any>(`/api/v1/admin/payments/${paymentId}/invoice`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    return response.data;
  },

  getInvoicePdfUrl: (paymentId: string): string => `/api/v1/payments/${paymentId}/invoice/pdf`,
};
