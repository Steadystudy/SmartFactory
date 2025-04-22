'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const barData = [
  { name: '1시', value: 4 },
  { name: '2시', value: 3 },
  { name: '3시', value: 6 },
  { name: '4시', value: 8 },
  { name: '5시', value: 7 },
  { name: '6시', value: 5 },
];

export default function OverviewChart() {
  return (
    <div className='md:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
      <h2 className='text-lg font-semibold mb-4'>Overview</h2>
      <div className='text-sm text-gray-500 mb-2'>
        <p>x축: 시간 (1시간 간격)</p>
        <p>y축: 완제품 갯수</p>
      </div>
      <div className='h-[300px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='name' />
            <YAxis />
            <Tooltip />
            <Bar dataKey='value' fill='#3B82F6' />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
