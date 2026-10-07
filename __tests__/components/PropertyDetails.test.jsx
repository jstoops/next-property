import { render, screen } from '@testing-library/react';
import PropertyDetails from '@/components/PropertyDetails';
import { sampleProperty } from '../fixtures';

jest.mock('@/components/PropertyMap', () => ({ property }) => (
  <div>Map for {property.name}</div>
));

describe('PropertyDetails', () => {
  it('shows rates, amenities, and the map', () => {
    render(<PropertyDetails property={sampleProperty} />);

    expect(screen.getByRole('heading', { name: 'Seaside Condo' })).toBeInTheDocument();
    expect(
      screen.getByText('1 Bay St, Miami, FL 33101')
    ).toBeInTheDocument();
    expect(
      screen.getByText(`$${sampleProperty.rates.nightly.toLocaleString()}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`$${sampleProperty.rates.weekly.toLocaleString()}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`$${sampleProperty.rates.monthly.toLocaleString()}`)
    ).toBeInTheDocument();
    expect(screen.getByText('Wifi')).toBeInTheDocument();
    expect(screen.getByText('Gym/Fitness Center')).toBeInTheDocument();
    expect(screen.getByText(sampleProperty.description)).toBeInTheDocument();
    expect(screen.getByText('Map for Seaside Condo')).toBeInTheDocument();
  });

  it('shows a missing-rate marker when a rate is not offered', () => {
    render(
      <PropertyDetails
        property={{
          ...sampleProperty,
          rates: {},
          amenities: [],
        }}
      />
    );

    expect(screen.getByText('Nightly').nextElementSibling?.querySelector('svg')).toBeTruthy();
    expect(screen.getByText('Weekly').nextElementSibling?.querySelector('svg')).toBeTruthy();
    expect(screen.getByText('Monthly').nextElementSibling?.querySelector('svg')).toBeTruthy();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });
});
