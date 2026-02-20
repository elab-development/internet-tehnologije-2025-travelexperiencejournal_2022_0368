import { render, screen, fireEvent } from '@testing-library/react';
import Input from '@/components/ui/Input';

describe('Input Component', () => {
  it('renderuje label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('prikazuje required zvezdicu kada je required', () => {
    render(<Input label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('ne prikazuje zvezdicu kada nije required', () => {
    render(<Input label="Bio" />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('prikazuje error poruku', () => {
    render(<Input label="Email" error="Email je obavezan" />);
    expect(screen.getByText('Email je obavezan')).toBeInTheDocument();
  });

  it('primenjuje error stil na input', () => {
    render(<Input label="Email" error="Greška" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('prikazuje helper text kada nema greške', () => {
    render(<Input label="Lozinka" helperText="Minimum 6 karaktera" />);
    expect(screen.getByText('Minimum 6 karaktera')).toBeInTheDocument();
  });

  it('ne prikazuje helper text kada postoji greška', () => {
    render(
      <Input
        label="Lozinka"
        helperText="Minimum 6 karaktera"
        error="Prekratka lozinka"
      />
    );
    expect(screen.queryByText('Minimum 6 karaktera')).not.toBeInTheDocument();
    expect(screen.getByText('Prekratka lozinka')).toBeInTheDocument();
  });

  it('prosleđuje value i onChange', () => {
    const handleChange = jest.fn();
    render(
      <Input label="Ime" value="Marko" onChange={handleChange} readOnly />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Marko');
    fireEvent.change(input, { target: { value: 'Ana' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('disabluje input', () => {
    render(<Input label="Email" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('prikazuje placeholder', () => {
    render(<Input label="Email" placeholder="ime@primer.com" />);
    expect(screen.getByPlaceholderText('ime@primer.com')).toBeInTheDocument();
  });
});
