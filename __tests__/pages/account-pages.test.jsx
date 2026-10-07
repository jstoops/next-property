import { render, screen } from '@testing-library/react';
import connectDB from '@/config/database';
import Property from '@/models/Property';
import User from '@/models/User';
import Message from '@/models/Message';
import { getSessionUser } from '@/utils/getSessionUser';
import SavedPropertiesPage from '@/app/properties/saved/page';
import ProfilePage from '@/app/profile/page';
import MessagesPage from '@/app/messages/page';
import AddPropertyPage from '@/app/properties/add/page';
import PropertyEditPage from '@/app/properties/[id]/edit/page';
import { objectId, sampleProperty, sessionUser } from '../fixtures';

jest.mock('@/config/database', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/utils/getSessionUser', () => ({
  getSessionUser: jest.fn(),
}));

jest.mock('@/app/actions/deleteProperty', () => jest.fn());
jest.mock('@/app/actions/addProperty', () => jest.fn());
jest.mock('@/app/actions/updateProperty', () => jest.fn());

jest.mock('@/models/Property', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/models/Message', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('@/components/MessageCard', () => ({ message }) => (
  <article>
    <h2>{message.property.name}</h2>
    <p>{message._id}</p>
    <span>{message.sender._id}</span>
  </article>
));

function messageQuery(result) {
  const query = {
    sort: jest.fn(() => query),
    populate: jest.fn(() => query),
    lean: jest.fn().mockResolvedValue(result),
  };
  return query;
}

describe('account pages', () => {
  beforeEach(() => {
    connectDB.mockClear();
    getSessionUser.mockReset();
    getSessionUser.mockResolvedValue(sessionUser);
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('lists saved properties and the empty state', async () => {
    const lean = jest.fn().mockResolvedValue({ bookmarks: [sampleProperty] });
    User.findById.mockReturnValue({ populate: jest.fn(() => ({ lean })) });

    const { unmount } = render(await SavedPropertiesPage());

    expect(User.findById).toHaveBeenCalledWith('user-1');
    expect(screen.getByRole('heading', { name: 'Saved Properties' })).toBeInTheDocument();
    expect(screen.getByText('Seaside Condo')).toBeInTheDocument();
    unmount();

    lean.mockResolvedValue({ bookmarks: [] });
    render(await SavedPropertiesPage());
    expect(screen.getByText('No saved properties')).toBeInTheDocument();
  });

  it('shows the signed-in profile and that user\'s listings', async () => {
    Property.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([sampleProperty]),
    });

    render(await ProfilePage());

    expect(Property.find).toHaveBeenCalledWith({ owner: 'user-1' });
    expect(screen.getByRole('heading', { name: 'Your Profile' })).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByAltText('User')).toHaveAttribute(
      'src',
      expect.stringContaining('ada.png')
    );
    expect(screen.getByText('Seaside Condo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/properties/prop1/edit'
    );
  });

  it('uses the default avatar when the session has no image', async () => {
    getSessionUser.mockResolvedValue({
      ...sessionUser,
      user: { ...sessionUser.user, image: '' },
    });
    Property.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

    render(await ProfilePage());

    const src = screen.getByAltText('User').getAttribute('src');
    expect(src).not.toContain('ada.png');
    expect(src).toBeTruthy();
  });

  it('requires a user id on the profile page', async () => {
    getSessionUser.mockResolvedValue({ user: {}, userId: '' });

    await expect(ProfilePage()).rejects.toThrow('User ID is required');
  });

  it('puts unread messages ahead of read messages', async () => {
    const unread = {
      _id: objectId('unread1'),
      read: false,
      sender: { _id: objectId('sender1'), username: 'Grace' },
      property: { _id: 'prop1', name: 'Seaside Condo' },
    };
    const read = {
      _id: objectId('read1'),
      read: true,
      sender: { _id: objectId('sender2'), username: 'Alan' },
      property: { _id: 'prop2', name: 'Hill House' },
    };
    Message.find
      .mockReturnValueOnce(messageQuery([read]))
      .mockReturnValueOnce(messageQuery([unread]));

    render(await MessagesPage());

    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    expect(headings).toEqual(['Seaside Condo', 'Hill House']);
    expect(screen.getByText('unread1')).toBeInTheDocument();
    expect(screen.getByText('sender1')).toBeInTheDocument();
    expect(Message.find).toHaveBeenNthCalledWith(1, {
      recipient: 'user-1',
      read: true,
    });
    expect(Message.find).toHaveBeenNthCalledWith(2, {
      recipient: 'user-1',
      read: false,
    });
  });

  it('shows an empty inbox', async () => {
    Message.find.mockReturnValue(messageQuery([]));

    render(await MessagesPage());

    expect(screen.getByText('You have no messages')).toBeInTheDocument();
  });

  it('renders the add-property form', () => {
    render(<AddPropertyPage />);

    expect(screen.getByRole('heading', { name: 'Add Property' })).toBeInTheDocument();
    expect(screen.getByLabelText('Property Type')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('eg. Beautiful Apartment In Miami')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Property' })).toBeInTheDocument();
  });

  it('fills the edit form from the saved property', async () => {
    Property.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        ...sampleProperty,
        _id: objectId('prop1'),
      }),
    });

    render(await PropertyEditPage({ params: { id: 'prop1' } }));

    expect(screen.getByRole('heading', { name: 'Edit Property' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('eg. Beautiful Apartment In Miami')).toHaveValue(
      'Seaside Condo'
    );
    expect(screen.getByLabelText('Description')).toHaveValue(sampleProperty.description);
    expect(screen.getByPlaceholderText('City')).toHaveValue('Miami');
    expect(screen.getByLabelText('Beds')).toHaveValue(2);
    expect(screen.getByLabelText('Weekly')).toHaveValue(900);
    expect(screen.getByLabelText('Nightly')).toHaveValue(150);
    expect(screen.getByLabelText('Seller Email')).toHaveValue('ada@example.com');
    expect(screen.getByLabelText('Wifi')).toBeChecked();
    expect(screen.getByLabelText('Swimming Pool')).not.toBeChecked();
  });

  it('shows a not-found message when the listing cannot be edited', async () => {
    Property.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    render(await PropertyEditPage({ params: { id: 'missing' } }));

    expect(
      screen.getByRole('heading', { name: 'Property Not Found' })
    ).toBeInTheDocument();
  });
});
