import { render, screen } from '@testing-library/react';
import connectDB from '@/config/database';
import Property from '@/models/Property';
import SearchResultsPage from '@/app/properties/search-results/page';
import PropertyPage from '@/app/properties/[id]/page';
import { objectId, sampleProperty, thenableQuery } from '../fixtures';

jest.mock('@/config/database', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/models/Property', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('@/components/PropertyMap', () => () => <div>Property map</div>);
jest.mock('@/components/BookmarkButton', () => () => <button>Bookmark</button>);
jest.mock('@/components/ShareButtons', () => () => <div>Share</div>);
jest.mock('@/components/PropertyContactForm', () => () => <div>Contact</div>);
jest.mock('@/components/PropertyImages', () => ({ images }) => (
  <div>Gallery {images.length}</div>
));

describe('search and property detail', () => {
  beforeEach(() => {
    connectDB.mockClear();
    Property.find.mockReset();
    Property.findById.mockReset();
  });

  it('matches location text across listing fields', async () => {
    const query = thenableQuery([sampleProperty]);
    Property.find.mockReturnValue(query);

    render(
      await SearchResultsPage({
        searchParams: { location: 'miami', propertyType: 'All' },
      })
    );

    const matcher = Property.find.mock.calls[0][0];
    expect(matcher.$or.map((clause) => Object.keys(clause)[0])).toEqual([
      'name',
      'description',
      'location.street',
      'location.city',
      'location.state',
      'location.zipcode',
    ]);
    expect(matcher.$or[3]['location.city'].test('Miami Beach')).toBe(true);
    expect(matcher.type).toBeUndefined();
    expect(screen.getByRole('heading', { name: 'Search Results' })).toBeInTheDocument();
    expect(screen.getByText('Seaside Condo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back To Properties/ })).toHaveAttribute(
      'href',
      '/properties'
    );
  });

  it('adds a property type filter and shows an empty result', async () => {
    Property.find.mockReturnValue(thenableQuery([]));

    render(
      await SearchResultsPage({
        searchParams: { location: 'austin', propertyType: 'Apartment' },
      })
    );

    const matcher = Property.find.mock.calls[0][0];
    expect(matcher.type.test('apartment')).toBe(true);
    expect(matcher.type.test('house')).toBe(false);
    expect(screen.getByText('No search results found')).toBeInTheDocument();
  });

  it('shows a property and serializes its id', async () => {
    Property.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        ...sampleProperty,
        _id: objectId('prop1'),
        description: null,
      }),
    });

    render(await PropertyPage({ params: { id: 'prop1' } }));

    expect(Property.findById).toHaveBeenCalledWith('prop1');
    expect(screen.getByRole('heading', { name: 'Seaside Condo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Properties/ })).toHaveAttribute(
      'href',
      '/properties'
    );
    expect(screen.getByText('Gallery 1')).toBeInTheDocument();
    expect(screen.getByText('Property map')).toBeInTheDocument();
  });

  it('shows a not-found message before serializing a missing property', async () => {
    Property.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    render(await PropertyPage({ params: { id: 'missing' } }));

    expect(
      screen.getByRole('heading', { name: 'Property Not Found' })
    ).toBeInTheDocument();
  });
});
