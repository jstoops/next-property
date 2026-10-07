import { render, screen } from '@testing-library/react';
import Pagination from '@/components/Pagination';

describe('Pagination', () => {
  it('hides the previous link on the first page', () => {
    render(<Pagination page={1} pageSize={9} totalItems={20} />);

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Previous' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/properties?page=2'
    );
  });

  it('shows both links on a middle page', () => {
    render(<Pagination page={2} pageSize={9} totalItems={20} />);

    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      '/properties?page=1'
    );
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/properties?page=3'
    );
  });

  it('hides the next link on the last page', () => {
    render(<Pagination page={3} pageSize={9} totalItems={20} />);

    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Next' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      '/properties?page=2'
    );
  });
});
