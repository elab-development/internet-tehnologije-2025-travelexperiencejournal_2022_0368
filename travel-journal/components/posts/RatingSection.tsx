'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import RatingStars from '@/components/ui/RatingStars';

interface RatingSectionProps {
  destinationId: string;
  destinationName: string;
}

interface RatingState {
  averageRating: number;
  totalRatings: number;
  userRating: number | null;
}

export default function RatingSection({
  destinationId,
  destinationName,
}: RatingSectionProps) {
  const { data: session } = useSession();
  const [ratingState, setRatingState] = useState<RatingState>({
    averageRating: 0,
    totalRatings: 0,
    userRating: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchRatings() {
      try {
        const res = await fetch(
          `/api/ratings?destinationId=${encodeURIComponent(destinationId)}`
        );
        if (res.ok) {
          const data = await res.json();
          setRatingState({
            averageRating: data.averageRating,
            totalRatings: data.totalRatings,
            userRating: data.userRating,
          });
        }
      } catch (error) {
        console.error('Error fetching ratings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRatings();
  }, [destinationId]);

  async function handleRate(score: number) {
    if (!session?.user || isSubmitting) return;

    setIsSubmitting(true);

    // Optimistic update
    const previousState = ratingState;
    const isUpdate = ratingState.userRating !== null;
    const newTotal = isUpdate
      ? ratingState.totalRatings
      : ratingState.totalRatings + 1;
    const totalScore =
      ratingState.averageRating * ratingState.totalRatings -
      (ratingState.userRating ?? 0) +
      score;
    const newAverage =
      newTotal > 0 ? Math.round((totalScore / newTotal) * 10) / 10 : 0;

    setRatingState({
      averageRating: newAverage,
      totalRatings: newTotal,
      userRating: score,
    });

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationId, score }),
      });

      if (!res.ok) {
        // Rollback on failure
        setRatingState(previousState);
      } else {
        const data = await res.json();
        setRatingState((prev) => ({
          ...prev,
          averageRating: data.averageRating,
          totalRatings: data.totalRatings,
        }));
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setRatingState(previousState);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-5 w-24 bg-blue-200 animate-pulse rounded" />
        <div className="h-4 w-16 bg-blue-200 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium text-blue-800">
        Ocena destinacije {destinationName}:
      </p>

      {session?.user ? (
        <div className="flex flex-col gap-1">
          <RatingStars
            rating={ratingState.averageRating}
            userRating={ratingState.userRating ?? undefined}
            totalRatings={ratingState.totalRatings}
            interactive
            onRate={handleRate}
            size="md"
          />
          {ratingState.userRating && (
            <p className="text-xs text-blue-600">
              Vaša ocena: {ratingState.userRating}/5
              {isSubmitting && ' (čuva se...)'}
            </p>
          )}
          {!ratingState.userRating && (
            <p className="text-xs text-blue-600">
              Kliknite na zvezdicu da ocenite
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <RatingStars
            rating={ratingState.averageRating}
            totalRatings={ratingState.totalRatings}
            interactive={false}
            size="md"
          />
          <p className="text-xs text-blue-600">
            <a href="/login" className="underline hover:text-blue-800">
              Prijavite se
            </a>{' '}
            da biste ocenili
          </p>
        </div>
      )}
    </div>
  );
}
