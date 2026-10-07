import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';
import ProfileProperties from '@/components/ProfileProperties';
import deleteProperty from '@/app/actions/deleteProperty';
import { sampleProperty } from '../fixtures';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn() },
}));

jest.mock('@/app/actions/deleteProperty', () => jest.fn());

const secondProperty = {
  ...sampleProperty,
  _id: 'prop2',
  name: 'Hill House',
};

describe('ProfileProperties', () => {
  beforeEach(() => {
    deleteProperty.mockReset();
    toast.success.mockClear();
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    window.confirm.mockRestore();
  });

  it('links to the listing and its edit page', () => {
    render(<ProfileProperties properties={[sampleProperty]} />);

    expect(screen.getByText('Seaside Condo')).toBeInTheDocument();
    expect(screen.getByText(/1 Bay St Miami FL/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/properties/prop1/edit'
    );
  });

  it('does nothing when deletion is cancelled', async () => {
    const user = userEvent.setup();
    window.confirm.mockReturnValue(false);
    render(<ProfileProperties properties={[sampleProperty]} />);

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(deleteProperty).not.toHaveBeenCalled();
    expect(screen.getByText('Seaside Condo')).toBeInTheDocument();
  });

  it('removes a property after it is deleted', async () => {
    const user = userEvent.setup();
    deleteProperty.mockResolvedValue(undefined);
    render(<ProfileProperties properties={[sampleProperty, secondProperty]} />);

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    expect(deleteProperty).toHaveBeenCalledWith('prop1');
    expect(toast.success).toHaveBeenCalledWith('Property Deleted Successfully');
    expect(screen.queryByText('Seaside Condo')).not.toBeInTheDocument();
    expect(screen.getByText('Hill House')).toBeInTheDocument();
  });
});
