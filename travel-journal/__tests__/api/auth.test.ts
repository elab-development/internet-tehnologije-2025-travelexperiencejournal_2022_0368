import { registerSchema } from '@/lib/validation/schemas';

describe('Register Validation', () => {
  it('should reject empty email', () => {
    const result = registerSchema.safeParse({
      email: '',
      password: 'test123',
      displayName: 'Test User',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'test123',
      displayName: 'Test User',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = registerSchema.safeParse({
      email: 'test@test.com',
      password: '123',
      displayName: 'Test User',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short displayName', () => {
    const result = registerSchema.safeParse({
      email: 'test@test.com',
      password: 'test123',
      displayName: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'test@test.com',
      password: 'test123',
      displayName: 'Test User',
    });
    expect(result.success).toBe(true);
  });
});
