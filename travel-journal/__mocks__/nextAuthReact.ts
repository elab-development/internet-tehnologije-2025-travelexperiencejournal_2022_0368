export const useSession = jest.fn(() => ({
  data: {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@test.com',
      role: 'user',
    },
  },
  status: 'authenticated',
}));

export const signIn = jest.fn();
export const signOut = jest.fn();
