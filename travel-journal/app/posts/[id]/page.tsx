import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { adminDb } from '@/lib/firebase/admin';
import Card from '@/components/ui/Card';
import PostActions from '@/components/posts/PostActions';
import CommentSection from '@/components/posts/CommentSection';
import Image from 'next/image';
import { Calendar, MapPin, Clock } from 'lucide-react';
import RatingSection from '@/components/posts/RatingSection';

interface PostPageProps {
  params: {
    id: string;
  };
}

interface SerializablePost {
  postId: string;
  title: string;
  content: string;
  authorId: string;
  destinationId: string;
  travelDate: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SerializableUser {
  uid: string;
  displayName: string;
}

interface SerializableDestination {
  destinationId: string;
  name: string;
  country: string;
  description: string;
  imageURL?: string;
  imageAttribution?: string;
}

interface SerializableComment {
  commentId: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

async function getPostData(postId: string) {
  try {
    const postDoc = await adminDb.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      return null;
    }

    const postData = postDoc.data();

    // Uzmi autora
    const authorDoc = await adminDb.collection('users').doc(postData!.authorId).get();
    
    // Uzmi destinaciju
    const destDoc = await adminDb.collection('destinations').doc(postData!.destinationId).get();

    // Uzmi komentare
    const commentsSnapshot = await adminDb
      .collection('comments')
      .where('postId', '==', postId)
      .orderBy('createdAt', 'desc')
      .get();

    const comments: SerializableComment[] = [];
    const authorIds = new Set<string>();

    commentsSnapshot.forEach((doc) => {
      const commentData = doc.data();
      authorIds.add(commentData.authorId);
      comments.push({
        commentId: doc.id,
        postId: commentData.postId,
        authorId: commentData.authorId,
        content: commentData.content,
        createdAt: commentData.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: commentData.updatedAt?.toDate().toISOString() || new Date().toISOString(),
      });
    });

    // Uzmi autore komentara
    const commentAuthors: Record<string, SerializableUser> = {};
    for (const authorId of authorIds) {
      const doc = await adminDb.collection('users').doc(authorId).get();
      if (doc.exists) {
        const data = doc.data();
        commentAuthors[authorId] = {
          uid: doc.id,
          displayName: data?.displayName || 'Unknown',
        };
      }
    }

    const authorData = authorDoc.exists ? authorDoc.data() : null;
    const destData = destDoc.exists ? destDoc.data() : null;

    return {
      post: {
        postId: postDoc.id,
        title: postData?.title || '',
        content: postData?.content || '',
        authorId: postData?.authorId || '',
        destinationId: postData?.destinationId || '',
        travelDate: postData?.travelDate?.toDate().toISOString() || new Date().toISOString(),
        isPublished: postData?.isPublished ?? true,
        createdAt: postData?.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: postData?.updatedAt?.toDate().toISOString() || new Date().toISOString(),
      } as SerializablePost,
      author: authorData ? {
        uid: authorDoc.id,
        displayName: authorData.displayName || 'Unknown',
      } as SerializableUser : null,
      destination: destData ? {
        destinationId: destDoc.id,
        name: destData.name || '',
        country: destData.country || '',
        description: destData.description || '',
        imageURL: destData.imageURL || '',
        imageAttribution: destData.imageAttribution || '',
      } as SerializableDestination : null,
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

  const isAuthor = session?.user?.id === post.authorId;
  const isAdmin = session?.user?.role === 'admin';
  const canEdit = isAuthor || isAdmin;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <div className="space-y-6">
          {/* Slika destinacije */}
          {destination?.imageURL && (
            <div className="relative h-64 -mx-6 -mt-4 overflow-hidden rounded-t-lg">
              <Image
                src={destination.imageURL}
                alt={destination.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          )}

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {author && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {author.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span>{author.displayName}</span>
                  </div>
                )}

                {destination && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{destination.name}, {destination.country}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Putovanje: {formatDate(post.travelDate)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Objavljeno: {formatDate(post.createdAt)}</span>
                </div>
              </div>
            </div>

            {canEdit && (
              <PostActions
                postId={post.postId}
                isAuthor={isAuthor}
                isAdmin={isAdmin}
              />
            )}
          </div>

          <div className="prose max-w-none">
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </div>
          </div>

          {destination && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                O destinaciji: {destination.name}
              </h3>
              <p className="text-blue-800 text-sm">{destination.description}</p>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <RatingSection
                  destinationId={destination.destinationId}
                  destinationName={destination.name}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

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