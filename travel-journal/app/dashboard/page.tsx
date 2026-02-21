import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { adminDb } from '@/lib/firebase/admin';
import { Suspense } from 'react';
import Link from 'next/link';
import { PenSquare } from 'lucide-react';

import { Post, User, Destination } from '@/lib/types';
import PostCard from '@/components/dashboard/PostCard';
import DestinationFilter from '@/components/dashboard/DestinationFilter';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

// ✅ OPTIMIZOVANO - Razdvojena query logika (izbegavanje composite index problema)
async function getPosts(destinationId?: string): Promise<Post[]> {
  try {
    let query;

    if (destinationId) {
      // Query sa filterom po destinaciji - zahteva composite index
      query = adminDb
        .collection('posts')
        .where('isPublished', '==', true)
        .where('destinationId', '==', destinationId)
        .orderBy('createdAt', 'desc')
        .limit(10);
    } else {
      // Jednostavan query bez dodatnog filtera
      query = adminDb
        .collection('posts')
        .where('isPublished', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(10);
    }

    const snapshot = await query.get();

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
    throw new Error('Greška pri učitavanju putopisa');
  }
}

// ✅ OPTIMIZOVANO - Batch read sa Promise.all
async function getAuthors(authorIds: string[]): Promise<Record<string, User>> {
  const authors: Record<string, User> = {};

  // Ukloni duplikate
  const uniqueIds = [...new Set(authorIds)];

  if (uniqueIds.length === 0) return authors;

  try {
    // Batch read (max 10 po batch-u zbog Firebase ograničenja)
    const batchSize = 10;
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);

      const promises = batch.map((id) =>
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
    throw new Error('Greška pri učitavanju autora');
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

      const promises = batch.map((id) =>
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
    throw new Error('Greška pri učitavanju destinacija');
  }

  return destinations;
}

// ✅ Sve destinacije za dropdown filter
async function getAllDestinations(): Promise<Destination[]> {
  try {
    const snapshot = await adminDb
      .collection('destinations')
      .orderBy('name', 'asc')
      .get();

    const destinations: Destination[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      destinations.push({
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
      } as Destination);
    });

    return destinations;
  } catch (error) {
    console.error('Error fetching all destinations:', error);
    throw new Error('Greška pri učitavanju liste destinacija');
  }
}

// ✅ Filter Wrapper sa Suspense (izbegavanje hydration problema)
function DestinationFilterWrapper({
  destinations,
  selectedDestinationId,
}: {
  destinations: Destination[];
  selectedDestinationId: string;
}) {
  return (
    <Suspense
      fallback={
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-400"
          disabled
        >
          <option>Učitavanje...</option>
        </select>
      }
    >
      <DestinationFilter
        destinations={destinations}
        selectedDestinationId={selectedDestinationId}
      />
    </Suspense>
  );
}

interface DashboardPageProps {
  searchParams: { destinationId?: string };
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await getServerSession(authConfig);
  const isLoggedIn = !!session;

  const selectedDestinationId = searchParams.destinationId || '';

  try {
    // ✅ Paralelno učitavanje postova i destinacija
    const [posts, allDestinations] = await Promise.all([
      getPosts(selectedDestinationId || undefined),
      getAllDestinations(),
    ]);

    // ✅ Ekstrakcija jedinstvenih ID-jeva
    const authorIds = [...new Set(posts.map((p) => p.authorId))];
    const destinationIds = [...new Set(posts.map((p) => p.destinationId))];

    // ✅ Batch učitavanje autora i destinacija
    const [authors, destinations] = await Promise.all([
      getAuthors(authorIds),
      getDestinations(destinationIds),
    ]);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isLoggedIn
                ? `Dobrodošao, ${session!.user?.name}!`
                : 'Istraži putopise'}
            </h1>
            <p className="text-gray-600 mt-2">
              Istraži najnovije putopise iz cele zajednice
            </p>
          </div>
          {isLoggedIn && (
            <Link href="/posts/create">
              <Button variant="primary" size="lg" className="flex items-center gap-2">
                <PenSquare className="w-5 h-5" />
                Novi putopis
              </Button>
            </Link>
          )}
        </div>

        {/* Filter */}
        <div className="mb-6">
          <DestinationFilterWrapper
            destinations={allDestinations}
            selectedDestinationId={selectedDestinationId}
          />
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">
              {selectedDestinationId
                ? 'Nema putopisa za izabranu destinaciju.'
                : 'Još nema objavljenih putopisa.'}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              {selectedDestinationId
                ? 'Probaj sa drugom destinacijom ili kreiraj prvi putopis za ovu lokaciju.'
                : 'Budi prvi koji će podeliti svoje putno iskustvo!'}
            </p>
            <Link href="/posts/create">
              <Button variant="primary" size="lg" className="inline-flex items-center gap-2">
                <PenSquare className="w-5 h-5" />
                Kreiraj putopis
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Rezultati Count */}
            <div className="mb-4 text-sm text-gray-600">
              {selectedDestinationId ? (
                <>
                  Pronađeno <span className="font-semibold">{posts.length}</span>{' '}
                  {posts.length === 1 ? 'putopis' : 'putopisa'} za{' '}
                  <span className="font-semibold">
                    {allDestinations.find((d) => d.destinationId === selectedDestinationId)?.name}
                  </span>
                </>
              ) : (
                <>
                  Prikazano <span className="font-semibold">{posts.length}</span> najnovijih{' '}
                  {posts.length === 1 ? 'putopis' : 'putopisa'}
                </>
              )}
            </div>

            {/* Grid */}
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
          </>
        )}
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);

    // ✅ Error UI - BEZ event handler-a (samo linkovi)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">⚠</div>
          <h2 className="text-red-800 text-2xl font-bold mb-2">
            Greška pri učitavanju podataka
          </h2>
          <p className="text-red-600 mb-6">
            {error instanceof Error
              ? error.message
              : 'Molimo osvežite stranicu ili pokušajte kasnije.'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {/* ✅ Umesto onClick - koristimo meta refresh */}
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Osveži stranicu
            </a>
            <Link href="/">
              <span className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                Nazad na početnu
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}