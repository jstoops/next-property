import cloudinaryPackage from 'cloudinary';
import cloudinary from '@/config/cloudinary';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('cloudinary config', () => {
  it('configures the client from environment variables', () => {
    expect(cloudinaryPackage.v2.config).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
    });
    expect(cloudinary).toBe(cloudinaryPackage.v2);
  });
});
