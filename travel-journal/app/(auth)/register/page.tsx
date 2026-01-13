'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Validacija forme
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName) {
      newErrors.displayName = 'Ime je obavezno';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Ime mora imati najmanje 2 karaktera';
    }

    if (!formData.email) {
      newErrors.email = 'Email je obavezan';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Neispravna email adresa';
    }

    if (!formData.password) {
      newErrors.password = 'Lozinka je obavezna';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Lozinka mora imati najmanje 6 karaktera';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Lozinke se ne poklapaju';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Poziv register API-ja
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGeneralError(data.error || 'Greška pri registraciji');
        return;
      }

      // Automatska prijava nakon registracije
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setGeneralError('Registracija uspešna, ali prijava nije uspela. Pokušajte da se prijavite.');
        router.push('/login');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      setGeneralError('Došlo je do greške. Pokušajte ponovo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="Registruj se" subtitle="Kreiraj novi nalog">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General error */}
        {generalError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {generalError}
          </div>
        )}

        {/* Display name */}
        <Input
          label="Ime i prezime"
          type="text"
          placeholder="Marko Marković"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          error={errors.displayName}
          required
        />

        {/* Email */}
        <Input
          label="Email adresa"
          type="email"
          placeholder="ime@primer.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          required
        />

        {/* Password */}
        <Input
          label="Lozinka"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          helperText="Minimalno 6 karaktera"
          required
        />

        {/* Confirm password */}
        <Input
          label="Potvrdi lozinku"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          error={errors.confirmPassword}
          required
        />

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full"
        >
          <UserPlus className="w-5 h-5" />
          Registruj se
        </Button>

        {/* Login link */}
        <p className="text-center text-sm text-gray-600">
          Već imaš nalog?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Prijavi se
          </Link>
        </p>
      </form>
    </Card>
  );
}