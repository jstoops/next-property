import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import PropertyContactForm from '@/components/PropertyContactForm';
import addMessage from '@/app/actions/addMessage';
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

jest.mock('@/app/actions/addMessage', () => jest.fn());

describe('PropertyContactForm', () => {
  beforeEach(() => {
    useSession.mockReturnValue({ data: null });
    addMessage.mockReset();
    toast.error.mockClear();
    toast.success.mockClear();
  });

  it('renders nothing for a guest', () => {
    const { container } = render(
      <PropertyContactForm property={sampleProperty} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('sends a message and confirms it was delivered', async () => {
    const user = userEvent.setup();
    useSession.mockReturnValue({ data: { user: { id: 'user-1' } } });
    addMessage.mockResolvedValue({ submitted: true });

    render(<PropertyContactForm property={sampleProperty} />);

    expect(screen.getByDisplayValue('prop1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('user-2')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Name:'), 'Grace Hopper');
    await user.type(screen.getByLabelText('Email:'), 'grace@example.com');
    await user.type(screen.getByLabelText('Phone:'), '555-0199');
    await user.type(screen.getByLabelText('Message:'), 'Is June open?');
    await user.click(screen.getByRole('button', { name: 'Send Message' }));

    await waitFor(() => {
      expect(
        screen.getByText('Your message has been sent successfully')
      ).toBeInTheDocument();
    });
    expect(addMessage).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Message sent successfully');
  });

  it('shows an error toast when the message is rejected', async () => {
    const user = userEvent.setup();
    useSession.mockReturnValue({ data: { user: { id: 'user-1' } } });
    addMessage.mockResolvedValue({
      error: 'You can not send a message to yourself',
    });

    render(<PropertyContactForm property={sampleProperty} />);
    await user.type(screen.getByLabelText('Name:'), 'Ada');
    await user.type(screen.getByLabelText('Email:'), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Message' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'You can not send a message to yourself'
      );
    });
    expect(
      screen.getByRole('heading', { name: 'Contact Property Manager' })
    ).toBeInTheDocument();
  });
});
