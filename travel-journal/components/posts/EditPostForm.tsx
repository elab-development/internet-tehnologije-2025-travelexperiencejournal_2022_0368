'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import { Post, Destination } from '@/lib/types';
import { Save, X } from 'lucide-react';

interface EditPostFormProps {
  post: Post;
  destinations: Destination[];
}

export default function EditPostForm({
  post,
  destinations,
}: EditPostFormProps) {
  const router = useRouter();

  // Format datuma za input type="date"
  const formatDateForInput = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    title: post.title,
    content: post.content,
    destinationId: post.destinationId,
    travelDate: formatDateForInput(post.travelDate),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

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
      const response = await fetch(`/api/posts/${post.postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri ažuriranju putopisa');
      }

      // Uspešno ažuriran - redirektuj na detail stranicu
      router.push(`/posts/${post.postId}`);
      router.refresh();
    } catch (error: any) {
      setGeneralError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      title="Uredi putopis"
      subtitle="Ažuriraj informacije o svom putovanju"
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

        {/* Action buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1"
          >
            <X className="w-5 h-5" />
            Otkaži
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="flex-1"
          >
            <Save className="w-5 h-5" />
            Sačuvaj izmene
          </Button>
        </div>
      </form>
    </Card>
  );
}