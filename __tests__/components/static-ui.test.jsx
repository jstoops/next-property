import { render, screen } from '@testing-library/react';
import Hero from '@/components/Hero';
import InfoBoxes from '@/components/InfoBoxes';
import InfoBox from '@/components/InfoBox';
import Footer from '@/components/Footer';
import Spinner from '@/components/Spinner';
import PropertyHeaderImage from '@/components/PropertyHeaderImage';
import UnreadMessageCount from '@/components/UnreadMessageCount';
import AuthProvider from '@/components/AuthProvider';
import ErrorPage from '@/app/error';
import NotFoundPage from '@/app/not-found';
import LoadingPage from '@/app/loading';
import { GlobalProvider, useGlobalContext } from '@/context/GlobalContext';
import { useSession } from 'next-auth/react';
import getUnreadMessageCount from '@/app/actions/getUnreadMessageCount';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }) => <div data-testid='session'>{children}</div>,
}));

jest.mock('@/app/actions/getUnreadMessageCount', () => jest.fn());

function Count() {
  const { unreadCount, setUnreadCount } = useGlobalContext();
  return (
    <button onClick={() => setUnreadCount(7)}>{unreadCount}</button>
  );
}

describe('static interface', () => {
  it('renders the hero and audience info boxes', () => {
    render(
      <>
        <Hero />
        <InfoBoxes />
        <InfoBox
          heading='Custom'
          buttonInfo={{ text: 'Go', link: '/custom', backgroundColor: 'bg-blue-500' }}
        >
          Custom body
        </InfoBox>
      </>
    );

    expect(
      screen.getByRole('heading', { name: 'Find The Perfect Rental' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Properties' })).toHaveAttribute(
      'href',
      '/properties'
    );
    expect(screen.getByRole('link', { name: 'Add Property' })).toHaveAttribute(
      'href',
      '/properties/add'
    );
    expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('href', '/custom');
    expect(screen.getByRole('heading', { name: 'For Renters' }).parentElement).toHaveClass(
      'bg-gray-100'
    );
  });

  it('renders the footer with the current year', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Properties' })).toHaveAttribute(
      'href',
      '/properties'
    );
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(
      screen.getByText(
        new RegExp(`${new Date().getFullYear()} PropertyPulse`)
      )
    ).toBeInTheDocument();
  });

  it('renders loading indicators and the property header image', () => {
    const { container } = render(
      <>
        <Spinner loading />
        <LoadingPage />
        <PropertyHeaderImage image='https://cdn.example/header.jpg' />
      </>
    );

    expect(screen.getAllByLabelText('Loading Spinner').length).toBeGreaterThan(0);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('header.jpg')
    );
  });

  it('explains errors and missing pages', () => {
    const { unmount } = render(<ErrorPage error={new Error('Database offline')} />);

    expect(screen.getByText('Error: Database offline')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go Home' })).toHaveAttribute('href', '/');
    unmount();

    render(<NotFoundPage />);
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
    expect(
      screen.getByText('The page you are looking for does not exist.')
    ).toBeInTheDocument();
  });

  it('wraps children in the auth session', () => {
    render(
      <AuthProvider>
        <p>Signed in area</p>
      </AuthProvider>
    );

    expect(screen.getByTestId('session')).toHaveTextContent('Signed in area');
  });
});

describe('unread message state', () => {
  beforeEach(() => {
    useSession.mockReset();
    getUnreadMessageCount.mockReset();
  });

  it('hides the badge when there are no unread messages', async () => {
    useSession.mockReturnValue({ data: { user: { id: 'user-1' } } });
    getUnreadMessageCount.mockResolvedValue({ count: 0 });

    render(
      <GlobalProvider>
        <UnreadMessageCount />
      </GlobalProvider>
    );

    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(getUnreadMessageCount).toHaveBeenCalled();
  });

  it('loads and displays the unread count for a signed-in user', async () => {
    useSession.mockReturnValue({ data: { user: { id: 'user-1' } } });
    getUnreadMessageCount.mockResolvedValue({ count: 5 });

    render(
      <GlobalProvider>
        <UnreadMessageCount />
        <Count />
      </GlobalProvider>
    );

    expect(await screen.findAllByText('5')).toHaveLength(2);
  });

  it('does not fetch a count for a guest', () => {
    useSession.mockReturnValue({ data: null });

    render(
      <GlobalProvider>
        <UnreadMessageCount />
      </GlobalProvider>
    );

    expect(getUnreadMessageCount).not.toHaveBeenCalled();
  });
});
