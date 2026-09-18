import type { Server } from 'node:http';
import express, { type RequestHandler } from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createAuthRoutes } from '../../src/modules/auth/presentation/auth.routes';
import {
  createAuthController,
  type AuthControllerDeps,
} from '../../src/modules/auth/presentation/auth.controller';
import { RegisterUser } from '../../src/modules/auth/application/register-user.use-case';
import { LoginUser } from '../../src/modules/auth/application/login-user.use-case';
import { ForgotPassword } from '../../src/modules/auth/application/forgot-password.use-case';
import { ResetPassword } from '../../src/modules/auth/application/reset-password.use-case';
import { CatalogProductSnapshotProvider } from '../../src/modules/cart/infrastructure/catalog-snapshot.provider';
import { PdfGeneratorAdapter } from '../../src/modules/payments/infrastructure/adapters/pdf-generator.adapter';
import { errorHandlerMiddleware } from '../../src/core/exceptions';
import type { AuthUser } from '../../src/modules/auth/domain/auth-user';
import type {
  IAuthUserRepository,
  IPasswordHasher,
  IRefreshTokenRepository,
  IPermissionResolver,
} from '../../src/modules/auth/application/ports';
import type {
  IProductRepository,
  IInventoryRepository,
} from '../../src/modules/catalog/application/ports';
import type { Product } from '../../src/modules/catalog/domain/catalog.types';

let server: Server;
let baseUrl: string;

// In-memory test store simulating user state across requests
const mockUsersDb: Map<string, AuthUser> = new Map();

const testHasher: IPasswordHasher = {
  hash: async (plain: string) => `hashed_${plain}`,
  verify: async (plain: string, hash: string) => hash === `hashed_${plain}`,
};

const testPermissions: IPermissionResolver = {
  resolvePermissionKeys: async () => ['orders.read_self', 'cart.read_self'],
};

