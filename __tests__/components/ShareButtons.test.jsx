import { render, screen } from '@testing-library/react';
import ShareButtons from '@/components/ShareButtons';

jest.mock('react-share', () => ({
  FacebookShareButton: ({ url, quote, hashtag, children }) => (
    <button data-testid='facebook' data-url={url} data-quote={quote} data-hashtag={hashtag}>
      {children}
    </button>
  ),
  TwitterShareButton: ({ url, title, hashtags, children }) => (
    <button data-testid='twitter' data-url={url} data-title={title} data-hashtags={hashtags.join(',')}>
      {children}
    </button>
  ),
  WhatsappShareButton: ({ url, title, separator, children }) => (
    <button data-testid='whatsapp' data-url={url} data-title={title} data-separator={separator}>
      {children}
    </button>
  ),
  EmailShareButton: ({ url, subject, body, children }) => (
    <button data-testid='email' data-url={url} data-subject={subject} data-body={body}>
      {children}
    </button>
  ),
  FacebookIcon: () => <span>Facebook</span>,
  TwitterIcon: () => <span>Twitter</span>,
  WhatsappIcon: () => <span>Whatsapp</span>,
  EmailIcon: () => <span>Email</span>,
}));

describe('ShareButtons', () => {
  it('builds a share url and a hashtag from the property type', () => {
    render(
      <ShareButtons
        property={{ _id: 'prop1', name: 'Cabin on the Lake', type: 'Cabin Or Cottage' }}
      />
    );

    const url = 'https://propertypulse.test/properties/prop1';
    expect(screen.getByText('Share This Property:')).toBeInTheDocument();
    expect(screen.getByTestId('facebook')).toHaveAttribute('data-url', url);
    expect(screen.getByTestId('facebook')).toHaveAttribute('data-quote', 'Cabin on the Lake');
    expect(screen.getByTestId('facebook')).toHaveAttribute(
      'data-hashtag',
      '#CabinOrCottageForRent'
    );
    expect(screen.getByTestId('twitter')).toHaveAttribute(
      'data-hashtags',
      'CabinOrCottageForRent'
    );
    expect(screen.getByTestId('whatsapp')).toHaveAttribute('data-separator', ':: ');
    expect(screen.getByTestId('email')).toHaveAttribute(
      'data-body',
      `Check out this property listing: ${url}`
    );
  });
});
