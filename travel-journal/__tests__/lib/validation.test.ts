import { updateProfileSchema } from '@/lib/validation/schemas';

describe('Profile Validation', () => {
  it('should reject profile update with short displayName', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('should reject profile with invalid photo URL', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Test User',
      profilePhotoURL: 'not-a-valid-url',
    });
    expect(result.success).toBe(false);
  });

  it('should accept profile with empty optional fields', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Test User',
      bio: '',
      profilePhotoURL: '',
    });
    expect(result.success).toBe(true);
  });

  it('should accept profile with a valid photo URL', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Test User',
      bio: 'Putnik i pisac.',
      profilePhotoURL: 'https://example.com/photo.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('should accept profile without optional fields', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Test User',
    });
    expect(result.success).toBe(true);
  });
});
