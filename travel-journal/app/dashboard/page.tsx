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
  try {
    const snapshot = await adminDb
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const posts: Post[] = [];
    const authorsMap = new Map();
    const destinationsMap = new Map();

    // Prvo skupi sve IDs
    const authorIds = new Set<string>();
    const destinationIds = new Set<string>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isPublished) {
        authorIds.add(data.authorId);
        destinationIds.add(data.destinationId);
        posts.push({
          postId: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          travelDate: data.travelDate?.toDate(),
        } as Post);
      }
    });

    // Batch fetch authors (max 10 po query)
    const authorIdArray = Array.from(authorIds);
    for (let i = 0; i < authorIdArray.length; i += 10) {
      const batch = authorIdArray.slice(i, i + 10);
      const authorsSnap = await adminDb
        .collection('users')
        .where('uid', 'in', batch)
        .get();
      
      authorsSnap.forEach(doc => {
        authorsMap.set(doc.id, doc.data());
      });
    }

    // Batch fetch destinations
    const destIdArray = Array.from(destinationIds);
    for (let i = 0; i < destIdArray.length; i += 10) {
      const batch = destIdArray.slice(i, i + 10);
      const destsSnap = await adminDb
        .collection('destinations')
        .where('destinationId', 'in', batch)
        .get();
      
      destsSnap.forEach(doc => {
        destinationsMap.set(doc.id, doc.data());
      });
    }

    return posts.map(post => ({
      ...post,
      author: authorsMap.get(post.authorId),
      destination: destinationsMap.get(post.destinationId),
    }));
  } catch (error) {
    console.error('Dashboard error:', error);
    return []; // Vraća prazno umesto kraha
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect('/login');
  }

  const posts = await getPosts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dobrodošao, {session.user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Istraži najnovije putopise
          </p>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-gray-500">Nema putopisa</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <PostCard
              key={post.postId}
              post={post}
              author={post.author}
              destination={post.destination}
            />
          ))}
        </div>
      )}
    </div>
  );
}