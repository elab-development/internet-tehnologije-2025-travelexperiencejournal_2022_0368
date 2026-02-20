export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@test.com',
    name: 'Test User',
    role: 'user',
  },
};

export const mockAdminSession = {
  user: {
    id: 'admin-user-id',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
  },
};

export const mockGetServerSession = jest.fn();
