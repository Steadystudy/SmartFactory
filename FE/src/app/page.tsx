import { StatsCard, OverviewChart } from '@/features/dashboard';
import { getDashboardChart, getDashboardStats } from '@/features/dashboard/api/dashboard';

export default async function Home() {
  const statsData = await getDashboardStats();
  const chartData = await getDashboardChart();

  // API 응답 데이터를 카드 데이터 형식으로 변환
  const cardData = [
    {
      title: 'AMR 운행 현황',
      value: `${statsData.amrWorking}대`,
      subtext: [`/ 총 ${statsData.amrMaxNum}대`],
      data: {
        current: statsData.amrWorking,
        total: statsData.amrMaxNum,
        status: [
          { label: '운행 중', value: statsData.amrWorking, total: statsData.amrMaxNum },
          { label: '대기 중', value: statsData.amrWaiting, total: statsData.amrMaxNum },
          { label: '충전 중', value: statsData.amrCharging, total: statsData.amrMaxNum },
          { label: '에러', value: statsData.amrError, total: statsData.amrMaxNum },
        ],
      },
    },
    {
      title: 'AMR 평균 운행률',
      value: `${Math.round((statsData.amrWorkTime / 480) * 100)}%`,
      subtext: [`${Math.floor(statsData.amrWorkTime / 60)}h ${statsData.amrWorkTime % 60}m / 8h`],
      data: {
        current: (statsData.amrWorkTime / 480) * 100,
        total: 100,
        status: [
          {
            label: '운행 시간',
            value: (statsData.amrWorkTime / 480) * 100,
            isTime: true,
            timeValue: statsData.amrWorkTime,
          },
          {
            label: '미운행 시간',
            value: 100 - (statsData.amrWorkTime / 480) * 100,
            isTime: true,
            timeValue: 480 - statsData.amrWorkTime,
          },
        ],
      },
    },
    {
      title: '자재 보유 현황',
      value: `${Math.floor((statsData.storageQuantity / statsData.storageMaxQuantity) * 100)}%`,
      subtext: [`${statsData.storageQuantity.toLocaleString()}개 / ${statsData.storageMaxQuantity.toLocaleString()}개`],
      data: {
        current: statsData.storageQuantity,
        total: statsData.storageMaxQuantity,
        status: [
          {
            label: '보유량',
            value: statsData.storageQuantity,
            storageTotal: statsData.storageMaxQuantity,
          },
          {
            label: '잔여 수용량',
            value: statsData.storageMaxQuantity - statsData.storageQuantity,
            storageTotal: statsData.storageMaxQuantity,
          },
        ],
      },
    },
    {
      title: '설비 가동 상태',
      value: `${statsData.lineWorking}개`,
      // subtext: ['/총 20개'],
      subtext: [`/총 ${statsData.lineMaxNum}개`],
      data: {
        current: statsData.lineWorking,
        total: statsData.lineMaxNum,
        status: [
          { label: '가동 중', value: statsData.lineWorking, total: statsData.lineMaxNum },
          { label: '미가동', value: statsData.lineMaxNum - statsData.lineWorking, total: statsData.lineMaxNum },
        ],
      },
    },
  ];

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
          <span>
            {' '}
            데이터 갱신: {formattedDate} {formattedTime}{' '}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 gap-6 mb-6 md:grid-cols-4'>
        {cardData.map((stat, index) => (
          <StatsCard key={index} data={stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className='max-h-[450px] grid grid-cols-3 gap-6'>
        <div className='col-span-2 h-full'>
          <OverviewChart {...chartData} />
        </div>

        {/* Right Section */}
        <div className='h-full'>
          {/* Map View */}
          <div className='h-full p-6 bg-[#020817]/50 backdrop-blur-md rounded-xl border border-blue-900/20'>
            <h2 className='mb-3 font-semibold text-white text-lg'>공장 지도</h2>
            <div className='bg-[#1F2937] h-[90%] rounded-lg flex items-center justify-center'>
              <span className='text-gray-400'>지도 화면 썸네일</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
