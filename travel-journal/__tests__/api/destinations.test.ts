import { createDestinationSchema } from '@/lib/validation/schemas';

describe('Destination Validation', () => {
  const validDestination = {
    name: 'Rim',
    country: 'Italija',
    description: 'Večni grad sa bogatom istorijom i kulturom.',
  };

  it('should reject destination with short name', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      name: 'R',
    });
    expect(result.success).toBe(false);
  });

  it('should reject destination without country', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      country: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject destination with short description', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      description: 'Kratko',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid destination data', () => {
    const result = createDestinationSchema.safeParse(validDestination);
    expect(result.success).toBe(true);
  });
});
