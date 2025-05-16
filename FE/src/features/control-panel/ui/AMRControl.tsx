'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { AMR_CARD_STATUS } from '../model';
import { useAmrSocketStore } from '@/shared/store/amrSocket';
import { MissionCard } from './MissionCard';

const FILTER_ALL = 'ALL';

export default function AMRControl() {
  const [missionFilter, setMissionFilter] = useState<string>(FILTER_ALL);
  const [amrFilter, setAmrFilter] = useState<string>(FILTER_ALL);
  const [stateFilter, setStateFilter] = useState<string>(FILTER_ALL);
  const [data, setData] = useState<AMR_CARD_STATUS[]>([]);
  const { amrSocket, isConnected } = useAmrSocketStore();

  const filteredData = data.filter((amr) => {
    const missionMatch = missionFilter === FILTER_ALL || amr.missionType === missionFilter;
    const amrMatch = amrFilter === FILTER_ALL || amr.type === amrFilter;
    const stateMatch = stateFilter === FILTER_ALL || amr.state === Number(stateFilter);

    return missionMatch && amrMatch && stateMatch;
  });

  useEffect(() => {
    if (!isConnected || !amrSocket) return;

    amrSocket.subscribe('/amr/mission', (message) => {
      const data = JSON.parse(message.body);
      setData(data);
    });
  }, [amrSocket, isConnected]);

  return (
    <div className='flex flex-col grow p-2 bg-[#0B1120] '>
      <div className='flex w-full gap-2 mb-2 overscroll-none'>
        <Select onValueChange={setMissionFilter} defaultValue={FILTER_ALL}>
          <SelectTrigger className='w-full text-white'>
            <SelectValue placeholder='Mission' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>미션</SelectItem>
            <SelectItem value='MOVING'>이동</SelectItem>
            <SelectItem value='CHARGING'>충전</SelectItem>
            <SelectItem value='LOADING'>적재</SelectItem>
            <SelectItem value='UNLOADING'>하역</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setAmrFilter} defaultValue={FILTER_ALL}>
          <SelectTrigger className='w-full text-white'>
            <SelectValue placeholder='AMR' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>전체 AMR</SelectItem>
            {['Type-A', 'Type-B', 'Type-C'].map((amr) => (
              <SelectItem key={amr} value={amr}>
                {amr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setStateFilter} defaultValue={FILTER_ALL}>
          <SelectTrigger className='w-full text-white'>
            <SelectValue placeholder='State' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>상태</SelectItem>
            <SelectItem value='0'>에러</SelectItem>
            <SelectItem value='1'>대기</SelectItem>
            <SelectItem value='2'>작업중</SelectItem>
            <SelectItem value='3'>충전중</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-col h-full p-1 mt-1 overflow-y-auto hide-scrollbar'>
        {filteredData.map((amr) => (
          <MissionCard key={amr.amrId} data={amr} />
        ))}
      </div>
    </div>
  );
}
