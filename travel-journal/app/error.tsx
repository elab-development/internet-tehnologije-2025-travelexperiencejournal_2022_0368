'use client';

import Button from '@/components/ui/Button';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ✅ Loguj samo message (string), NE ceo Error objekat
    console.error('Dashboard error:', error.message);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Nešto nije u redu
        </h2>
        <p className="text-gray-600 mb-8">
          {/* ✅ Prikaži samo message (string) */}
          {error.message || 'Došlo je do greške pri učitavanju podataka.'}
        </p>
        <Button onClick={reset} variant="primary" size="lg">
          Pokušaj ponovo
        </Button>
      </div>
    </div>
  );
}