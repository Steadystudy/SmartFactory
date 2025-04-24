import { Card } from '@/components/ui/card';

export const ControlPanel = () => {
  return (
    <div className='flex min-w-[300px] grow p-4 bg-gray-100'>
      <Card className='w-full p-4'>
        <h2 className='mb-4 text-xl font-bold'>AMR </h2>
        <div className='space-y-2'>
          <div>빈도 기반 경로 시각화</div>
          <div>교착 발생 지점 시각화</div>
          <div>AMR별 작업 히스토리 조회</div>
          <div>작업 ID, 시각 및 종료 시간, 소요 시간, 성공 여부</div>
        </div>
      </Card>
    </div>
  );
};
