import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import PropertySearchForm from '@/components/PropertySearchForm';

describe('PropertySearchForm', () => {
  let push;

  beforeEach(() => {
    push = jest.fn();
    useRouter.mockReturnValue({ push });
  });

  it('opens the full catalog when the search is empty', async () => {
    const user = userEvent.setup();
    render(<PropertySearchForm />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(push).toHaveBeenCalledWith('/properties');
  });

  it('searches by location and property type', async () => {
    const user = userEvent.setup();
    render(<PropertySearchForm />);

    await user.type(
      screen.getByPlaceholderText('Enter Keywords or Location'),
      'Miami'
    );
    await user.selectOptions(screen.getByLabelText('Property Type'), 'Apartment');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(push).toHaveBeenCalledWith(
      '/properties/search-results?location=Miami&propertyType=Apartment'
    );
  });

  it('searches when only the property type is set', async () => {
    const user = userEvent.setup();
    render(<PropertySearchForm />);

    await user.selectOptions(screen.getByLabelText('Property Type'), 'Studio');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(push).toHaveBeenCalledWith(
      '/properties/search-results?location=&propertyType=Studio'
    );
  });
});
