import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { adminDb } from '@/lib/firebase/admin';
import { UserRole } from '@/lib/types';
import EditPostClient from '@/components/posts/EditPostClient';  // ← OVAKO!

// NE SME BITI:
// import EditPostForm from '@/components/posts/EditPostForm';  // ❌ LOŠE!

interface EditPostPageProps {
  params: {
    id: string;
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect('/login');
  }

  const postDoc = await adminDb.collection('posts').doc(params.id).get();

  if (!postDoc.exists) {
    redirect('/dashboard');
  }

  const postData = postDoc.data();

  const isAuthor = session.user.id === postData?.authorId;
  const isAdmin = session.user.role === UserRole.ADMIN;
  const isEditor = session.user.role === UserRole.EDITOR;
  const canEdit = isAuthor || isAdmin || isEditor;

  if (!canEdit) {
    redirect(`/posts/${params.id}`);
  }

  return <EditPostClient postId={params.id} />;
}