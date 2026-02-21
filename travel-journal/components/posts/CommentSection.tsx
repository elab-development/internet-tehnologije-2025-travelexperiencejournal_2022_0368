'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Comment, User } from '@/lib/types';
import { MessageSquare, Send } from 'lucide-react';

type SerializableComment = Omit<Comment, 'createdAt' | 'updatedAt'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

interface CommentSectionProps {
  postId: string;
  comments: SerializableComment[];
  commentAuthors: Record<string, Pick<User, 'uid' | 'displayName'>>;
  currentUserId?: string;
}

export default function CommentSection({
  postId,
  comments: initialComments,
  commentAuthors,
  currentUserId,
}: CommentSectionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!session) {
      setError('Morate biti prijavljeni da biste komentarisali');
      return;
    }

    if (!newComment.trim()) {
      setError('Komentar ne može biti prazan');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content: newComment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri dodavanju komentara');
      }

      // Refresh stranicu da bi se prikazao novi komentar
      setNewComment('');
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card
      title={`Komentari (${comments.length})`}
      subtitle="Podeli svoje mišljenje ili postavi pitanje"
    >
      <div className="space-y-6">
        {/* Forma za novi komentar */}
        {session ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Napiši komentar..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmitting}
            />

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              <Send className="w-4 h-4" />
              Objavi komentar
            </Button>
          </form>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-gray-600">
              Morate biti prijavljeni da biste komentarisali
            </p>
          </div>
        )}

        {/* Lista komentara */}
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Još nema komentara</p>
            <p className="text-sm text-gray-400 mt-1">
              Budi prvi koji će komentarisati!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const author = commentAuthors[comment.authorId];
              return (
                <div
                  key={comment.commentId}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  {/* Autor i datum */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {author?.displayName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {author?.displayName || 'Nepoznat korisnik'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Sadržaj komentara */}
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}