import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import MessageCard from '@/components/MessageCard';
import markMessageAsRead from '@/app/actions/markMessageAsRead';
import deleteMessage from '@/app/actions/deleteMessage';
import getUnreadMessageCount from '@/app/actions/getUnreadMessageCount';
import { GlobalProvider, useGlobalContext } from '@/context/GlobalContext';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('@/app/actions/markMessageAsRead', () => jest.fn());
jest.mock('@/app/actions/deleteMessage', () => jest.fn());
jest.mock('@/app/actions/getUnreadMessageCount', () => jest.fn());

const message = {
  _id: 'm1',
  read: false,
  body: 'Is this still available?',
  email: 'buyer@example.com',
  phone: '555-0100',
  createdAt: '2024-05-01T15:30:00.000Z',
  property: { name: 'Seaside Condo' },
};

function Count() {
  const { unreadCount } = useGlobalContext();
  return <span data-testid='unread'>{unreadCount}</span>;
}

function renderCard(current = message) {
  return render(
    <GlobalProvider>
      <Count />
      <MessageCard message={current} />
    </GlobalProvider>
  );
}

describe('MessageCard', () => {
  beforeEach(() => {
    useSession.mockReturnValue({ data: { user: { id: 'user-1' } } });
    getUnreadMessageCount.mockResolvedValue({ count: 4 });
    markMessageAsRead.mockReset();
    deleteMessage.mockReset();
    toast.success.mockClear();
  });

  it('marks an unread message as read and back to new', async () => {
    const user = userEvent.setup();
    markMessageAsRead.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    renderCard();

    expect(await screen.findByText('New')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('4'));
    expect(screen.getByRole('link', { name: 'buyer@example.com' })).toHaveAttribute(
      'href',
      'mailto:buyer@example.com'
    );
    expect(screen.getByRole('link', { name: '555-0100' })).toHaveAttribute(
      'href',
      'tel:555-0100'
    );
    expect(
      screen.getByText(new Date(message.createdAt).toLocaleString())
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark As Read' }));

    expect(markMessageAsRead).toHaveBeenCalledWith('m1');
    expect(toast.success).toHaveBeenCalledWith('Marked as read');
    expect(screen.queryByText('New')).not.toBeInTheDocument();
    expect(screen.getByTestId('unread')).toHaveTextContent('3');

    await user.click(screen.getByRole('button', { name: 'Mark As New' }));

    expect(toast.success).toHaveBeenCalledWith('Marked as new');
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByTestId('unread')).toHaveTextContent('4');
  });

  it('deletes an unread message and lowers the unread count', async () => {
    const user = userEvent.setup();
    deleteMessage.mockResolvedValue(undefined);
    renderCard();

    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('4'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(deleteMessage).toHaveBeenCalledWith('m1');
    expect(toast.success).toHaveBeenCalledWith('Message Deleted');
    expect(screen.getByText('Deleted message')).toBeInTheDocument();
    expect(screen.getByTestId('unread')).toHaveTextContent('3');
  });

  it('does not change the unread count when a read message is deleted', async () => {
    const user = userEvent.setup();
    deleteMessage.mockResolvedValue(undefined);
    renderCard({ ...message, read: true });

    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('4'));
    expect(screen.queryByText('New')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByTestId('unread')).toHaveTextContent('4');
  });
});
