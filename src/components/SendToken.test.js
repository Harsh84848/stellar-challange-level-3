import { render, screen, fireEvent } from '@testing-library/react';
import SendToken from './SendToken';

test('renders SendToken component', () => {
  render(<SendToken />);
  expect(screen.getByText(/Send Token/i)).toBeInTheDocument();
});

test('disables send button while loading', async () => {
  render(<SendToken />);
  const sendButton = screen.getByText(/Send/i);
  fireEvent.click(sendButton);
  expect(sendButton).toBeDisabled();
});

test('displays cached transactions', () => {
  localStorage.setItem(
    'transactions',
    JSON.stringify([
      { hash: '123abc', destination: 'GDEST1', amount: '10' },
      { hash: '456def', destination: 'GDEST2', amount: '20' },
    ])
  );
  render(<SendToken />);
  expect(screen.getByText(/123abc/i)).toBeInTheDocument();
  expect(screen.getByText(/456def/i)).toBeInTheDocument();
});