export const dynamic = 'force-dynamic';

import { adminDb } from '@/lib/firebase/admin';
import { Destination } from '@/lib/types';
import Card from '@/components/ui/Card';
import noSSR from 'next/dynamic';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

// Dynamic import — Leaflet ne radi na serveru
const DestinationMap = noSSR(
  () => import('@/components/map/DestinationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Učitavanje mape...</p>
      </div>
    ),
  }
);

// Dates serialized to ISO strings so the data can safely cross the
// server → client component boundary (Next.js cannot serialize Date objects).
interface SerializableDestination extends Omit<Destination, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

async function getDestinations(): Promise<SerializableDestination[]> {
  try {
    const snapshot = await adminDb
      .collection('destinations')
      .orderBy('name', 'asc')
      .get();

    const destinations: SerializableDestination[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      destinations.push({
        destinationId: doc.id,
        name: data.name,
        country: data.country,
        description: data.description,
        createdBy: data.createdBy,
        averageRating: data.averageRating || 0,
        imageURL: data.imageURL || '',
        imageAttribution: data.imageAttribution || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        createdAt: data.createdAt?.toDate()?.toISOString() ?? '',
        updatedAt: data.updatedAt?.toDate()?.toISOString() ?? '',
      });
    });

    return destinations;
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return [];
  }
}

export default async function DestinationsPage() {
  const destinations: SerializableDestination[] = await getDestinations();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Mapa destinacija
          </h1>
          <p className="text-gray-600 mt-1">
            Istraži sve destinacije naše zajednice
          </p>
        </div>
        <Link href="/destinations/create">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Nova destinacija
          </button>
        </Link>
      </div>

      {/* Legenda */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="font-medium text-gray-700">Legenda:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-600 inline-block"></span>
            <span>4.5+ Odlično</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
            <span>3.5+ Vrlo dobro</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
            <span>2.5+ Dobro</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
            <span>&lt;2.5 Slabije</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-500 inline-block"></span>
            <span>Bez ocena</span>
          </div>
        </div>
      </Card>

      {/* Mapa */}
      <DestinationMap destinations={destinations as any} height="500px" />

      {/* Lista destinacija ispod mape */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Sve destinacije ({destinations.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {destinations.map((dest) => (
            <Card key={dest.destinationId} hoverable>
              {dest.imageURL && (
                <div className="h-32 -mx-6 -mt-4 mb-3 overflow-hidden rounded-t-lg">
                  <img
                    src={dest.imageURL}
                    alt={dest.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="font-semibold text-gray-900">{dest.name}</h3>
              <p className="text-sm text-gray-600">{dest.country}</p>
              {dest.averageRating && dest.averageRating > 0 && (
                <div className="flex items-center gap-1 mt-1 text-sm text-yellow-600">
                  <span>★</span>
                  <span>{dest.averageRating.toFixed(1)}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                {dest.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
