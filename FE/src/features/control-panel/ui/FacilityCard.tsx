import { Card } from '@/components/ui/card';
import { FACILITY_CARD_STATUS } from '../model';
import { BadgeAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FacilityCardProps {
  data: FACILITY_CARD_STATUS;
}

export function FacilityCard({ data }: FacilityCardProps) {
  const { lineId, amount, status } = data;
  const getStatusColor = (status: boolean) => (status ? 'text-green-400' : 'text-red-400');
  const getStatusText = (status: boolean) => (status ? '정상' : '이상');

  return (
    <Card className='w-full rounded-2xl bg-[#393E4B] p-6 pr-12 mb-6 flex flex-row items-center shadow-lg relative'>
      {/* 오른쪽 상단: 상태 아이콘 */}
      <div className='absolute top-4 right-4'>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <BadgeAlert className={`size-4 ${getStatusColor(status)} cursor-pointer`} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{getStatusText(status)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {/* 좌측: 라인 ID */}
      <div className='flex flex-col justify-center flex-1'>
        <span className='mb-1 text-sm text-gray-300'>라인 ID</span>
        <span className='text-3xl font-bold tracking-wider text-white'>{lineId}</span>
      </div>
      {/* 우측: 잔여 자재량 */}
      <div className='flex flex-col items-end justify-center flex-1'>
        <span className='mb-1 text-sm text-gray-300'>잔여 자재량</span>
        <span className='mb-1 text-xl font-bold text-white'>{amount}%</span>
        <div className='w-32 h-2 overflow-hidden bg-gray-600 rounded-full'>
          <div className='h-full transition-all bg-blue-400' style={{ width: `${amount}%` }} />
        </div>
      </div>
    </Card>
  );
}
