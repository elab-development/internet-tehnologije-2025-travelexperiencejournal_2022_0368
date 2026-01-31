import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { adminDb } from '@/lib/firebase/admin';
import { Post, Destination } from '@/lib/types';
import { UserRole } from '@/lib/types';
import EditPostForm from '@/components/posts/EditPostForm';

interface EditPostPageProps {
  params: {
    id: string;
  };
}

// Fetch post data
async function getPostData(postId: string) {
  try {
    const postDoc = await adminDb.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      return null;
    }

    const postData = postDoc.data();

    return {
      postId: postDoc.id,
      ...postData,
      createdAt: postData?.createdAt?.toDate(),
      updatedAt: postData?.updatedAt?.toDate(),
      travelDate: postData?.travelDate?.toDate(),
    } as Post;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Fetch destinations
async function getDestinations() {
  try {
    const snapshot = await adminDb
      .collection('destinations')
      .orderBy('name', 'asc')
      .get();

    const destinations: Destination[] = [];
    snapshot.forEach((doc) => {
      destinations.push({
        destinationId: doc.id,
        ...doc.data(),
      } as Destination);
    });

    return destinations;
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return [];
  }
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const session = await getServerSession(authConfig);

  // Provera autentifikacije
  if (!session) {
    redirect('/login');
  }

  // Učitaj post
  const post = await getPostData(params.id);

  if (!post) {
    notFound();
  }

  // Provera autorizacije
  const isAuthor = session.user.id === post.authorId;
  const isAdmin = session.user.role === UserRole.ADMIN;
  const isEditor = session.user.role === UserRole.EDITOR;
  const canEdit = isAuthor || isAdmin || isEditor;

  if (!canEdit) {
    redirect(`/posts/${params.id}`);
  }

  // Učitaj destinacije
  const destinations = await getDestinations();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <EditPostForm post={post} destinations={destinations} />
    </div>
  );
}