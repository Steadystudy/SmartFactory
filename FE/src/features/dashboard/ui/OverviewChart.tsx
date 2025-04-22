'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OverviewChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      tension: number;
    }[];
  };
}

export default function OverviewChart({ data }: OverviewChartProps) {
  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.datasets[0].data[index],
    target: data.datasets[1].data[index],
  }));

  return (
    <div className='p-6 bg-white border border-gray-200 rounded-lg shadow-sm md:col-span-2'>
      <h2 className='mb-4 text-lg font-semibold'>Overview</h2>
      <div className='mb-2 text-sm text-gray-500'>
        <p>x축: 시간 (1시간 간격)</p>
        <p>y축: 완제품 갯수</p>
      </div>
      <div className='h-[300px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='name' />
            <YAxis />
            <Tooltip />
            <Bar dataKey='value' fill='#3B82F6' name='생산량' />
            <Bar dataKey='target' fill='#EF4444' name='목표량' />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
