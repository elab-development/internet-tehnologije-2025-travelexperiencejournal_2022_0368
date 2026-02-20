'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Destination } from '@/lib/types';

interface DestinationFilterProps {
  destinations: Destination[];
  selectedDestinationId: string;
}

export default function DestinationFilter({
  destinations,
  selectedDestinationId,
}: DestinationFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('destinationId', value);
    } else {
      params.delete('destinationId');
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <select
      value={selectedDestinationId}
      onChange={handleChange}
      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
    >
      <option value="">Sve destinacije</option>
      {destinations.map((dest) => (
        <option key={dest.destinationId} value={dest.destinationId}>
          {dest.name}
        </option>
      ))}
    </select>
  );
}
