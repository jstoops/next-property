import connectDB from '@/config/database';
import User from '@/models/User';
import { getSessionUser } from '@/utils/getSessionUser';
import { revalidatePath } from 'next/cache';
import bookmarkProperty from '@/app/actions/bookmarkProperty';
import checkBookmarkStatus from '@/app/actions/checkBookmarkStatus';
import { sessionUser } from '../fixtures';

jest.mock('@/config/database', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/utils/getSessionUser', () => ({
  getSessionUser: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

function createUser(ids) {
  const bookmarks = [...ids];

  return {
    bookmarks: {
      includes: (id) => bookmarks.includes(id),
      pull: jest.fn((id) => {
        const index = bookmarks.indexOf(id);
        if (index >= 0) bookmarks.splice(index, 1);
      }),
      push: jest.fn((id) => bookmarks.push(id)),
    },
    save: jest.fn().mockResolvedValue(undefined),
  };
}

describe('bookmark actions', () => {
  beforeEach(() => {
    connectDB.mockClear();
    getSessionUser.mockReset();
    User.findById.mockReset();
    revalidatePath.mockClear();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe('bookmarkProperty', () => {
    it('requires a user id', async () => {
      getSessionUser.mockResolvedValue(null);

      await expect(bookmarkProperty('prop1')).resolves.toEqual({
        error: 'User ID is required',
      });
      expect(User.findById).not.toHaveBeenCalled();
    });

    it('adds a bookmark that is not already saved', async () => {
      const user = createUser([]);
      getSessionUser.mockResolvedValue(sessionUser);
      User.findById.mockResolvedValue(user);

      await expect(bookmarkProperty('prop1')).resolves.toEqual({
        message: 'Bookmark added successfully',
        isBookmarked: true,
      });

      expect(user.bookmarks.push).toHaveBeenCalledWith('prop1');
      expect(user.save).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/properties/saved', 'page');
    });

    it('removes a bookmark that is already saved', async () => {
      const user = createUser(['prop1']);
      getSessionUser.mockResolvedValue(sessionUser);
      User.findById.mockResolvedValue(user);

      await expect(bookmarkProperty('prop1')).resolves.toEqual({
        message: 'Bookmark removed successfully',
        isBookmarked: false,
      });

      expect(user.bookmarks.pull).toHaveBeenCalledWith('prop1');
      expect(user.save).toHaveBeenCalled();
    });

    it('throws when the user record is missing', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      User.findById.mockResolvedValue(null);

      await expect(bookmarkProperty('prop1')).rejects.toThrow();
    });
  });

  describe('checkBookmarkStatus', () => {
    it('requires a user id', async () => {
      getSessionUser.mockResolvedValue({ user: { id: 'user-1' } });

      await expect(checkBookmarkStatus('prop1')).resolves.toEqual({
        error: 'User ID is required',
      });
    });

    it('reports whether the property is in the user bookmarks', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      User.findById.mockResolvedValue({ bookmarks: ['prop1', 'prop2'] });

      await expect(checkBookmarkStatus('prop1')).resolves.toEqual({
        isBookmarked: true,
      });
      await expect(checkBookmarkStatus('prop9')).resolves.toEqual({
        isBookmarked: false,
      });
      expect(User.findById).toHaveBeenCalledWith('user-1');
    });

    it('throws when the user record is missing', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      User.findById.mockResolvedValue(null);

      await expect(checkBookmarkStatus('prop1')).rejects.toThrow();
    });
  });
});
