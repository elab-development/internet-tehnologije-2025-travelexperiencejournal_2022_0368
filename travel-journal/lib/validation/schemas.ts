import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Neispravna email adresa'),
  password: z.string().min(6, 'Lozinka mora imati najmanje 6 karaktera'),
  displayName: z.string().min(2, 'Ime mora imati najmanje 2 karaktera'),
});

export const createPostSchema = z.object({
  title: z.string().min(3, 'Naslov mora imati najmanje 3 karaktera'),
  content: z.string().min(10, 'Sadržaj mora imati najmanje 10 karaktera'),
  destinationId: z.string().min(1, 'Destinacija je obavezna'),
  travelDate: z.string(),
  isPublished: z.boolean().optional(),
});

export const createCommentSchema = z.object({
  postId: z.string().min(1, 'Post ID je obavezan'),
  content: z.string().min(1, 'Sadržaj komentara je obavezan'),
});

export const createDestinationSchema = z.object({
  name: z.string().min(2, 'Naziv mora imati najmanje 2 karaktera'),
  country: z.string().min(2, 'Država je obavezna'),
  description: z.string().min(10, 'Opis mora imati najmanje 10 karaktera'),
});

export const ratingSchema = z.object({
  destinationId: z.string().min(1),
  score: z.number().int().min(1).max(5),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2, 'Ime mora imati najmanje 2 karaktera'),
  bio: z.string().optional(),
  profilePhotoURL: z.string().url().optional().or(z.literal('')),
});
