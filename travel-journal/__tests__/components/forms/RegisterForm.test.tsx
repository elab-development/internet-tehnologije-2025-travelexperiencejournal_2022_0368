import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '@/app/(auth)/register/page';

// Mocks su automatski učitani iz moduleNameMapper u jest.config.ts

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Register Form', () => {
  it('renderuje formu za registraciju', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('heading', { name: 'Registruj se' })).toBeInTheDocument();
    expect(screen.getByText('Kreiraj novi nalog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Marko Marković')).toBeInTheDocument();
  });

  it('prikazuje grešku za kratko ime', async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterPage />);

    const nameInput = screen.getByPlaceholderText('Marko Marković');
    await user.type(nameInput, 'A');

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(
        screen.getByText('Ime mora imati najmanje 2 karaktera')
      ).toBeInTheDocument();
    });
  });

  it('prikazuje grešku za nepodudaranje lozinki', async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterPage />);

    const nameInput = screen.getByPlaceholderText('Marko Marković');
    const emailInput = screen.getByPlaceholderText('ime@primer.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(nameInput, 'Marko');
    await user.type(emailInput, 'marko@test.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'drugalozinka');

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(
        screen.getByText('Lozinke se ne poklapaju')
      ).toBeInTheDocument();
    });
  });

  it('prikazuje grešku za prazan email', async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterPage />);

    const nameInput = screen.getByPlaceholderText('Marko Marković');
    await user.type(nameInput, 'Marko');

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText('Email je obavezan')).toBeInTheDocument();
    });
  });

  it('ima link ka prijavi', () => {
    render(<RegisterPage />);
    const loginLink = screen.getByText('Prijavi se');
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('prikazuje helper text za lozinku', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Minimalno 6 karaktera')).toBeInTheDocument();
  });

  it('ima 4 input polja (2 textbox + 2 password)', () => {
    render(<RegisterPage />);
    const inputs = screen.getAllByRole('textbox');
    // textbox = name (type="text") + email (type="email")
    expect(inputs.length).toBe(2);
    // password polja
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    expect(passwordInputs.length).toBe(2);
  });
});
