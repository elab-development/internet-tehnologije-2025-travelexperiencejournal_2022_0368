import Link from 'next/link';
import Button from '@/components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default function PostNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <FileQuestion className="w-24 h-24 text-gray-300 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Putopis nije pronađen
        </h1>
        <p className="text-gray-600 mb-8">
          Putopis koji tražite ne postoji ili je obrisan.
        </p>
        <Link href="/dashboard">
          <Button variant="primary" size="lg">
            Nazad na Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}