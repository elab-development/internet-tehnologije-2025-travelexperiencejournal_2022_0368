export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  back: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
}));

export const usePathname = jest.fn(() => '/');
export const useSearchParams = jest.fn(() => new URLSearchParams());
export const redirect = jest.fn();
