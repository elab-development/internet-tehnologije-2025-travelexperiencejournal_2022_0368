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

interface PostsPerMonthChartProps {
  data: Record<string, number>;
}

export default function PostsPerMonthChart({ data }: PostsPerMonthChartProps) {
  // Formatiranje meseci: "2024-01" → "Jan 2024"
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
    'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec',
  ];

  const labels = Object.keys(data).map((key) => {
    const [year, month] = key.split('-');
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  });

  const values = Object.values(data);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Broj putopisa',
        data: values,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Putopisi po mesecima (poslednjih 12 meseci)',
        font: { size: 16, weight: 'bold' as const },
        color: '#111827',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context: any) => `${context.parsed.y} putopisa`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: '#6b7280',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        ticks: {
          color: '#6b7280',
          maxRotation: 45,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div style={{ height: '350px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
