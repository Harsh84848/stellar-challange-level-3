import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Stellar Feedback header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Stellar Feedback/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders Connect Freighter Wallet button', () => {
  render(<App />);
  const buttonElement = screen.getByText(/Connect Freighter Wallet/i);
  expect(buttonElement).toBeInTheDocument();
});

test('renders Decentralized Feedback System text', () => {
  render(<App />);
  const textElement = screen.getByText(/Decentralized Feedback System/i);
  expect(textElement).toBeInTheDocument();
});
