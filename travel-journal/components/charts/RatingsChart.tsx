'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface RatingsChartProps {
  data: { name: string; averageRating: number; totalRatings: number }[];
}

function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'rgba(16, 185, 129, 0.8)';
  if (rating >= 3.5) return 'rgba(59, 130, 246, 0.8)';
  if (rating >= 2.5) return 'rgba(245, 158, 11, 0.8)';
  return 'rgba(239, 68, 68, 0.8)';
}

export default function RatingsChart({ data }: RatingsChartProps) {
  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        label: 'Prosečna ocena',
        data: data.map((d) => d.averageRating),
        backgroundColor: data.map((d) => getRatingColor(d.averageRating)),
        borderColor: data.map((d) => getRatingColor(d.averageRating).replace('0.8', '1')),
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Prosečne ocene po destinaciji',
        font: { size: 16, weight: 'bold' as const },
        color: '#111827',
      },
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (context: any) => {
            const item = data[context.dataIndex];
            return `Ocena: ${item.averageRating} (${item.totalRatings} glasova)`;
          },
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          color: '#6b7280',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        ticks: {
          color: '#374151',
          font: { size: 12 },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div style={{ height: `${Math.max(200, data.length * 50)}px` }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
