'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import DeleteModal from '@/components/posts/DeleteModal';
import { Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface PostActionsProps {
  postId: string;
  isAuthor: boolean;
  isAdmin: boolean;
  canDelete: boolean;
}

export default function PostActions({
  postId,
  isAuthor,
  isAdmin,
  canDelete,
}: PostActionsProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="flex gap-2">
      {/* Edit dugme — autor, editor i admin */}
      <Link href={`/posts/${postId}/edit`}>
        <Button variant="secondary" size="sm">
          <Edit className="w-4 h-4" />
          <span className="hidden sm:inline">Uredi</span>
        </Button>
      </Link>

      {/* Delete dugme — samo autor i admin, ne editor */}
      {canDelete && (
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Obriši</span>
        </Button>
      )}

      {showDeleteModal && (
        <DeleteModal
          postId={postId}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => {
            router.push('/dashboard');
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
