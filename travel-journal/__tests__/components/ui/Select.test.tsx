import { render, screen, fireEvent } from '@testing-library/react';
import Select from '@/components/ui/Select';

const mockOptions = [
  { value: 'paris', label: 'Pariz, Francuska' },
  { value: 'tokyo', label: 'Tokio, Japan' },
  { value: 'belgrade', label: 'Beograd, Srbija' },
];

describe('Select Component', () => {
  it('renderuje label', () => {
    render(<Select label="Destinacija" options={mockOptions} />);
    expect(screen.getByText('Destinacija')).toBeInTheDocument();
  });

  it('prikazuje placeholder opciju "Izaberi..."', () => {
    render(<Select label="Destinacija" options={mockOptions} />);
    expect(screen.getByText('Izaberi...')).toBeInTheDocument();
  });

  it('renderuje sve opcije', () => {
    render(<Select label="Destinacija" options={mockOptions} />);
    expect(screen.getByText('Pariz, Francuska')).toBeInTheDocument();
    expect(screen.getByText('Tokio, Japan')).toBeInTheDocument();
    expect(screen.getByText('Beograd, Srbija')).toBeInTheDocument();
  });

  it('prikazuje error poruku', () => {
    render(
      <Select
        label="Destinacija"
        options={mockOptions}
        error="Destinacija je obavezna"
      />
    );
    expect(screen.getByText('Destinacija je obavezna')).toBeInTheDocument();
  });

  it('prikazuje helper text', () => {
    render(
      <Select
        label="Destinacija"
        options={mockOptions}
        helperText="Izaberi destinaciju"
      />
    );
    expect(screen.getByText('Izaberi destinaciju')).toBeInTheDocument();
  });

  it('poziva onChange handler', () => {
    const handleChange = jest.fn();
    render(
      <Select
        label="Destinacija"
        options={mockOptions}
        onChange={handleChange}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'tokyo' },
    });
    expect(handleChange).toHaveBeenCalled();
  });

  it('prikazuje required zvezdicu', () => {
    render(<Select label="Destinacija" options={mockOptions} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
