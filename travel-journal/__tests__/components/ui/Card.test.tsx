import { render, screen, fireEvent } from '@testing-library/react';
import Card from '@/components/ui/Card';

describe('Card Component', () => {
  it('renderuje children', () => {
    render(<Card><p>Sadržaj kartice</p></Card>);
    expect(screen.getByText('Sadržaj kartice')).toBeInTheDocument();
  });

  it('prikazuje title', () => {
    render(<Card title="Naslov">Sadržaj</Card>);
    expect(screen.getByText('Naslov')).toBeInTheDocument();
  });

  it('prikazuje subtitle', () => {
    render(<Card title="Naslov" subtitle="Podnaslov">Sadržaj</Card>);
    expect(screen.getByText('Podnaslov')).toBeInTheDocument();
  });

  it('prikazuje footer', () => {
    render(<Card footer={<p>Footer tekst</p>}>Sadržaj</Card>);
    expect(screen.getByText('Footer tekst')).toBeInTheDocument();
  });

  it('ne prikazuje header kada nema title ni subtitle', () => {
    const { container } = render(<Card>Sadržaj</Card>);
    expect(container.querySelector('.border-b')).toBeNull();
  });

  it('dodaje hover klasu kada je hoverable', () => {
    const { container } = render(<Card hoverable>Sadržaj</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('hover:shadow-lg', 'cursor-pointer');
  });

  it('ne dodaje hover klasu po defaultu', () => {
    const { container } = render(<Card>Sadržaj</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveClass('cursor-pointer');
  });

  it('poziva onClick handler', () => {
    const handleClick = jest.fn();
    render(<Card onClick={handleClick}>Klikni</Card>);
    fireEvent.click(screen.getByText('Klikni'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('primenjuje custom className', () => {
    const { container } = render(<Card className="mt-4">Sadržaj</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('mt-4');
  });
});
