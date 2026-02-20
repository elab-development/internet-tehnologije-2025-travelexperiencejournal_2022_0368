import { NextRequest, NextResponse } from 'next/server';
import { searchPhotos } from '@/lib/external/unsplash';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parametar je obavezan' },
        { status: 400 }
      );
    }

    const perPage = parseInt(searchParams.get('perPage') || '3');
    const photos = await searchPhotos(query, Math.min(perPage, 10));

    const results = photos.map((photo) => ({
      id: photo.id,
      url: photo.urls.regular,
      thumbUrl: photo.urls.small,
      alt: photo.alt_description || query,
      attribution: `Photo by ${photo.user.name} on Unsplash`,
      photographerUrl: photo.user.links.html,
    }));

    return NextResponse.json({ photos: results }, { status: 200 });
  } catch (error) {
    console.error('Unsplash proxy error:', error);
    return NextResponse.json(
      { error: 'Greška pri pretraživanju slika' },
      { status: 500 }
    );
  }
}
