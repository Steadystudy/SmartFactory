import { StatsCard, OverviewChart } from '@/features/dashboard';
import { STATS_DATA } from '@/features/dashboard/lib/constants';

export default function Home() {
  return (
    <div className='min-h-screen p-6 bg-gray-50'>
      <h1 className='mb-6 text-2xl font-bold'>Dashboard</h1>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-4'>
        {STATS_DATA.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <OverviewChart />

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
