import { StatsCard, OverviewChart } from '@/features/dashboard';
import { getDashboardStats, getDashboardChart } from '@/features/dashboard/api/dashboard';

export default async function Home() {
  const statsData = await getDashboardStats();
  const chartData = await getDashboardChart();

  // 현재 날짜와 시간 포맷팅
  const now = new Date();
  const formattedDate = now.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  const formattedTime = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div className='h-dvh overflow-y-auto p-6 bg-gradient-to-br from-[#0B1120] via-[#1D4ED8] to-[#0B1120]'>
      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-2xl font-bold text-white'>Dashboard</h1>
        <div className='text-sm text-gray-400'>
          <span> 데이터 갱신: {formattedDate} {formattedTime} </span> 
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 gap-6 mb-6 md:grid-cols-4'>
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className='max-h-[480px] grid grid-cols-3 gap-4'>
        <div className='lg:col-span-2'>
          <OverviewChart data={chartData} />
        </div>

        {/* Right Section */}
        <div className='flex flex-col justify-between'>
          {/* 3D View */}
          <div className='p-4 bg-[#020817]/50 backdrop-blur-md rounded-xl border border-blue-900/20'>
            <h2 className='mb-2 text-md font-semibold text-white'>3D 공장 뷰</h2>
            <div className='bg-[#1F2937] h-[180px] rounded-lg flex items-center justify-center'>
              <span className='text-gray-400'>3D 화면 썸네일</span>
            </div>
          </div>

          {/* 2D View */}
          <div className='p-4 bg-[#020817]/50 backdrop-blur-md rounded-xl border border-blue-900/20'>
            <h2 className='mb-2 text-md font-semibold text-white'>2D 공장 뷰</h2>
            <div className='bg-[#1F2937] h-[180px] rounded-lg flex items-center justify-center'>
              <span className='text-gray-400'>2D 화면 썸네일</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
