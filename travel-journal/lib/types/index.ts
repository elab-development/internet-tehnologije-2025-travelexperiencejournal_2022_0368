// Enumeracije
export enum UserRole {
  USER = 'user',
  EDITOR = 'editor',
  ADMIN = 'admin',
}

// User model
export interface User {
  uid: string;                    // Firebase Auth UID
  email: string;
  displayName: string;
  bio?: string;
  profilePhotoURL?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Destination model
export interface Destination {
  destinationId: string;
  name: string;
  country: string;
  description: string;
  createdBy: string;              // User.uid
  averageRating?: number;         // Izračunato iz Rating-a
  createdAt: Date;
  updatedAt: Date;
}

// Post (Putopis) model
export interface Post {
  postId: string;
  title: string;
  content: string;
  authorId: string;               // User.uid
  destinationId: string;          // Destination.destinationId
  travelDate: Date;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Comment model
export interface Comment {
  commentId: string;
  postId: string;                 // Post.postId
  authorId: string;               // User.uid
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Rating model
export interface Rating {
  ratingId: string;
  destinationId: string;          // Destination.destinationId
  userId: string;                 // User.uid
  score: number;                  // 1-5
  createdAt: Date;
  updatedAt: Date;
}