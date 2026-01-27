import Link from 'next/link';
import Button from '@/components/ui/Button';
import { MapPin, Globe, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Travel Experience Journal
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Deli svoja putovanja, inspiriši druge putnike
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button variant="primary" size="lg" className="hover:bg-blue-400">
                  Započni besplatno
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Istraži putopise
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Dokumentuj putovanja</h3>
            <p className="text-gray-600">
              Kreiraj detaljne putopise sa fotografijama i korisnim informacijama
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Istraži destinacije</h3>
            <p className="text-gray-600">
              Pronađi inspiraciju kroz iskustva drugih putnika
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Poveži se</h3>
            <p className="text-gray-600">
              Razmenjuj savete i iskustva sa zajednicom putnika
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}