import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import { Post, User, Destination } from '@/lib/types';
import { Calendar, MapPin, Star, User as UserIcon } from 'lucide-react';

interface PostCardProps {
  post: Post;
  author?: User;
  destination?: Destination;
}

export default function PostCard({ post, author, destination }: PostCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Link href={`/posts/${post.postId}`}> {/* ✅ OVAKO - detail stranica */}
      {/* NE: <Link href={`/posts/${post.postId}/edit`}> ❌ LOŠE */}
      <Card hoverable className="h-full">
        {/* Slika destinacije */}
        {destination?.imageURL && (
          <div className="relative h-48 -mx-6 -mt-4 mb-4 overflow-hidden rounded-t-lg">
            <Image
              src={destination.imageURL}
              alt={destination.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {destination.imageAttribution && (
              <p className="absolute bottom-1 right-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded">
                {destination.imageAttribution}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
            {post.title}
          </h3>

          {/* Content preview */}
          <p className="text-gray-600 line-clamp-3">{post.content}</p>

          {/* Meta info */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            {/* Destination */}
            {destination && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>
                  {destination.name}, {destination.country}
                </span>
              </div>
            )}

            {/* Average rating */}
            {destination && destination.averageRating != null && destination.averageRating > 0 && (
              <div className="flex items-center gap-1 text-sm text-yellow-600">
                <Star className="w-4 h-4 fill-yellow-400" />
                <span>{destination.averageRating.toFixed(1)}</span>
              </div>
            )}

            {/* Author */}
            {author && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <UserIcon className="w-4 h-4" />
                <span>{author.displayName}</span>
              </div>
            )}

            {/* Travel date */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Putovanje: {formatDate(post.travelDate)}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}