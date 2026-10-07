import { getServerSession } from 'next-auth/next';
import { getSessionUser } from '@/utils/getSessionUser';
import { authOptions } from '@/utils/authOptions';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/utils/authOptions', () => ({
  authOptions: { secret: 'test-secret' },
}));

describe('getSessionUser', () => {
  beforeEach(() => {
    getServerSession.mockReset();
  });

  it('returns null when there is no session', async () => {
    getServerSession.mockResolvedValue(null);

    await expect(getSessionUser()).resolves.toBeNull();
    expect(getServerSession).toHaveBeenCalledWith(authOptions);
  });

  it('returns null when the session has no user', async () => {
    getServerSession.mockResolvedValue({});

    await expect(getSessionUser()).resolves.toBeNull();
  });

  it('returns the session user and user id', async () => {
    const user = { id: 'user-1', email: 'ada@example.com', name: 'Ada' };
    getServerSession.mockResolvedValue({ user });

    await expect(getSessionUser()).resolves.toEqual({
      user,
      userId: 'user-1',
    });
  });
});
