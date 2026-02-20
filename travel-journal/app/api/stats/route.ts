import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    // ── 1. Putopisi po mesecima (poslednjih 12 meseci) ──
    const postsSnapshot = await adminDb
      .collection('posts')
      .where('isPublished', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const postsByMonth: Record<string, number> = {};

    // Inicijalizuj poslednjih 12 meseci sa 0
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      postsByMonth[key] = 0;
    }

    postsSnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      if (createdAt) {
        const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        if (postsByMonth[key] !== undefined) {
          postsByMonth[key]++;
        }
      }
    });

    // ── 2. Top destinacije po broju putopisa ──
    const destinationCounts: Record<string, number> = {};

    postsSnapshot.forEach((doc) => {
      const destId = doc.data().destinationId;
      destinationCounts[destId] = (destinationCounts[destId] || 0) + 1;
    });

    // Dohvati nazive destinacija
    const destIds = Object.keys(destinationCounts);
    const destinationNames: Record<string, string> = {};

    for (let i = 0; i < destIds.length; i += 10) {
      const batch = destIds.slice(i, i + 10);
      const promises = batch.map((id) =>
        adminDb.collection('destinations').doc(id).get()
      );
      const docs = await Promise.all(promises);
      docs.forEach((doc, idx) => {
        if (doc.exists) {
          destinationNames[batch[idx]] = doc.data()?.name || 'Nepoznata';
        }
      });
    }

    const topDestinations = Object.entries(destinationCounts)
      .map(([id, count]) => ({
        name: destinationNames[id] || 'Nepoznata',
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    // ── 3. Prosečne ocene po destinaciji ──
    const ratingsSnapshot = await adminDb.collection('ratings').get();

    const ratingsByDest: Record<string, { total: number; count: number }> = {};

    ratingsSnapshot.forEach((doc) => {
      const data = doc.data();
      const destId = data.destinationId;
      if (!ratingsByDest[destId]) {
        ratingsByDest[destId] = { total: 0, count: 0 };
      }
      ratingsByDest[destId].total += data.score;
      ratingsByDest[destId].count++;
    });

    const destinationRatings = Object.entries(ratingsByDest)
      .map(([id, { total, count }]) => ({
        name: destinationNames[id] || 'Nepoznata',
        averageRating: parseFloat((total / count).toFixed(1)),
        totalRatings: count,
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    // ── 4. Opšta statistika ──
    const usersSnapshot = await adminDb.collection('users').get();
    const commentsSnapshot = await adminDb.collection('comments').get();
    const destinationsSnapshot = await adminDb.collection('destinations').get();

    const generalStats = {
      totalUsers: usersSnapshot.size,
      totalPosts: postsSnapshot.size,
      totalComments: commentsSnapshot.size,
      totalDestinations: destinationsSnapshot.size,
      totalRatings: ratingsSnapshot.size,
    };

    // ── 5. Korisnici po rolama ──
    const usersByRole: Record<string, number> = {
      user: 0,
      editor: 0,
      admin: 0,
    };

    usersSnapshot.forEach((doc) => {
      const role = doc.data().role || 'user';
      usersByRole[role] = (usersByRole[role] || 0) + 1;
    });

    return NextResponse.json(
      {
        postsByMonth,
        topDestinations,
        destinationRatings,
        generalStats,
        usersByRole,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju statistike' },
      { status: 500 }
    );
  }
}
