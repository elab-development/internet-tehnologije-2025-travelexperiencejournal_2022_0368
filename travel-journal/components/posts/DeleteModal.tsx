'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteModalProps {
  postId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteModal({
  postId,
  onClose,
  onSuccess,
}: DeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri brisanju putopisa');
      }

      onSuccess();
    } catch (error: any) {
      setError(error.message);
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Obriši putopis
                </h3>
                <p className="text-sm text-gray-600">
                  Ova akcija je nepovratna
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isDeleting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-700">
              Da li ste sigurni da želite da obrišete ovaj putopis? Svi
              komentari će takođe biti obrisani.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1"
            >
              Otkaži
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="flex-1"
            >
              Obriši
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}