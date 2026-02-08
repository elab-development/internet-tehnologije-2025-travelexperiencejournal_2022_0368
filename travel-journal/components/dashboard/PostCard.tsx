import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Post, User, Destination } from '@/lib/types';
import { Calendar, MapPin, User as UserIcon } from 'lucide-react';

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