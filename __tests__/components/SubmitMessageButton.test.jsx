import { render, screen } from '@testing-library/react';
import SubmitMessageButton from '@/components/SubmitMessageButton';

jest.mock('react-dom', () => {
  const actual = jest.requireActual('react-dom');
  return {
    ...actual,
    useFormStatus: () => ({ pending: global.__formPending }),
  };
});

describe('SubmitMessageButton', () => {
  afterEach(() => {
    global.__formPending = false;
  });

  it('is ready to send when the form is idle', () => {
    global.__formPending = false;
    render(<SubmitMessageButton />);

    expect(screen.getByRole('button', { name: 'Send Message' })).toBeEnabled();
  });

  it('disables itself while the message is sending', () => {
    global.__formPending = true;
    render(<SubmitMessageButton />);

    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
  });
});
