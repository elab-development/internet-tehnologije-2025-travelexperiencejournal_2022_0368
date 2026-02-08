'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import { Save, X, Loader2 } from 'lucide-react';

interface EditPostClientProps {
  postId: string;
}

interface Post {
  postId: string;
  title: string;
  content: string;
  destinationId: string;
  travelDate: string;
}

interface Destination {
  destinationId: string;
  name: string;
  country: string;
}

export default function EditPostClient({ postId }: EditPostClientProps) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    destinationId: '',
    travelDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [postRes, destRes] = await Promise.all([
          fetch(`/api/posts/${postId}`),
          fetch('/api/destinations'),
        ]);

        if (!postRes.ok) throw new Error('Failed to load post');
        if (!destRes.ok) throw new Error('Failed to load destinations');

        const postData = await postRes.json();
        const destData = await destRes.json();

        const travelDate = new Date(postData.post.travelDate);
        const formattedDate = travelDate.toISOString().split('T')[0];

        setPost(postData.post);
        setDestinations(destData.destinations);
        setFormData({
          title: postData.post.title,
          content: postData.post.content,
          destinationId: postData.post.destinationId,
          travelDate: formattedDate,
        });
      } catch (error) {
        console.error('Error loading data:', error);
        setGeneralError('Greška pri učitavanju podataka');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [postId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim() || formData.title.length < 3) {
      newErrors.title = 'Naslov mora imati najmanje 3 karaktera';
    }

    if (!formData.content.trim() || formData.content.length < 10) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri ažuriranju');
      }

      router.push(`/posts/${postId}`);
      router.refresh();
    } catch (error: any) {
      setGeneralError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Učitavanje...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600">Greška pri učitavanju putopisa</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              Nazad na Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card title="Uredi putopis" subtitle="Ažuriraj informacije o svom putovanju">
        <form onSubmit={handleSubmit} className="space-y-6">
          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {generalError}
            </div>
          )}

          <Input
            label="Naslov putopisa"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sadržaj <span className="text-red-500">*</span>
            </label>
            <textarea
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={10}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
          </div>

          <Select
            label="Destinacija"
            options={destinations.map((d) => ({
              value: d.destinationId,
              label: `${d.name}, ${d.country}`,
            }))}
            value={formData.destinationId}
            onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
            error={errors.destinationId}
            required
          />

          <Input
            label="Datum putovanja"
            type="date"
            value={formData.travelDate}
            onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
            error={errors.travelDate}
            required
          />

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
            <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="flex-1">
              <Save className="w-5 h-5" />
              Sačuvaj
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}