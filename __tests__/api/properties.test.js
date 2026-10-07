/**
 * @jest-environment node
 */
import connectDB from '@/config/database';
import Property from '@/models/Property';
import { GET as listProperties } from '@/app/api/properties/route';
import { GET as getProperty } from '@/app/api/properties/[id]/route';

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

describe('property API routes', () => {
  beforeEach(() => {
    connectDB.mockReset();
    connectDB.mockResolvedValue(undefined);
    Property.find.mockReset();
    Property.findById.mockReset();
  });

  it('returns every property', async () => {
    Property.find.mockResolvedValue([{ name: 'Seaside Condo' }]);

    const response = await listProperties();

    expect(connectDB).toHaveBeenCalled();
    expect(Property.find).toHaveBeenCalledWith({});
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('[object Object]');
  });

  it('returns 500 when listing properties fails', async () => {
    connectDB.mockRejectedValue(new Error('db down'));

    const response = await listProperties();

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Something went wrong');
  });

  it('returns one property by id', async () => {
    Property.findById.mockResolvedValue({ name: 'Seaside Condo' });

    const response = await getProperty({}, { params: { id: 'prop1' } });

    expect(Property.findById).toHaveBeenCalledWith('prop1');
    expect(response.status).toBe(200);
  });

  it('returns 404 when the property does not exist', async () => {
    Property.findById.mockResolvedValue(null);

    const response = await getProperty({}, { params: { id: 'missing' } });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Property not found');
  });

  it('returns 500 when loading one property fails', async () => {
    Property.findById.mockRejectedValue(new Error('bad id'));

    const response = await getProperty({}, { params: { id: 'bad' } });

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Something went wrong');
  });
});
