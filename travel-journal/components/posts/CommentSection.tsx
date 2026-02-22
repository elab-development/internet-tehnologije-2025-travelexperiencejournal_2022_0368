'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Comment, User } from '@/lib/types';
import { MessageSquare, Send, Edit2, Trash2, EyeOff, Eye } from 'lucide-react';

type SerializableComment = Omit<Comment, 'createdAt' | 'updatedAt'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

interface CommentSectionProps {
  postId: string;
  comments: SerializableComment[];
  commentAuthors: Record<string, Pick<User, 'uid' | 'displayName'>>;
  currentUserId?: string;
  isEditor?: boolean;
  isAdmin?: boolean;
}

export default function CommentSection({
  postId,
  comments: initialComments,
  commentAuthors,
  currentUserId,
  isEditor,
  isAdmin,
}: CommentSectionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const isModerator = isEditor || isAdmin;

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

      setNewComment('');
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment: SerializableComment) => {
    setEditingId(comment.commentId);
    setEditContent(comment.content);
    setError('');
  };

  const handleSaveEdit = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setComments((prev) =>
        prev.map((c) => (c.commentId === commentId ? { ...c, content: editContent } : c))
      );
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj komentar?')) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleHide = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setComments((prev) =>
        prev.map((c) => (c.commentId === commentId ? { ...c, isHidden: data.isHidden } : c))
      );
    } catch (err: any) {
      setError(err.message);
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
              const isOwn = currentUserId === comment.authorId;
              const canEditComment = isOwn || isModerator;
              const canDeleteComment = isOwn || isModerator;
              const isEditing = editingId === comment.commentId;

              return (
                <div
                  key={comment.commentId}
                  className={`rounded-lg p-4 ${
                    comment.isHidden
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-gray-50'
                  }`}
                >
                  {/* Oznaka za skriveni komentar (vidljiva samo moderatorima) */}
                  {comment.isHidden && isModerator && (
                    <p className="text-xs text-yellow-700 font-semibold mb-2 flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      Komentar je sakriven (vidljiv samo moderatorima)
                    </p>
                  )}

                  <div className="flex items-start justify-between mb-2">
                    {/* Autor i datum */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
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

                    {/* Akcije */}
                    {(canEditComment || canDeleteComment || isModerator) && !isEditing && (
                      <div className="flex items-center gap-1 ml-2">
                        {canEditComment && (
                          <button
                            onClick={() => handleStartEdit(comment)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                            title="Uredi komentar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isModerator && (
                          <button
                            onClick={() => handleToggleHide(comment.commentId)}
                            className="p-1 text-gray-400 hover:text-yellow-600 rounded transition-colors"
                            title={comment.isHidden ? 'Prikaži komentar' : 'Sakrij komentar'}
                          >
                            {comment.isHidden
                              ? <Eye className="w-4 h-4" />
                              : <EyeOff className="w-4 h-4" />
                            }
                          </button>
                        )}
                        {canDeleteComment && (
                          <button
                            onClick={() => handleDelete(comment.commentId)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                            title="Obriši komentar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sadržaj ili forma za izmenu */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(comment.commentId)}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                        >
                          Sačuvaj
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                        >
                          Otkaži
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
