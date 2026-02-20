import { createCommentSchema } from '@/lib/validation/schemas';

describe('Comment Validation', () => {
  it('should reject comment without postId', () => {
    const result = createCommentSchema.safeParse({
      postId: '',
      content: 'Odličan putopis!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty comment content', () => {
    const result = createCommentSchema.safeParse({
      postId: 'post-123',
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject comment missing required fields', () => {
    const result = createCommentSchema.safeParse({
      postId: 'post-123',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid comment data', () => {
    const result = createCommentSchema.safeParse({
      postId: 'post-123',
      content: 'Odličan putopis!',
    });
    expect(result.success).toBe(true);
  });
});
