import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertyImages from '@/components/PropertyImages';

jest.mock('react-photoswipe-gallery', () => ({
  Gallery: ({ children }) => <div data-testid='gallery'>{children}</div>,
  Item: ({ children }) =>
    children({
      ref: jest.fn(),
      open: () => global.__openGallery(),
    }),
}));

describe('PropertyImages', () => {
  beforeEach(() => {
    global.__openGallery = jest.fn();
  });

  it('renders a single image and opens the gallery', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PropertyImages images={['https://cdn.example/one.jpg']} />
    );

    expect(container.querySelector('.grid')).not.toBeInTheDocument();
    await user.click(container.querySelector('img'));

    expect(global.__openGallery).toHaveBeenCalled();
  });

  it('lays out two images in separate columns', () => {
    const { container } = render(
      <PropertyImages
        images={['https://cdn.example/one.jpg', 'https://cdn.example/two.jpg']}
      />
    );

    expect(container.querySelectorAll('.col-span-1')).toHaveLength(2);
    expect(container.querySelector('.col-span-2')).not.toBeInTheDocument();
  });

  it('lets the third image span both columns', () => {
    const { container } = render(
      <PropertyImages
        images={[
          'https://cdn.example/one.jpg',
          'https://cdn.example/two.jpg',
          'https://cdn.example/three.jpg',
        ]}
      />
    );

    expect(container.querySelectorAll('.col-span-1')).toHaveLength(2);
    expect(container.querySelectorAll('.col-span-2')).toHaveLength(1);
  });
});
