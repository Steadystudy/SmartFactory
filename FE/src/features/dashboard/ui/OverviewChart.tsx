'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    <div className='flex flex-col h-[500px] p-6 bg-[#020817]/50 backdrop-blur-md rounded-xl border border-blue-900/20'>
      <div className='flex items-center gap-4 mb-6'>
        <h2 className='text-lg font-semibold text-white'>Overview</h2>
        {/* <div className='flex items-center gap-2 text-sm text-gray-400'>
          <span className='flex items-center gap-1.5'>
            <div className='w-2 h-2 rounded-full bg-blue-500' />
            30 done this month
          </span>
        </div> */}
      </div>
      <div className='flex-1 w-full min-h-0'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#1F2937' />
            <XAxis 
              dataKey='name' 
              stroke='#6B7280'
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              stroke='#6B7280'
              tick={{ fill: '#6B7280' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#F3F4F6'
              }}
            />
            <Legend 
              wrapperStyle={{
                color: '#6B7280'
              }}
            />
            <Line
              type='monotone'
              dataKey='value'
              stroke='#00B7E3'
              name='생산량'
              strokeWidth={2}
              dot={{ fill: '#00B7E3', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type='monotone'
              dataKey='target'
              stroke='#FF5252'
              name='목표량'
              strokeWidth={2}
              dot={{ fill: '#FF5252', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
