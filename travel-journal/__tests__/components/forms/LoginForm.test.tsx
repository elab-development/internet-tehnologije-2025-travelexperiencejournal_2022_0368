import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/(auth)/login/page';

// Mocks su automatski učitani iz moduleNameMapper u jest.config.ts

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Login Form', () => {
  it('renderuje formu za prijavu', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Prijavi se' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ime@primer.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('prikazuje grešku za prazan email', async () => {
    const { container } = render(<LoginPage />);

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText('Email je obavezan')).toBeInTheDocument();
    });
  });

  it('prikazuje grešku za neispravan email format', async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('ime@primer.com');
    await user.type(emailInput, 'nevalidan-email');

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText('Neispravna email adresa')).toBeInTheDocument();
    });
  });

  it('prikazuje grešku za kratku lozinku', async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('ime@primer.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, '123');

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(
        screen.getByText('Lozinka mora imati najmanje 6 karaktera')
      ).toBeInTheDocument();
    });
  });

  it('ima link ka registraciji', () => {
    render(<LoginPage />);
    const registerLink = screen.getByText('Registruj se');
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('prikazuje subtitle "Dobrodošli nazad!"', () => {
    render(<LoginPage />);
    expect(screen.getByText('Dobrodošli nazad!')).toBeInTheDocument();
  });
});
