'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  userRating?: number;
  totalRatings?: number;
  interactive?: boolean;
  onRate?: (score: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export default function RatingStars({
  rating,
  userRating,
  totalRatings,
  interactive = false,
  onRate,
  size = 'md',
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const iconSize = sizeMap[size];
  const activeScore = hoverRating || userRating || 0;
  const displayRating = Math.round(rating);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isUserFilled = interactive
            ? star <= activeScore
            : star <= (userRating ?? 0);
          const isAvgFilled = !interactive && star <= displayRating;

          let fillClass = 'text-gray-300';
          if (interactive) {
            if (star <= activeScore) {
              fillClass = userRating
                ? 'text-blue-500 fill-blue-400'
                : 'text-yellow-400 fill-yellow-400';
            }
          } else {
            if (userRating && star <= userRating) {
              fillClass = 'text-blue-500 fill-blue-400';
            } else if (star <= displayRating) {
              fillClass = 'text-yellow-400 fill-yellow-400';
            }
          }

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate?.(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} disabled:cursor-default focus:outline-none`}
              aria-label={`Oceni ${star} od 5`}
            >
              <Star className={`${iconSize} ${fillClass}`} />
            </button>
          );
        })}
      </div>

      {totalRatings !== undefined && (
        <span className="text-xs text-gray-500">
          {rating > 0 ? `${rating.toFixed(1)} (${totalRatings} ${totalRatings === 1 ? 'ocena' : 'ocena'})` : 'Još nema ocena'}
        </span>
      )}
    </div>
  );
}
