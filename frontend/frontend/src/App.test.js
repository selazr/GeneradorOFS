import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login form', () => {
  render(<App />);
  const button = screen.getByText(/Ingresar/i);
  expect(button).toBeInTheDocument();
});
