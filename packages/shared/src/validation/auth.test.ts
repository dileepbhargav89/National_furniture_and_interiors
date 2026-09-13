import { describe, it, expect } from 'vitest';
import { authValidation } from './auth';

describe('authValidation', () => {
  it('validates passwords with special characters including #', () => {
    const validData = {
      fullName: 'Dileep',
      email: 'pinnacledileep777@gmail.com',
      password: 'Niwali8174#',
      confirmPassword: 'Niwali8174#',
      phone: '9109059791',
    };

    const parsed = authValidation.registerSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('rejects passwords without special characters', () => {
    const invalidData = {
      fullName: 'Dileep',
      email: 'pinnacledileep777@gmail.com',
      password: 'Niwali81740',
      confirmPassword: 'Niwali81740',
    };

    const parsed = authValidation.registerSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it('validates 10-digit phone numbers and numbers with country code', () => {
    const raw10Digits = authValidation.phoneSchema.safeParse('9109059791');
    expect(raw10Digits.success).toBe(true);

    const withPlus = authValidation.phoneSchema.safeParse('+919109059791');
    expect(withPlus.success).toBe(true);

    const withSpaces = authValidation.phoneSchema.safeParse('+91 91090 59791');
    expect(withSpaces.success).toBe(true);
  });
});
