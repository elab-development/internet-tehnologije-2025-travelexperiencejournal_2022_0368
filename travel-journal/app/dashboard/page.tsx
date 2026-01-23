import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { redirect } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { Post, User, Destination } from '@/lib/types';
import PostCard from '@/components/dashboard/PostCard';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { PenSquare } from 'lucide-react';

async function getPosts(): Promise<Post[]> {
  const snapshot = await adminDb
    .collection('posts')
    .where('isPublished', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  const posts: Post[] = [];
  snapshot.forEach((doc) => {
    posts.push({
      postId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      travelDate: doc.data().travelDate?.toDate(),
    } as Post);
  });

  return posts;
}

async function getAuthors(authorIds: string[]): Promise<Record<string, User>> {
  const authors: Record<string, User> = {};

  for (const authorId of authorIds) {
    const doc = await adminDb.collection('users').doc(authorId).get();
    if (doc.exists) {
      authors[authorId] = doc.data() as User;
    }
  }

  return authors;
}

async function getDestinations(
  destinationIds: string[]
): Promise<Record<string, Destination>> {
  const destinations: Record<string, Destination> = {};

  for (const destId of destinationIds) {
    const doc = await adminDb.collection('destinations').doc(destId).get();
    if (doc.exists) {
      destinations[destId] = doc.data() as Destination;
    }
  }

  return destinations;
}

export default async function DashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect('/login');
  }

  const posts = await getPosts();
  const authorIds = [...new Set(posts.map((p) => p.authorId))];
  const destinationIds = [...new Set(posts.map((p) => p.destinationId))];

  const authors = await getAuthors(authorIds);
  const destinations = await getDestinations(destinationIds);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dobrodošao, {session.user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Istraži najnovije putopise iz cele zajednice
          </p>
        </div>
        <Link href="/posts/create">
          <Button variant="primary" size="lg">
            <PenSquare className="w-5 h-5" />
            Novi putopis
          </Button>
        </Link>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Još nema objavljenih putopisa.
          </p>
          <Link href="/posts/create">
            <Button variant="primary" size="lg" className="mt-4">
              Kreiraj prvi putopis
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.postId}
              post={post}
              author={authors[post.authorId]}
              destination={destinations[post.destinationId]}
            />
          ))}
        </div>
      )}
    </div>
  );
}