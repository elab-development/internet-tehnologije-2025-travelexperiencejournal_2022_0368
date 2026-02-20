/// <reference types="jest" />

export const mockGet = jest.fn();
export const mockSet = jest.fn();
export const mockUpdate = jest.fn();
export const mockDelete = jest.fn();
export const mockAdd = jest.fn();
export const mockWhere = jest.fn();
export const mockOrderBy = jest.fn();
export const mockLimit = jest.fn();
export const mockDoc = jest.fn();
export const mockCollection = jest.fn();

const chainable = {
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  get: mockGet,
};

mockCollection.mockReturnValue({
  doc: mockDoc.mockReturnValue({
    get: mockGet,
    set: mockSet,
    update: mockUpdate,
    delete: mockDelete,
  }),
  where: jest.fn().mockReturnValue(chainable),
  orderBy: jest.fn().mockReturnValue(chainable),
  limit: jest.fn().mockReturnValue(chainable),
  add: mockAdd,
  get: mockGet,
});

export const adminDb = {
  collection: mockCollection,
  batch: jest.fn(() => ({
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
};

export const adminAuth = {
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
};
