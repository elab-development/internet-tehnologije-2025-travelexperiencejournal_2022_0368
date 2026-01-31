import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { adminDb } from '@/lib/firebase/admin';
import { Post, User, Destination, Comment } from '@/lib/types';
import Card from '@/components/ui/Card';
import PostActions from '@/components/posts/PostActions';
import CommentSection from '@/components/posts/CommentSection';
import { Calendar, MapPin, User as UserIcon, Clock } from 'lucide-react';

interface PostPageProps {
  params: {
    id: string;
  };
}

// Fetch post data
async function getPostData(postId: string) {
  try {
    // Uzmi post
    const postDoc = await adminDb.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      return null;
    }

    const postData = postDoc.data();

    // Uzmi autora
    const authorDoc = await adminDb
      .collection('users')
      .doc(postData!.authorId)
      .get();

    // Uzmi destinaciju
    const destDoc = await adminDb
      .collection('destinations')
      .doc(postData!.destinationId)
      .get();

    // Uzmi komentare
    const commentsSnapshot = await adminDb
      .collection('comments')
      .where('postId', '==', postId)
      .orderBy('createdAt', 'desc')
      .get();

    const comments: Comment[] = [];
    const authorIds = new Set<string>();

    commentsSnapshot.forEach((doc) => {
      const commentData = doc.data();
      authorIds.add(commentData.authorId);
      comments.push({
        commentId: doc.id,
        ...commentData,
        createdAt: commentData.createdAt?.toDate(),
        updatedAt: commentData.updatedAt?.toDate(),
      } as Comment);
    });

    // Uzmi autore komentara
    const commentAuthors: Record<string, User> = {};
    for (const authorId of authorIds) {
      const authorDoc = await adminDb.collection('users').doc(authorId).get();
      if (authorDoc.exists) {
        commentAuthors[authorId] = authorDoc.data() as User;
      }
    }

    return {
      post: {
        postId: postDoc.id,
        ...postData,
        createdAt: postData?.createdAt?.toDate(),
        updatedAt: postData?.updatedAt?.toDate(),
        travelDate: postData?.travelDate?.toDate(),
      } as Post,
      author: authorDoc.exists ? (authorDoc.data() as User) : null,
      destination: destDoc.exists ? (destDoc.data() as Destination) : null,
      comments,
      commentAuthors,
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const session = await getServerSession(authConfig);
  const data = await getPostData(params.id);

  if (!data) {
    notFound();
  }

  const { post, author, destination, comments, commentAuthors } = data;

  // Proveri da li je korisnik autor
  const isAuthor = session?.user?.id === post.authorId;
  const isAdmin = session?.user?.role === 'admin';
  const canEdit = isAuthor || isAdmin;

  // Format datuma
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Glavni sadržaj putopisa */}
      <Card>
        <div className="space-y-6">
          {/* Header sa akcijama */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>

              {/* Meta informacije */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {/* Autor */}
                {author && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {author.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span>{author.displayName}</span>
                  </div>
                )}

                {/* Destinacija */}
                {destination && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {destination.name}, {destination.country}
                    </span>
                  </div>
                )}

                {/* Datum putovanja */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Putovanje: {formatDate(post.travelDate)}</span>
                </div>

                {/* Datum objave */}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Objavljeno: {formatDate(post.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Akcije (Edit/Delete) */}
            {canEdit && (
              <PostActions
                postId={post.postId}
                isAuthor={isAuthor}
                isAdmin={isAdmin}
              />
            )}
          </div>

          {/* Sadržaj */}
          <div className="prose max-w-none">
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </div>
          </div>

          {/* Destinacija info */}
          {destination && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                O destinaciji: {destination.name}
              </h3>
              <p className="text-blue-800 text-sm">{destination.description}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Sekcija za komentare */}
      <div className="mt-8">
        <CommentSection
          postId={post.postId}
          comments={comments}
          commentAuthors={commentAuthors}
          currentUserId={session?.user?.id}
        />
      </div>
    </div>
  );
}