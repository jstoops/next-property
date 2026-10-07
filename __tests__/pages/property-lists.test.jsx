import { render, screen } from '@testing-library/react';
import connectDB from '@/config/database';
import Property from '@/models/Property';
import PropertiesPage from '@/app/properties/page';
import FeaturedProperties from '@/components/FeaturedProperties';
import HomeProperties from '@/components/HomeProperties';
import { sampleProperty, thenableQuery } from '../fixtures';

jest.mock('@/config/database', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/models/Property', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe('property lists', () => {
  beforeEach(() => {
    connectDB.mockClear();
    Property.find.mockReset();
    Property.countDocuments.mockReset();
  });

  it('paginates the property catalog', async () => {
    const query = thenableQuery([sampleProperty]);
    Property.find.mockReturnValue(query);
    Property.countDocuments.mockResolvedValue(10);

    render(await PropertiesPage({ searchParams: { page: 2, pageSize: 9 } }));

    expect(connectDB).toHaveBeenCalled();
    expect(query.skip).toHaveBeenCalledWith(9);
    expect(query.limit).toHaveBeenCalledWith(9);
    expect(screen.getByText('Seaside Condo')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('hides pagination when everything fits on one page', async () => {
    Property.find.mockReturnValue(thenableQuery([sampleProperty]));
    Property.countDocuments.mockResolvedValue(9);

    render(await PropertiesPage({ searchParams: {} }));

    expect(screen.queryByText(/Page /)).not.toBeInTheDocument();
  });

  it('shows an empty catalog', async () => {
    Property.find.mockReturnValue(thenableQuery([]));
    Property.countDocuments.mockResolvedValue(0);

    render(await PropertiesPage({ searchParams: {} }));

    expect(screen.getByText('No properties found')).toBeInTheDocument();
  });

  it('loads only featured properties', async () => {
    const query = thenableQuery([sampleProperty]);
    Property.find.mockReturnValue(query);

    render(await FeaturedProperties());

    expect(Property.find).toHaveBeenCalledWith({ is_featured: true });
    expect(query.lean).toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Featured Properties' })).toBeInTheDocument();
    expect(screen.getByText('Seaside Condo')).toBeInTheDocument();
  });

  it('renders nothing when there are no featured properties', async () => {
    Property.find.mockReturnValue(thenableQuery([]));

    const { container } = render(await FeaturedProperties());

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the three most recent properties and a link to the catalog', async () => {
    const query = thenableQuery([sampleProperty]);
    Property.find.mockReturnValue(query);

    render(await HomeProperties());

    expect(Property.find).toHaveBeenCalledWith({});
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(query.limit).toHaveBeenCalledWith(3);
    expect(screen.getByRole('heading', { name: 'Recent Properties' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View All Properties' })).toHaveAttribute(
      'href',
      '/properties'
    );
  });

  it('shows an empty recent-properties message', async () => {
    Property.find.mockReturnValue(thenableQuery([]));

    render(await HomeProperties());

    expect(screen.getByText('No properties found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View All Properties' })).toBeInTheDocument();
  });
});
