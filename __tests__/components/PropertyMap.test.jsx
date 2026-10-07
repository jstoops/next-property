import { render, screen, waitFor } from '@testing-library/react';
import { fromAddress, setDefaults } from 'react-geocode';
import PropertyMap from '@/components/PropertyMap';
import { sampleProperty } from '../fixtures';

jest.mock('react-geocode', () => ({
  setDefaults: jest.fn(),
  fromAddress: jest.fn(),
}));

jest.mock('react-map-gl/mapbox', () => ({
  __esModule: true,
  default: ({ children, mapboxAccessToken }) => (
    <div data-testid='map' data-token={mapboxAccessToken}>
      {children}
    </div>
  ),
  Marker: ({ children, longitude, latitude }) => (
    <div data-testid='marker' data-lng={longitude} data-lat={latitude}>
      {children}
    </div>
  ),
}));

jest.mock('mapbox-gl', () => ({}));

describe('PropertyMap', () => {
  beforeEach(() => {
    setDefaults.mockClear();
    fromAddress.mockReset();
  });

  it('shows a marker after the address is geocoded', async () => {
    let resolveGeocode;
    fromAddress.mockReturnValue(
      new Promise((resolve) => {
        resolveGeocode = resolve;
      })
    );

    render(<PropertyMap property={sampleProperty} />);

    expect(screen.getByLabelText('Loading Spinner')).toBeInTheDocument();
    expect(setDefaults).toHaveBeenCalledWith({
      key: 'test-geocode-key',
      language: 'en',
      region: 'us',
    });

    resolveGeocode({
      results: [{ geometry: { location: { lat: 25.76, lng: -80.19 } } }],
    });

    expect(await screen.findByTestId('map')).toHaveAttribute(
      'data-token',
      'test-mapbox-token'
    );
    expect(screen.getByTestId('marker')).toHaveAttribute('data-lat', '25.76');
    expect(screen.getByTestId('marker')).toHaveAttribute('data-lng', '-80.19');
    expect(fromAddress).toHaveBeenCalledWith('1 Bay St Miami FL 33101');
  });

  it('reports an address with no geocode results', async () => {
    fromAddress.mockResolvedValue({ results: [] });

    render(<PropertyMap property={sampleProperty} />);

    expect(await screen.findByText('No location data found')).toBeInTheDocument();
  });

  it('reports a geocoding failure', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    fromAddress.mockRejectedValue(new Error('quota'));

    render(<PropertyMap property={sampleProperty} />);

    expect(await screen.findByText('No location data found')).toBeInTheDocument();
    await waitFor(() => expect(console.log).toHaveBeenCalled());
    console.log.mockRestore();
  });
});
