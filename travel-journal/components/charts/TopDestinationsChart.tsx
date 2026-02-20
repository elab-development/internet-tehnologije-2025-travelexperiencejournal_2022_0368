'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TopDestinationsChartProps {
  data: { name: string; count: number }[];
}

const COLORS = [
  'rgba(59, 130, 246, 0.8)',   // plava
  'rgba(16, 185, 129, 0.8)',   // zelena
  'rgba(245, 158, 11, 0.8)',   // žuta
  'rgba(239, 68, 68, 0.8)',    // crvena
  'rgba(139, 92, 246, 0.8)',   // ljubičasta
  'rgba(236, 72, 153, 0.8)',   // roza
  'rgba(20, 184, 166, 0.8)',   // teal
];

const BORDER_COLORS = [
  'rgb(59, 130, 246)',
  'rgb(16, 185, 129)',
  'rgb(245, 158, 11)',
  'rgb(239, 68, 68)',
  'rgb(139, 92, 246)',
  'rgb(236, 72, 153)',
  'rgb(20, 184, 166)',
];

export default function TopDestinationsChart({ data }: TopDestinationsChartProps) {
  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: COLORS.slice(0, data.length),
        borderColor: BORDER_COLORS.slice(0, data.length),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Top destinacije po broju putopisa',
        font: { size: 16, weight: 'bold' as const },
        color: '#111827',
      },
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle' as const,
          font: { size: 12 },
          color: '#374151',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b, 0
            );
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} putopisa (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: '350px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
