jest.mock('next-auth/next', () => ({
  __esModule: true,
  default: jest.fn(() => 'auth-handler'),
}));

jest.mock('@/utils/authOptions', () => ({
  authOptions: { secret: 'test-secret' },
}));

import NextAuth from 'next-auth/next';
import { authOptions } from '@/utils/authOptions';
import { GET, POST } from '@/app/api/auth/[...nextauth]/route';

describe('NextAuth route', () => {
  it('exports the same handler for GET and POST', () => {
    expect(NextAuth).toHaveBeenCalledWith(authOptions);
    expect(GET).toBe('auth-handler');
    expect(POST).toBe(GET);
  });
});
