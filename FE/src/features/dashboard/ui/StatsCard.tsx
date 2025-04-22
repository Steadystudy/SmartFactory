'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { StatsCardProps } from '../model/types';

const COLORS = ['#3B82F6', '#E5E7EB', '#10B981', '#F59E0B', '#EF4444'];

export default function StatsCard({ title, value, subtext, data }: StatsCardProps) {
  const getPieData = () => {
    if (data.status) {
      // 상태별 데이터가 있는 경우 (예: AMR 상태별 현황)
      return data.status;
    } else if (data.timeData) {
      // 시간별 데이터가 있는 경우 (예: 가동률)
      const latestValue = data.timeData[data.timeData.length - 1].value;
      return [
        { label: '가동', value: latestValue },
        { label: '미가동', value: 100 - latestValue },
      ];
    } else {
      // 기본적인 current/total 데이터
      return [
        { label: '사용 중', value: data.current },
        { label: '남은 수량', value: Math.max(0, data.total - data.current) },
      ];
    }
  };

  const pieData = getPieData();

  return (
    <div className='p-4 bg-white border border-gray-200 rounded-lg shadow-sm'>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <h3 className='text-sm font-medium text-gray-500'>{title}</h3>
          <p className='mt-1 text-2xl font-semibold'>{value}</p>
          {subtext.map((text, i) => (
            <p key={i} className='text-sm text-gray-400'>
              {text}
            </p>
          ))}
          {data.timeData && (
            <div className='mt-2 text-xs text-gray-400'>
              최근 가동률: {data.timeData[data.timeData.length - 1].value}%
            </div>
          )}
        </div>
        <div className='w-20 h-20'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={pieData}
                cx='50%'
                cy='50%'
                innerRadius={25}
                outerRadius={35}
                paddingAngle={2}
                dataKey='value'
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {data.status && (
        <div className='grid grid-cols-2 gap-2 mt-3'>
          {data.status.map((stat, index) => (
            <div key={index} className='flex items-center text-xs'>
              <div
                className='w-2 h-2 mr-1 rounded-full'
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span>
                {stat.label}: {stat.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
