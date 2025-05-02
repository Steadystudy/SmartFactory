'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts';
import { StatsCardProps } from '../model/types';

const COLORS = ['#00B7E3', '#FF5252', '#7A89D6', '#8BC34A', '#FF5252'];

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

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#020817] p-2 rounded-lg border border-blue-900/20">
          <p className="text-white text-sm">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='p-6 bg-[#020817]/50 backdrop-blur-md rounded-xl border border-blue-900/20 flex flex-col min-h-[200px]'>
      <h3 className='text-md font-medium text-white mb-4'>{title}</h3>
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <p className='text-4xl font-bold text-white'>{value}</p>
          <div className='mt-1'>
            {subtext.map((text, i) => (
              <p key={i} className='text-sm text-gray-400'>
                {text}
              </p>
            ))}
          </div>
          {data.timeData && (
            <div className='mt-2 text-xs text-gray-400'>
              최근 가동률: {data.timeData[data.timeData.length - 1].value}%
            </div>
          )}
        </div>
        <div className='w-30 h-30'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={pieData}
                cx='50%'
                cy='50%'
                innerRadius={30}
                outerRadius={50}
                cornerRadius={3}
                paddingAngle={6}
                dataKey='value'
                nameKey='label'
                startAngle={180}
                endAngle={0}
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {data.status && (
        <div className='grid grid-cols-2 gap-2 mt-auto'>
          {data.status.map((stat, index) => (
            <div key={index} className='flex items-center text-xs text-gray-400'>
              <div
                className='w-2 h-2 mr-2 rounded-full'
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
