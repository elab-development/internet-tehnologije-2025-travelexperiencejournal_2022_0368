import { ratingSchema } from '@/lib/validation/schemas';

describe('Rating Validation', () => {
  const validRating = {
    destinationId: 'dest-123',
    score: 4,
  };

  it('should reject rating with score below 1', () => {
    const result = ratingSchema.safeParse({
      ...validRating,
      score: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject rating with score above 5', () => {
    const result = ratingSchema.safeParse({
      ...validRating,
      score: 6,
    });
    expect(result.success).toBe(false);
  });

  it('should reject rating with non-integer score', () => {
    const result = ratingSchema.safeParse({
      ...validRating,
      score: 3.5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject rating without destinationId', () => {
    const result = ratingSchema.safeParse({
      destinationId: '',
      score: 4,
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid rating with score 1', () => {
    const result = ratingSchema.safeParse({ ...validRating, score: 1 });
    expect(result.success).toBe(true);
  });

  it('should accept valid rating with score 5', () => {
    const result = ratingSchema.safeParse({ ...validRating, score: 5 });
    expect(result.success).toBe(true);
  });
});
