import { convertToSerializeableObject } from '@/utils/convertToObject';
import { objectId } from '../fixtures';

describe('convertToSerializeableObject', () => {
  it('returns nullish and non-object values unchanged', () => {
    expect(convertToSerializeableObject(null)).toBeNull();
    expect(convertToSerializeableObject(undefined)).toBeUndefined();
    expect(convertToSerializeableObject('property')).toBe('property');
  });

  it('stringifies object id and date values and leaves plain data alone', () => {
    const createdAt = new Date('2024-05-01T15:30:00.000Z');
    const document = {
      _id: objectId('prop1'),
      name: 'Seaside Condo',
      beds: 2,
      description: null,
      createdAt,
      location: { city: 'Miami' },
    };

    const result = convertToSerializeableObject(document);

    expect(result).toBe(document);
    expect(result._id).toBe('prop1');
    expect(result.name).toBe('Seaside Condo');
    expect(result.beds).toBe(2);
    expect(result.description).toBeNull();
    expect(result.createdAt).toBe(createdAt.toString());
    expect(result.location).toEqual({ city: 'Miami' });
  });
});
