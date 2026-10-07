import cloudinary from '@/config/cloudinary';
import connectDB from '@/config/database';
import Property from '@/models/Property';
import { getSessionUser } from '@/utils/getSessionUser';
import { revalidatePath } from 'next/cache';
import addProperty from '@/app/actions/addProperty';
import updateProperty from '@/app/actions/updateProperty';
import deleteProperty from '@/app/actions/deleteProperty';
import { buildForm, sessionUser } from '../fixtures';

jest.mock('@/config/database', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/config/cloudinary', () => ({
  __esModule: true,
  default: {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

jest.mock('@/utils/getSessionUser', () => ({
  getSessionUser: jest.fn(),
}));

jest.mock('@/models/Property', () => {
  const PropertyModel = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'new-prop',
    save: PropertyModel.save,
  }));

  PropertyModel.save = jest.fn();
  PropertyModel.findById = jest.fn();
  PropertyModel.findByIdAndUpdate = jest.fn();

  return { __esModule: true, default: PropertyModel };
});

const propertyFields = {
  type: 'Condo',
  name: 'Seaside Condo',
  description: 'Ocean views',
  'location.street': '1 Bay St',
  'location.city': 'Miami',
  'location.state': 'FL',
  'location.zipcode': '33101',
  beds: '2',
  baths: '2',
  square_feet: '1100',
  amenities: ['Wifi', 'Pool'],
  'rates.nightly': '150',
  'rates.weekly': '900',
  'rates.monthly': '3000',
  'seller_info.name': 'Ada',
  'seller_info.email': 'ada@example.com',
  'seller_info.phone': '555-0100',
};

describe('property actions', () => {
  beforeEach(() => {
    connectDB.mockClear();
    getSessionUser.mockReset();
    revalidatePath.mockClear();
    cloudinary.uploader.upload.mockReset();
    cloudinary.uploader.destroy.mockReset();
    Property.save.mockReset();
    Property.save.mockResolvedValue(undefined);
    Property.findById.mockReset();
    Property.findByIdAndUpdate.mockReset();
  });

  describe('addProperty', () => {
    it('requires a signed-in user', async () => {
      getSessionUser.mockResolvedValue(null);

      await expect(addProperty(buildForm(propertyFields))).rejects.toThrow(
        'User ID is required'
      );
      expect(Property.save).not.toHaveBeenCalled();
    });

    it('uploads images, saves the listing, and redirects to it', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      cloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://cdn.example/property.png',
      });
      const photo = {
        name: 'kitchen.png',
        arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer,
      };
      const form = buildForm(propertyFields);
      const originalGetAll = form.getAll.bind(form);
      form.getAll = (name) =>
        name === 'images' ? [photo, { name: '' }] : originalGetAll(name);

      await expect(addProperty(form)).rejects.toThrow(
        'NEXT_REDIRECT:/properties/new-prop'
      );

      expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(1);
      const [dataUrl, options] = cloudinary.uploader.upload.mock.calls[0];
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(options).toEqual({ folder: 'propertypulse' });
      expect(Property).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'user-1',
          name: 'Seaside Condo',
          amenities: ['Wifi', 'Pool'],
          images: ['https://cdn.example/property.png'],
          location: {
            street: '1 Bay St',
            city: 'Miami',
            state: 'FL',
            zipcode: '33101',
          },
          rates: { nightly: '150', weekly: '900', monthly: '3000' },
        })
      );
      expect(Property.save).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('saves a listing without images when none are selected', async () => {
      getSessionUser.mockResolvedValue(sessionUser);

      await expect(addProperty(buildForm(propertyFields))).rejects.toThrow(
        'NEXT_REDIRECT:/properties/new-prop'
      );

      expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
      expect(Property).toHaveBeenCalledWith(
        expect.objectContaining({ images: [] })
      );
    });
  });

  describe('updateProperty', () => {
    it('throws when the session is missing', async () => {
      getSessionUser.mockResolvedValue(null);

      await expect(updateProperty('prop1', buildForm(propertyFields))).rejects.toThrow();
    });

    it('throws when the property record is missing', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      Property.findById.mockResolvedValue(null);

      await expect(updateProperty('missing', buildForm(propertyFields))).rejects.toThrow();
    });

    it('rejects edits from someone who does not own the property', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      Property.findById.mockResolvedValue({
        owner: { toString: () => 'someone-else' },
      });

      await expect(updateProperty('prop1', buildForm(propertyFields))).rejects.toThrow(
        'Current user does not own this property.'
      );
      expect(Property.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('updates an owned property and redirects to it', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      Property.findById.mockResolvedValue({
        owner: { toString: () => sessionUser.userId },
      });
      Property.findByIdAndUpdate.mockResolvedValue({ _id: 'prop1' });

      await expect(updateProperty('prop1', buildForm(propertyFields))).rejects.toThrow(
        'NEXT_REDIRECT:/properties/prop1'
      );

      expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(
        'prop1',
        expect.objectContaining({
          owner: 'user-1',
          type: 'Condo',
          name: 'Seaside Condo',
          amenities: ['Wifi', 'Pool'],
          rates: { weekly: '900', monthly: '3000', nightly: '150' },
          seller_info: {
            name: 'Ada',
            email: 'ada@example.com',
            phone: '555-0100',
          },
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });
  });

  describe('deleteProperty', () => {
    it('requires a signed-in user', async () => {
      getSessionUser.mockResolvedValue(null);

      await expect(deleteProperty('prop1')).rejects.toThrow('User ID is required');
      expect(connectDB).not.toHaveBeenCalled();
    });

    it('throws when the property does not exist', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      Property.findById.mockResolvedValue(null);

      await expect(deleteProperty('missing')).rejects.toThrow('Property Not Found');
    });

    it('throws when the user does not own the property', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      Property.findById.mockResolvedValue({
        owner: { toString: () => 'someone-else' },
      });

      await expect(deleteProperty('prop1')).rejects.toThrow('Unauthorized');
    });

    it('removes cloudinary images and the property', async () => {
      const property = {
        owner: { toString: () => sessionUser.userId },
        images: [
          'https://res.cloudinary.com/demo/image/upload/propertypulse/abc123.jpg',
          'https://res.cloudinary.com/demo/image/upload/propertypulse/def456.png',
        ],
        deleteOne: jest.fn().mockResolvedValue(undefined),
      };
      getSessionUser.mockResolvedValue(sessionUser);
      Property.findById.mockResolvedValue(property);
      cloudinary.uploader.destroy.mockResolvedValue({});

      await deleteProperty('prop1');

      expect(cloudinary.uploader.destroy).toHaveBeenNthCalledWith(
        1,
        'propertypulse/abc123'
      );
      expect(cloudinary.uploader.destroy).toHaveBeenNthCalledWith(
        2,
        'propertypulse/def456'
      );
      expect(property.deleteOne).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('deletes a property that has no images', async () => {
      const property = {
        owner: { toString: () => sessionUser.userId },
        images: [],
        deleteOne: jest.fn().mockResolvedValue(undefined),
      };
      getSessionUser.mockResolvedValue(sessionUser);
      Property.findById.mockResolvedValue(property);

      await deleteProperty('prop1');

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
      expect(property.deleteOne).toHaveBeenCalled();
    });
  });
});
