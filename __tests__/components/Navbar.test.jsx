import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import { getProviders, signIn, signOut, useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getProviders: jest.fn(),
}));

jest.mock('@/components/UnreadMessageCount', () => () => (
  <span data-testid='unread-badge'>2</span>
));

describe('Navbar', () => {
  beforeEach(() => {
    useSession.mockReturnValue({ data: null });
    usePathname.mockReturnValue('/');
    getProviders.mockResolvedValue({
      google: { id: 'google', name: 'Google' },
    });
    signIn.mockClear();
    signOut.mockClear();
  });

  async function renderNavbar() {
    render(<Navbar />);
    await waitFor(() => expect(getProviders).toHaveBeenCalled());
  }

  it('highlights the current page and signs in with Google', async () => {
    const user = userEvent.setup();
    usePathname.mockReturnValue('/properties');
    await renderNavbar();

    expect(screen.getByRole('link', { name: 'Properties' })).toHaveClass('bg-black');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveClass('bg-black');
    expect(screen.queryByRole('link', { name: 'Add Property' })).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: /Login or Register/ }));
    expect(signIn).toHaveBeenCalledWith('google');

    await user.click(screen.getByRole('button', { name: 'Open main menu' }));
    const mobileLinks = screen.getAllByRole('link', { name: 'Properties' });
    expect(mobileLinks).toHaveLength(2);
    expect(mobileLinks[1]).toHaveClass('bg-black');
    expect(screen.getAllByRole('link', { name: 'Home' })[1]).not.toHaveClass('bg-black');
  });

  it('opens the mobile menu for a guest', async () => {
    const user = userEvent.setup();
    await renderNavbar();

    expect(screen.getAllByRole('link', { name: 'Home' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Open main menu' }));

    expect(screen.getAllByRole('link', { name: 'Home' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Login or Register/ }).length).toBeGreaterThan(0);
  });

  it('shows account links and signs the user out', async () => {
    const user = userEvent.setup();
    useSession.mockReturnValue({
      data: {
        user: { name: 'Ada', email: 'ada@example.com', image: 'https://example.com/ada.png' },
      },
    });
    usePathname.mockReturnValue('/properties/add');
    await renderNavbar();

    expect(screen.getByRole('link', { name: 'Add Property' })).toHaveClass('bg-black');
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('2');
    expect(
      screen.getByRole('button', { name: 'View notifications' }).closest('a')
    ).toHaveAttribute('href', '/messages');

    await user.click(screen.getByRole('button', { name: 'Open user menu' }));
    expect(screen.getByRole('menuitem', { name: 'Saved Properties' })).toHaveAttribute(
      'href',
      '/properties/saved'
    );
    await user.click(screen.getByRole('menuitem', { name: 'Saved Properties' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open user menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Your Profile' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open user menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Sign Out' }));

    expect(signOut).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('shows the add-property link in the mobile menu when signed in', async () => {
    const user = userEvent.setup();
    useSession.mockReturnValue({
      data: { user: { name: 'Ada', email: 'ada@example.com' } },
    });
    usePathname.mockReturnValue('/properties/add');
    await renderNavbar();

    await user.click(screen.getByRole('button', { name: 'Open main menu' }));

    const addLinks = screen.getAllByRole('link', { name: 'Add Property' });
    expect(addLinks).toHaveLength(2);
    expect(addLinks[1]).toHaveClass('bg-black');
    expect(screen.getAllByRole('link', { name: 'Home' })[1]).not.toHaveClass('bg-black');
    expect(screen.queryByRole('button', { name: /Login or Register/ })).not.toBeInTheDocument();

    cleanup();
    usePathname.mockReturnValue('/properties');
    await renderNavbar();
    await user.click(screen.getByRole('button', { name: 'Open main menu' }));
    expect(screen.getAllByRole('link', { name: 'Add Property' })[1]).not.toHaveClass(
      'bg-black'
    );
  });
});
