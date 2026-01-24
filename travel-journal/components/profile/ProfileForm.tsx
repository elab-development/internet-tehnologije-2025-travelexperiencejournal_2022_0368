'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Save } from 'lucide-react';

interface ProfileFormProps {
  user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: user.displayName,
    bio: user.bio || '',
    profilePhotoURL: user.profilePhotoURL || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri ažuriranju profila');
      }

      setMessage({ type: 'success', text: 'Profil uspešno ažuriran!' });
      router.refresh();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Message */}
      {message && (
        <div
          className={`px-4 py-3 rounded ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Display Name */}
      <Input
        label="Ime i prezime"
        type="text"
        value={formData.displayName}
        onChange={(e) =>
          setFormData({ ...formData, displayName: e.target.value })
        }
        required
      />

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Biografija
        </label>
        <textarea
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Nešto o tebi..."
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
        />
      </div>

      {/* Profile Photo URL */}
      <Input
        label="URL profilne fotografije"
        type="url"
        placeholder="https://example.com/photo.jpg"
        value={formData.profilePhotoURL}
        onChange={(e) =>
          setFormData({ ...formData, profilePhotoURL: e.target.value })
        }
        helperText="Opciono - unesi URL slike sa interneta"
      />

      {/* Submit button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full"
      >
        <Save className="w-5 h-5" />
        Sačuvaj izmene
      </Button>
    </form>
  );
}