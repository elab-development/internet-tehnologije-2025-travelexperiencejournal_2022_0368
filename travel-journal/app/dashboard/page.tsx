import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { redirect } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';
import { Post, User, Destination } from '@/lib/types';
import PostCard from '@/components/dashboard/PostCard';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { PenSquare } from 'lucide-react';

// ✅ OPTIMIZOVANO - Jedna query sa limit-om
async function getPosts(): Promise<Post[]> {
  try {
    const snapshot = await adminDb
      .collection('posts')
      .where('isPublished', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const posts: Post[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        postId: doc.id,
        title: data.title,
        content: data.content,
        authorId: data.authorId,
        destinationId: data.destinationId,
        travelDate: data.travelDate?.toDate(),
        isPublished: data.isPublished,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Post);
    });

    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// ✅ OPTIMIZOVANO - Batch read sa Promise.all
async function getAuthors(authorIds: string[]): Promise<Record<string, User>> {
  const authors: Record<string, User> = {};
  
  // Ukloni duplikate
  const uniqueIds = [...new Set(authorIds)];
  
  if (uniqueIds.length === 0) return authors;

  try {
    // Batch read (max 10 po batch-u)
    const batchSize = 10;
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      
      const promises = batch.map(id => 
        adminDb.collection('users').doc(id).get()
      );
      
      const docs = await Promise.all(promises);
      
      docs.forEach((doc, index) => {
        if (doc.exists) {
          const data = doc.data();
          authors[batch[index]] = {
            uid: doc.id,
            email: data?.email || '',
            displayName: data?.displayName || 'Unknown',
            bio: data?.bio || '',
            profilePhotoURL: data?.profilePhotoURL || '',
            role: data?.role || 'user',
            createdAt: data?.createdAt?.toDate() || new Date(),
            updatedAt: data?.updatedAt?.toDate() || new Date(),
          } as User;
        }
      });
    }
  } catch (error) {
    console.error('Error fetching authors:', error);
  }

  return authors;
}

// ✅ OPTIMIZOVANO - Batch read sa Promise.all
async function getDestinations(
  destinationIds: string[]
): Promise<Record<string, Destination>> {
  const destinations: Record<string, Destination> = {};
  
  // Ukloni duplikate
  const uniqueIds = [...new Set(destinationIds)];
  
  if (uniqueIds.length === 0) return destinations;

  try {
    // Batch read
    const batchSize = 10;
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      
      const promises = batch.map(id => 
        adminDb.collection('destinations').doc(id).get()
      );
      
      const docs = await Promise.all(promises);
      
      docs.forEach((doc, index) => {
        if (doc.exists) {
          const data = doc.data();
          destinations[batch[index]] = {
            destinationId: doc.id,
            name: data?.name || 'Unknown',
            country: data?.country || 'Unknown',
            description: data?.description || '',
            createdBy: data?.createdBy || '',
            averageRating: data?.averageRating || 0,
            imageURL: data?.imageURL || '',
            imageAttribution: data?.imageAttribution || '',
            createdAt: data?.createdAt?.toDate() || new Date(),
            updatedAt: data?.updatedAt?.toDate() || new Date(),
          } as Destination;
        }
      });
    }
  } catch (error) {
    console.error('Error fetching destinations:', error);
  }

  return destinations;
}

export default async function DashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect('/login');
  }

  // ✅ Fetch posts
  const posts = await getPosts();
  
  // ✅ Extract unique IDs
  const authorIds = [...new Set(posts.map((p) => p.authorId))];
  const destinationIds = [...new Set(posts.map((p) => p.destinationId))];

  // ✅ Batch fetch authors and destinations
  const [authors, destinations] = await Promise.all([
    getAuthors(authorIds),
    getDestinations(destinationIds),
  ]);

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