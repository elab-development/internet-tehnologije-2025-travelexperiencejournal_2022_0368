'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import PostsPerMonthChart from '@/components/charts/PostsPerMonthChart';
import TopDestinationsChart from '@/components/charts/TopDestinationsChart';
import RatingsChart from '@/components/charts/RatingsChart';
import {
  BarChart3,
  Users,
  FileText,
  MessageSquare,
  MapPin,
  Star,
  Loader2,
} from 'lucide-react';

interface StatsData {
  postsByMonth: Record<string, number>;
  topDestinations: { name: string; count: number }[];
  destinationRatings: {
    name: string;
    averageRating: number;
    totalRatings: number;
  }[];
  generalStats: {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    totalDestinations: number;
    totalRatings: number;
  };
  usersByRole: Record<string, number>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Greška pri učitavanju');
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <p className="text-red-600 text-center py-8">{error || 'Greška'}</p>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Korisnici',
      value: stats.generalStats.totalUsers,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Putopisi',
      value: stats.generalStats.totalPosts,
      icon: FileText,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Komentari',
      value: stats.generalStats.totalComments,
      icon: MessageSquare,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      label: 'Destinacije',
      value: stats.generalStats.totalDestinations,
      icon: MapPin,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Ocene',
      value: stats.generalStats.totalRatings,
      icon: Star,
      color: 'bg-red-100 text-red-600',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Statistike platforme
        </h1>
        <p className="text-gray-600 mt-1">
          Pregled aktivnosti i podataka na platformi
        </p>
      </div>

      {/* Stat kartice */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart — putopisi po mesecima */}
        <Card className="lg:col-span-2">
          <PostsPerMonthChart data={stats.postsByMonth} />
        </Card>

        {/* Doughnut — top destinacije */}
        <Card>
          {stats.topDestinations.length > 0 ? (
            <TopDestinationsChart data={stats.topDestinations} />
          ) : (
            <p className="text-gray-500 text-center py-8">Nema podataka</p>
          )}
        </Card>

        {/* Horizontal bar — ocene */}
        <Card>
          {stats.destinationRatings.length > 0 ? (
            <RatingsChart data={stats.destinationRatings} />
          ) : (
            <p className="text-gray-500 text-center py-8">Nema ocena</p>
          )}
        </Card>
      </div>
    </div>
  );
}
