import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import BookmarkButton from '@/components/BookmarkButton';
import bookmarkProperty from '@/app/actions/bookmarkProperty';
import checkBookmarkStatus from '@/app/actions/checkBookmarkStatus';
import { sampleProperty } from '../fixtures';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('@/app/actions/bookmarkProperty', () => jest.fn());
jest.mock('@/app/actions/checkBookmarkStatus', () => jest.fn());

describe('BookmarkButton', () => {
  beforeEach(() => {
    useSession.mockReturnValue({ data: null });
    bookmarkProperty.mockReset();
    checkBookmarkStatus.mockReset();
    toast.error.mockClear();
    toast.success.mockClear();
  });

  it('asks a guest to sign in', async () => {
    const user = userEvent.setup();
    render(<BookmarkButton property={sampleProperty} />);

    expect(await screen.findByRole('button', { name: /Bookmark Property/ })).toBeInTheDocument();
    expect(checkBookmarkStatus).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Bookmark Property/ }));

    expect(toast.error).toHaveBeenCalledWith(
      'You need to sign in to bookmark a property'
    );
    expect(bookmarkProperty).not.toHaveBeenCalled();
  });

  it('shows an existing bookmark and removes it', async () => {
    const user = userEvent.setup();
    useSession.mockReturnValue({ data: { user: { id: 'user-1' } } });
    checkBookmarkStatus.mockResolvedValue({ isBookmarked: true });
    bookmarkProperty.mockResolvedValue({
      isBookmarked: false,
      message: 'Bookmark removed successfully',
    });

    render(<BookmarkButton property={sampleProperty} />);

    await user.click(await screen.findByRole('button', { name: /Remove Bookmark/ }));

    expect(checkBookmarkStatus).toHaveBeenCalledWith('prop1');
    expect(bookmarkProperty).toHaveBeenCalledWith('prop1');
    expect(toast.success).toHaveBeenCalledWith('Bookmark removed successfully');
    expect(screen.getByRole('button', { name: /Bookmark Property/ })).toBeInTheDocument();
  });

  it('adds a bookmark and reports action errors', async () => {
    const user = userEvent.setup();
    useSession.mockReturnValue({ data: { user: { id: 'user-1' } } });
    checkBookmarkStatus.mockResolvedValue({ error: 'Could not check bookmark' });
    bookmarkProperty.mockResolvedValue({ error: 'Could not save bookmark' });

    render(<BookmarkButton property={sampleProperty} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Could not check bookmark');
    });

    await user.click(screen.getByRole('button', { name: /Bookmark Property/ }));

    expect(toast.error).toHaveBeenCalledWith('Could not save bookmark');
    expect(toast.success).not.toHaveBeenCalled();
  });
});
