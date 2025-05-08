'use client';

import { Card } from '@/components/ui/card';
import { BadgeAlert, BoltIcon } from 'lucide-react';
import { AMR_CARD_STATUS } from '../model';
import { AMRState } from '@/entities/amrModel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';
import { cn } from '@/lib/utils';

interface MissionCardProps {
  data: AMR_CARD_STATUS;
}

export const MissionCard = ({ data }: MissionCardProps) => {
  const { selectedAmrId, setSelectedAmrId, setTargetPosition, setStartPosition } =
    useSelectedAMRStore();

  const handleCardClick = () => {
    setSelectedAmrId(data.amrId);
    setTargetPosition(data.targetX, data.targetY);
    setStartPosition(data.startX, data.startY);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}분 ${remainingSeconds.toString().padStart(2, '0')}초`
      : `${remainingSeconds.toString().padStart(2, '0')}초`;
  };

  const getStateColor = (state: AMRState) => {
    switch (state) {
      case AMRState.ERROR:
        return 'text-red-500';
      case AMRState.IDLE:
        return 'text-gray-500';
      case AMRState.PROCESSING:
        return 'text-green-500';
      case AMRState.CHARGING:
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStateText = (state: AMRState) => {
    switch (state) {
      case AMRState.ERROR:
        return '오류 상태';
      case AMRState.IDLE:
        return '대기 상태';
      case AMRState.PROCESSING:
        return '작업 중';
      case AMRState.CHARGING:
        return '충전 중';
      default:
        return '알 수 없음';
    }
  };

  return (
    <Card
      className={cn(
        'bg-white/10 w-full p-4 mb-4 cursor-pointer transition-colors',
        selectedAmrId === data.amrId && 'border-2 border-blue-500',
      )}
      onClick={handleCardClick}
    >
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <BoltIcon className='w-6 h-6' />
          <span className='text-lg font-semibold'>{data.missionType}</span>
        </div>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <BadgeAlert className={`size-4 ${getStateColor(data.state)} cursor-pointer`} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{getStateText(data.state)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className='mb-4'>
        <div className='flex justify-between mb-2'>
          <span className='text-sm text-white '>예상 도착 시간</span>
          <span className='text-sm'>{formatTime(data.expectedArrival)}</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-sm text-white '>실제 수행 시간 (수정)</span>
          <span className='text-sm'>현재 시간 - 미션 시작(1초 갱신)</span>
        </div>
      </div>

      <div className='flex gap-2'>
        <span className='px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-md'>{data.amrId}</span>
        <span className='px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-md'>{data.type}</span>
        <span className='px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-md'>배터리(수정)</span>
        {data.errorCode && (
          <span className='px-2 py-1 text-xs text-red-600 bg-red-100 rounded-md'>
            {data.errorCode}
          </span>
        )}
      </div>
    </Card>
  );
};