const testUserRepo: IAuthUserRepository = {
  existsByEmail: async (email: string) => {
    for (const u of mockUsersDb.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return true;
    }
    return false;
  },
  create: async (input: {
    email: string;
    passwordHash: string;
    phone?: string | null;
    roleId: string;
    fullName?: string;
  }) => {
    const newUser: AuthUser = {
      id: `usr_${Date.now()}`,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash: input.passwordHash,
      userType: 'CUSTOMER',
      roleId: input.roleId,
      status: 'ACTIVE',
      mfaEnabled: false,
      mfaSecret: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordHistory: [],
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    };
    mockUsersDb.set(newUser.id, newUser);
    return newUser;
  },
  findByEmail: async (email: string) => {
    for (const u of mockUsersDb.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  },
  findById: async (id: string) => mockUsersDb.get(id) ?? null,
  findByPhone: async () => null,
  findByPasswordResetToken: async (token: string) => {
    for (const u of mockUsersDb.values()) {
      if (
        u.passwordResetToken === token &&
        u.passwordResetExpiresAt &&
        u.passwordResetExpiresAt > new Date()
      ) {
        return u;
      }
    }
    return null;
  },
  save: async (user: AuthUser) => {
    mockUsersDb.set(user.id, user);
  },
  setPasswordResetToken: async (userId: string, token: string, expiresAt: Date) => {
    const u = mockUsersDb.get(userId);
    if (u) {
      mockUsersDb.set(userId, {
        ...u,
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      });
    }
  },
  resetPassword: async (userId: string, newHash: string, history: string[]) => {
    const u = mockUsersDb.get(userId);
    if (u) {
      mockUsersDb.set(userId, {
        ...u,
        passwordHash: newHash,
        passwordHistory: history,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      });
    }
  },
  updateLockout: async () => undefined,
  recordSuccessfulLogin: async () => undefined,
  incrementFailedLogins: async () => 1,
  lockAccount: async () => undefined,
  resetFailedLogins: async () => undefined,
  updateLastLogin: async () => undefined,
  updateMfaSecret: async () => undefined,
  enableMfa: async () => undefined,
  disableMfa: async () => undefined,
} as unknown as IAuthUserRepository;

const testRefreshRepo: IRefreshTokenRepository = {
  create: async () => undefined,
  find: async () => null,
  revoke: async () => undefined,
  revokeAllForUser: async () => undefined,
  cleanupExpired: async () => 0,
  countActiveForUser: async () => 0,
} as unknown as IRefreshTokenRepository;

beforeAll(async () => {
  const app = express();
  app.use(express.json());

  const registerUseCase = new RegisterUser(
    testUserRepo,
    testHasher,
    testPermissions,
    async () => 'role-customer',
  );
  const loginUseCase = new LoginUser(testUserRepo, testHasher);
  const forgotPasswordUseCase = new ForgotPassword(testUserRepo);
  const resetPasswordUseCase = new ResetPassword(testUserRepo, testHasher, testRefreshRepo);

  const authController = createAuthController({
    registerUser: registerUseCase,
    loginUser: loginUseCase,
    issueSession: {
      execute: async () => ({
        accessToken: 'mock_jwt_access_token_123',
        refreshToken: 'mock_refresh_token_456',
        refreshTokenExpiresAt: new Date(Date.now() + 86400000),
      }),
    } as unknown as AuthControllerDeps['issueSession'],
    resolveRoleIdForUser: async () => 'role-customer',
    resolveRoleName: async () => 'CUSTOMER',
    setupMfa: {} as unknown as AuthControllerDeps['setupMfa'],
    verifyMfa: {} as unknown as AuthControllerDeps['verifyMfa'],
    refreshToken: {} as unknown as AuthControllerDeps['refreshToken'],
    logoutUser: {} as unknown as AuthControllerDeps['logoutUser'],
    authenticateWithGoogle: {} as unknown as AuthControllerDeps['authenticateWithGoogle'],
    authenticateWithFacebook: {} as unknown as AuthControllerDeps['authenticateWithFacebook'],
    sendPhoneOtp: {} as unknown as AuthControllerDeps['sendPhoneOtp'],
    verifyPhoneOtp: {} as unknown as AuthControllerDeps['verifyPhoneOtp'],
    forgotPassword: forgotPasswordUseCase,
    resetPassword: resetPasswordUseCase,
  });

  const dummyAuthMiddleware: RequestHandler = (req, _res, next) => {
    req.auth = {
      sub: 'patron-e2e-1',
      userType: 'CUSTOMER',
      roleId: 'role-customer',
      roleName: 'CUSTOMER',
      permissions: ['orders.read_self', 'cart.read_self'],
    };
    next();
  };

  const authRoutes = createAuthRoutes(authController, dummyAuthMiddleware);
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandlerMiddleware);

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind server port');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe('E2E Full Business Flow: Registration, Password Recovery, Bespoke Catalog Snapshot, Milestone Billing & GST PDF Invoice', () => {
  const patronEmail = 'vikram@singhaniagroup.in';
  const initialPassword = 'InitialSecurePass123!';
  const recoveredPassword = 'BrandNewMasterPass456!';
  let capturedResetToken = '';

  it('Step 1: Customer registers account via POST /api/v1/auth/register', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: patronEmail,
        password: initialPassword,
        fullName: 'Vikramaditya Singhania',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(patronEmail);
    expect(body.data.accessToken).toBe('mock_jwt_access_token_123');
  });

  it('Step 2: Customer initiates forgot password flow via POST /api/v1/auth/forgot-password', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: patronEmail }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('If an account exists');

    // Retrieve saved reset token from mock DB to simulate email click
    for (const u of mockUsersDb.values()) {
      if (u.email === patronEmail && u.passwordResetToken) {
        capturedResetToken = u.passwordResetToken;
      }
    }
    expect(capturedResetToken).toHaveLength(64);
  });

  it('Step 3: Customer completes password reset via POST /api/v1/auth/reset-password', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: capturedResetToken,
        password: recoveredPassword,
        confirmPassword: recoveredPassword,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('successfully updated');
  });

  it('Step 4: Customer logs in with newly reset password via POST /api/v1/auth/login', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: patronEmail,
        password: recoveredPassword,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('AUTHENTICATED');
    expect(body.data.accessToken).toBe('mock_jwt_access_token_123');
  });

  it('Step 5: Catalog Product Snapshot correctly makes MADE_TO_ORDER bespoke furniture available for cart', async () => {
    const mockProduct: Product = {
      id: 'prod-bespoke-dining-8s',
      name: 'Imperial Teak Dining Table (8-Seater)',
      slug: 'imperial-teak-dining-table-8s',
      sku: 'NFI-TBL-IMP-8S',
      brand: 'National Interiors Atelier',
      categoryId: 'cat-dining',
      categoryIds: ['cat-dining'],
      collectionIds: [],
      roomTypes: ['DINING'],
      styles: ['ROYAL_HERITAGE'],
      primaryMaterial: 'BURMA_TEAK',
      materials: ['BURMA_TEAK', 'BRASS_INLAY'],
      productType: 'MADE_TO_ORDER',
      status: 'PUBLISHED',
      basePrice: { amount: 20000000, currency: 'INR' }, // ₹2,00,000 INR
      taxRate: 18,
      hsnCode: '94036000',
      isCustomizable: true,
      images: [
        {
          url: 'https://images.nfi.com/imperial-table.jpg',
          publicId: 'img-imp-1',
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      variants: [
        {
          variantId: 'var-8seater-walnut',
          sku: 'NFI-TBL-IMP-8S-WLT',
          attributes: [{ name: 'Finish', value: 'Dark Walnut' }],
          priceOverride: null,
          images: [],
          dimensionsOverride: undefined,
          weightOverride: undefined,
          isActive: true,
        },
      ],
      customization: { enabled: true, options: ['Brass Inlay Crest'] },
      dimensions: { length: 240, width: 110, height: 76, unit: 'cm' },
      weight: 85,
      features: ['Hand-carved solid Burma Teak', 'White Glove delivery included'],
      careInstructions: 'Clean with soft dry cloth',
      warranty: '10-year structural warranty',
      tags: ['dining', 'bespoke', 'teak'],
      featured: true,
      sortOrder: 1,
      seo: undefined,
      documents: [],
      shipping: { type: 'WHITE_GLOVE', estimateDays: '21-28 days' },
      assembly: { required: true, type: 'PROFESSIONAL', fee: 0, professionalAvailable: true },
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockProducts = {
      findById: vi.fn(async () => mockProduct),
    } as unknown as IProductRepository;

    // Physical warehouse has 0 finished pieces on shelf (since crafted on commission)
    const mockInventory = {
      findByProduct: vi.fn(async () => [
        {
          id: 'inv-1',
          productId: mockProduct.id,
          variantId: 'var-8seater-walnut',
          warehouseId: 'wh-blr-atelier',
          quantityOnHand: 0,
          quantityReserved: 0,
          quantityAvailable: 0,
          reorderPoint: 0,
          reorderQuantity: 0,
          leadTimeDays: 28,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    } as unknown as IInventoryRepository;

    const snapshotProvider = new CatalogProductSnapshotProvider(mockProducts, mockInventory);
    const snapshot = await snapshotProvider.getSnapshot(mockProduct.id, 'var-8seater-walnut');

    expect(snapshot).not.toBeNull();
    expect(snapshot?.isAvailable).toBe(true);
    expect(snapshot?.sku).toBe('NFI-TBL-IMP-8S-WLT');
    expect(snapshot?.unitPrice).toBe(20000000); // ₹2,00,000 INR
  });

  it('Step 6: B2B Milestone Payment Advance (50%) & Form GST INV-1 PDF Generation', async () => {
    // Total Order Value: ₹2,00,000
    // Advance 50% Milestone Payment: ₹1,00,000 (Base: ₹84,745.76 + CGST 9%: ₹7,627.12 + SGST 9%: ₹7,627.12)
    const pdfGenerator = new PdfGeneratorAdapter();

    const pdfBuffer = await pdfGenerator.generateBuffer({
      invoiceNumber: 'NFI/2026-27/INV-0042',
      orderNumber: 'NFI-ORD-SINGHANIA-001',
      orderId: 'ord_bespoke_singhania_001',
      date: new Date('2026-09-19'),
      amount: 10000000, // ₹1,00,000.00
      currency: 'INR',
      subtotal: 8474576,
      discount: 0,
      cgst: 762712, // 9% CGST
      sgst: 762712, // 9% SGST
      isInterState: false, // Karnataka intra-state
      placeOfSupply: 'Karnataka (Code 29)',
      paymentMode: 'Razorpay UPI / Netbanking (Milestone 50% Advance)',
      paymentStatus: 'PAID',
      billedTo: {
        name: 'Vikramaditya Singhania',
        companyName: 'Singhania Luxury Estates LLP',
        gstin: '29AAAAA0000A1Z5',
        line1: 'Penthouse 32, UB City Heights, Vittal Mallya Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      items: [
        {
          name: 'Imperial Teak Dining Table (8-Seater) — 50% Commission Advance',
          sku: 'NFI-TBL-IMP-8S-WLT',
          hsnCode: '9403',
          quantity: 1,
          unitPrice: 8474576,
          lineTotal: 8474576,
        },
      ],
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // Standard PDF file magic byte check (%PDF-)
    const magicHeader = pdfBuffer.subarray(0, 5).toString('ascii');
    expect(magicHeader).toBe('%PDF-');
  });
});
