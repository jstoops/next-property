import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import HomePage from '@/app/page';
import MainLayout, { metadata } from '@/app/layout';

jest.mock('@/components/Hero', () => () => <section>Hero section</section>);
jest.mock('@/components/InfoBoxes', () => () => <section>Info section</section>);
jest.mock('@/components/FeaturedProperties', () => () => <section>Featured section</section>);
jest.mock('@/components/HomeProperties', () => () => <section>Recent section</section>);
jest.mock('@/components/Navbar', () => () => <nav>Navbar</nav>);
jest.mock('@/components/Footer', () => () => <footer>Footer</footer>);
jest.mock('@/components/AuthProvider', () => ({ children }) => <div>{children}</div>);
jest.mock('@/context/GlobalContext', () => ({
  GlobalProvider: ({ children }) => <div>{children}</div>,
}));
jest.mock('react-toastify', () => ({
  ToastContainer: () => <div>Toasts</div>,
}));

describe('home page and layout', () => {
  it('composes the home page sections', () => {
    render(<HomePage />);

    expect(screen.getByText('Hero section')).toBeInTheDocument();
    expect(screen.getByText('Info section')).toBeInTheDocument();
    expect(screen.getByText('Featured section')).toBeInTheDocument();
    expect(screen.getByText('Recent section')).toBeInTheDocument();
  });

  it('publishes site metadata and wraps the page shell', () => {
    expect(metadata).toEqual({
      title: 'Property Pulse',
      keywords: 'rental, property, real estate',
      description: 'Find the perfect rental property',
    });

    const html = renderToStaticMarkup(
      <MainLayout>
        <p>Page body</p>
      </MainLayout>
    );

    expect(html).toContain('Navbar');
    expect(html).toContain('Page body');
    expect(html).toContain('Footer');
    expect(html).toContain('Toasts');
  });
});
