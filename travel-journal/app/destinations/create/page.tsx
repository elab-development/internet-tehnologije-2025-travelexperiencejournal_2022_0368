'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { MapPin, Loader2 } from 'lucide-react';

export default function CreateDestinationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Validacija forme
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Naziv destinacije je obavezan';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Naziv mora imati najmanje 2 karaktera';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Država je obavezna';
    } else if (formData.country.length < 2) {
      newErrors.country = 'Država mora imati najmanje 2 karaktera';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Opis je obavezan';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Opis mora imati najmanje 10 karaktera';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri kreiranju destinacije');
      }

      // Uspešno kreirana
      setSuccessMessage('Destinacija uspešno kreirana!');
      setFormData({ name: '', country: '', description: '' });

      // Redirektuj nakon 2 sekunde
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    } catch (error: any) {
      setGeneralError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading stanje
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Neautentifikovan korisnik
  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card
        title="Dodaj novu destinaciju"
        subtitle="Pomozi zajednici dodavanjem nove destinacije"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}

          {/* General error */}
          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {generalError}
            </div>
          )}

          {/* Naziv destinacije */}
          <Input
            label="Naziv destinacije"
            type="text"
            placeholder="Npr. Pariz"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            error={errors.name}
            required
          />

          {/* Država */}
          <Input
            label="Država"
            type="text"
            placeholder="Npr. Francuska"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            error={errors.country}
            required
          />

          {/* Opis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opis destinacije <span className="text-red-500">*</span>
            </label>
            <textarea
              className={`
                w-full px-4 py-2 
                border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.description ? 'border-red-500' : 'border-gray-300'}
              `}
              rows={6}
              placeholder="Opiši destinaciju, zanimljivosti, preporuke..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Submit button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1"
            >
              Otkaži
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="flex-1"
            >
              <MapPin className="w-5 h-5" />
              Dodaj destinaciju
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}