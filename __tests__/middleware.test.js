jest.mock('next-auth/middleware', () => ({
  __esModule: true,
  default: function nextAuthMiddleware() {
    return 'authorized';
  },
}));

import middleware, { config } from '@/middleware';

describe('middleware', () => {
  it('protects the signed-in routes with NextAuth', () => {
    expect(middleware()).toBe('authorized');
    expect(config.matcher).toEqual([
      '/properties/add',
      '/profile',
      '/properties/saved',
      '/messages',
    ]);
  });
});
