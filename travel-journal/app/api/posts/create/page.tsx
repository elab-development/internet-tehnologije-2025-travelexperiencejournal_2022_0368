'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import { PenSquare, Loader2 } from 'lucide-react';

interface Destination {
  destinationId: string;
  name: string;
  country: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    destinationId: '',
    travelDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Učitaj destinacije
  useEffect(() => {
    async function fetchDestinations() {
      try {
        const response = await fetch('/api/destinations');
        const data = await response.json();
        setDestinations(data.destinations || []);
      } catch (error) {
        console.error('Error fetching destinations:', error);
        setGeneralError('Greška pri učitavanju destinacija');
      } finally {
        setIsLoadingDestinations(false);
      }
    }
    fetchDestinations();
  }, []);

  // Validacija forme
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Naslov je obavezan';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Naslov mora imati najmanje 3 karaktera';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Sadržaj je obavezan';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Sadržaj mora imati najmanje 10 karaktera';
    }

    if (!formData.destinationId) {
      newErrors.destinationId = 'Destinacija je obavezna';
    }

    if (!formData.travelDate) {
      newErrors.travelDate = 'Datum putovanja je obavezan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isPublished: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri kreiranju putopisa');
      }

      // Uspešno kreiran - redirektuj na Dashboard
      router.push('/dashboard');
      router.refresh();
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
        title="Kreiraj novi putopis"
        subtitle="Podeli svoje iskustvo sa zajednicom"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General error */}
          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {generalError}
            </div>
          )}

          {/* Naslov */}
          <Input
            label="Naslov putopisa"
            type="text"
            placeholder="Npr. Magični vikend u Parizu"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            error={errors.title}
            required
          />

          {/* Sadržaj */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sadržaj <span className="text-red-500">*</span>
            </label>
            <textarea
              className={`
                w-full px-4 py-2 
                border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.content ? 'border-red-500' : 'border-gray-300'}
              `}
              rows={10}
              placeholder="Opiši svoje iskustvo, daj savete drugim putnicima..."
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-500">{errors.content}</p>
            )}
          </div>

          {/* Destinacija */}
          {isLoadingDestinations ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <Select
              label="Destinacija"
              options={destinations.map((d) => ({
                value: d.destinationId,
                label: `${d.name}, ${d.country}`,
              }))}
              value={formData.destinationId}
              onChange={(e) =>
                setFormData({ ...formData, destinationId: e.target.value })
              }
              error={errors.destinationId}
              helperText="Izaberi destinaciju o kojoj pišeš"
              required
            />
          )}

          {/* Datum putovanja */}
          <Input
            label="Datum putovanja"
            type="date"
            value={formData.travelDate}
            onChange={(e) =>
              setFormData({ ...formData, travelDate: e.target.value })
            }
            error={errors.travelDate}
            helperText="Kada si posetio ovu destinaciju?"
            required
          />

          {/* Submit button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
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
              <PenSquare className="w-5 h-5" />
              Objavi putopis
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}