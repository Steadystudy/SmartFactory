import { StatsCard, OverviewChart } from '@/features/dashboard';
import { getDashboardStats, getDashboardChart } from '@/features/dashboard/api/dashboard';

// 3초마다 페이지를 재생성
export const revalidate = 3;

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
    <div className='min-h-screen p-6 bg-gray-50'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold'>Dashboard</h1>
        <div className='text-sm text-gray-500'>
          데이터 갱신: {formattedDate} {formattedTime}
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-4'>
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <OverviewChart data={chartData} />

        {/* Right Section */}
        <div className='space-y-6'>
          {/* 3D View */}
          <div className='p-6 bg-white border border-gray-200 rounded-lg shadow-sm'>
            <h2 className='mb-4 text-lg font-semibold'>공장 3D 화면 보기</h2>
            <div className='bg-gray-100 h-[200px] rounded flex items-center justify-center'>
              <span className='text-gray-400'>3D 화면 썸네일</span>
            </div>
          </div>

          {/* 2D View */}
          <div className='p-6 bg-white border border-gray-200 rounded-lg shadow-sm'>
            <h2 className='mb-4 text-lg font-semibold'>공장 2D 화면 (탑뷰)</h2>
            <div className='bg-gray-100 h-[200px] rounded flex items-center justify-center'>
              <span className='text-gray-400'>2D 화면 썸네일</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
