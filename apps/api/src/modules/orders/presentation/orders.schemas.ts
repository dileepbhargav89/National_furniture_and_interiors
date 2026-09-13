import { z } from 'zod';
import { PaymentStatus, FulfillmentStatus } from '../domain/orders.types';

const addressSchema = z.object({
  label: z.string().optional(),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  country: z.string().min(1),
});

export const checkoutSchema = z.object({
  body: z.object({
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    couponCode: z.string().optional(),
  }),
  headers: z.object({
    'idempotency-key': z.string().min(1, 'Idempotency key is required for checkout')
  }).passthrough()
});

export const updateFulfillmentSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.nativeEnum(FulfillmentStatus),
    note: z.string().optional(),
  })
});
