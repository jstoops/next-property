import { authOptions } from '@/utils/authOptions';
import connectDB from '@/config/database';
import User from '@/models/User';

jest.mock('@/config/database', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

describe('authOptions', () => {
  beforeEach(() => {
    connectDB.mockClear();
    User.findOne.mockReset();
    User.create.mockReset();
  });

  it('configures the Google provider for offline consent', () => {
    expect(authOptions.providers).toHaveLength(1);
    expect(authOptions.providers[0].id).toBe('google');
    expect(authOptions.providers[0].options.clientId).toBe('test-google-client');
    expect(authOptions.providers[0].options.clientSecret).toBe(
      'test-google-secret'
    );
    expect(authOptions.providers[0].options.authorization.params).toEqual({
      prompt: 'consent',
      access_type: 'offline',
      response_type: 'code',
    });
  });

  it('creates a user with a truncated username on first sign in', async () => {
    User.findOne.mockResolvedValue(null);
    const name = 'A Very Long Display Name Here';

    await expect(
      authOptions.callbacks.signIn({
        profile: {
          email: 'ada@example.com',
          name,
          picture: 'https://example.com/ada.png',
        },
      })
    ).resolves.toBe(true);

    expect(connectDB).toHaveBeenCalled();
    expect(User.findOne).toHaveBeenCalledWith({ email: 'ada@example.com' });
    expect(User.create).toHaveBeenCalledWith({
      email: 'ada@example.com',
      username: name.slice(0, 20),
      image: 'https://example.com/ada.png',
    });
  });

  it('does not create a user who already exists', async () => {
    User.findOne.mockResolvedValue({ _id: 'user-1' });

    await expect(
      authOptions.callbacks.signIn({
        profile: { email: 'ada@example.com', name: 'Ada', picture: 'pic' },
      })
    ).resolves.toBe(true);

    expect(User.create).not.toHaveBeenCalled();
  });

  it('attaches the database user id to the session', async () => {
    User.findOne.mockResolvedValue({
      _id: { toString: () => 'user-1' },
    });
    const session = { user: { email: 'ada@example.com', name: 'Ada' } };

    const result = await authOptions.callbacks.session({ session });

    expect(User.findOne).toHaveBeenCalledWith({ email: 'ada@example.com' });
    expect(result.user.id).toBe('user-1');
    expect(result).toBe(session);
  });
});
