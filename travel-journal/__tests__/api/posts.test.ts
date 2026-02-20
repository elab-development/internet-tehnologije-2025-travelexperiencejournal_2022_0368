import { createPostSchema } from '@/lib/validation/schemas';

describe('Post Validation', () => {
  const validPost = {
    title: 'Putovanje u Rim',
    content: 'Ovo je sadržaj putopisa koji je dovoljno dugačak.',
    destinationId: 'dest-123',
    travelDate: '2024-06-15',
  };

  it('should reject post with short title', () => {
    const result = createPostSchema.safeParse({
      ...validPost,
      title: 'AB',
    });
    expect(result.success).toBe(false);
  });

  it('should reject post with short content', () => {
    const result = createPostSchema.safeParse({
      ...validPost,
      content: 'Kratko',
    });
    expect(result.success).toBe(false);
  });

  it('should reject post without destinationId', () => {
    const result = createPostSchema.safeParse({
      ...validPost,
      destinationId: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject post without travelDate', () => {
    const result = createPostSchema.safeParse({
      title: 'Putovanje u Rim',
      content: 'Ovo je sadržaj putopisa koji je dovoljno dugačak.',
      destinationId: 'dest-123',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid post data', () => {
    const result = createPostSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });

  it('should accept post with optional isPublished field', () => {
    const result = createPostSchema.safeParse({
      ...validPost,
      isPublished: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublished).toBe(false);
    }
  });
});
