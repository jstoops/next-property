import { render, screen } from '@testing-library/react';
import PropertyCard from '@/components/PropertyCard';
import FeaturedPropertyCard from '@/components/FeaturedPropertyCard';
import { sampleProperty } from '../fixtures';

function renderCard(Component, rates) {
  render(
    <Component
      property={{
        ...sampleProperty,
        rates,
      }}
    />
  );
}

describe('PropertyCard', () => {
  it('prefers the monthly rate and links to the listing', () => {
    renderCard(PropertyCard, sampleProperty.rates);

    expect(
      screen.getByText(`$${sampleProperty.rates.monthly.toLocaleString()}/mo`)
    ).toBeInTheDocument();
    expect(screen.getByText('Seaside Condo')).toBeInTheDocument();
    expect(screen.getByText('Miami FL')).toBeInTheDocument();
    expect(screen.getByText('Beds')).toBeInTheDocument();
    expect(screen.getByText('Baths')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Details' })[0]).toHaveAttribute(
      'href',
      '/properties/prop1'
    );
  });

  it('falls back to weekly and then nightly rates', () => {
    const { unmount } = render(
      <PropertyCard property={{ ...sampleProperty, rates: { weekly: 900 } }} />
    );
    expect(
      screen.getByText(`$${Number(900).toLocaleString()}/wk`)
    ).toBeInTheDocument();
    unmount();

    render(
      <PropertyCard property={{ ...sampleProperty, rates: { nightly: 150 } }} />
    );
    expect(
      screen.getByText(`$${Number(150).toLocaleString()}/night`)
    ).toBeInTheDocument();
  });

  it('renders no price when every rate is empty', () => {
    render(<PropertyCard property={{ ...sampleProperty, rates: {} }} />);

    expect(screen.queryByText(/\/mo|\/wk|\/night/)).not.toBeInTheDocument();
  });
});

describe('FeaturedPropertyCard', () => {
  it('shows the monthly price and every available rate label', () => {
    renderCard(FeaturedPropertyCard, sampleProperty.rates);

    expect(
      screen.getByText(`$${sampleProperty.rates.monthly.toLocaleString()}/mo`)
    ).toBeInTheDocument();
    expect(screen.getByText('Nightly')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute(
      'href',
      '/properties/prop1'
    );
  });

  it('falls back to weekly, nightly, and an empty rate', () => {
    const { unmount } = render(
      <FeaturedPropertyCard
        property={{ ...sampleProperty, rates: { weekly: 800 } }}
      />
    );
    expect(screen.getByText(`$${Number(800).toLocaleString()}/wk`)).toBeInTheDocument();
    expect(screen.queryByText('Monthly')).not.toBeInTheDocument();
    unmount();

    const { unmount: unmountNightly } = render(
      <FeaturedPropertyCard
        property={{ ...sampleProperty, rates: { nightly: 80 } }}
      />
    );
    expect(
      screen.getByText(`$${Number(80).toLocaleString()}/night`)
    ).toBeInTheDocument();
    unmountNightly();

    render(<FeaturedPropertyCard property={{ ...sampleProperty, rates: {} }} />);
    expect(
      screen.getAllByRole('heading', { level: 3 }).some((heading) => heading.textContent === '$')
    ).toBe(true);
  });
});
