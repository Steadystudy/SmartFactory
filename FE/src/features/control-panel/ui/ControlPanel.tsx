'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MissionCard } from './MissionCard';
import { AMRState } from '@/entities/amrModel';
import { AMR_CARD_STATUS } from '../model';
import { useState, useMemo } from 'react';

// 임시 데이터
const mockData: AMR_CARD_STATUS[] = [
  {
    amrId: 'AMR001',
    state: AMRState.PROCESSING,
    missionId: 1,
    missionType: 'MOVING',
    submissionId: 1,
    errorCode: '',
    timestamp: new Date().toISOString(),
    type: 'TYPE001',
    startX: 10.5,
    startY: 15.3,
    targetX: 20.1,
    targetY: 25.7,
    expectedArrival: 600, // 10분
  },
  {
    amrId: 'AMR002',
    state: AMRState.CHARGING,
    missionId: 2,
    missionType: 'CHARGING',
    submissionId: 2,
    errorCode: '',
    timestamp: new Date().toISOString(),
    type: 'TYPE001',
    startX: 5.2,
    startY: 8.7,
    targetX: 15.4,
    targetY: 18.9,
    expectedArrival: 300, // 5분
  },
  {
    amrId: 'AMR003',
    state: AMRState.ERROR,
    missionId: 3,
    missionType: 'LOADING',
    submissionId: 3,
    errorCode: 'ERROR01',
    timestamp: new Date().toISOString(),
    type: 'TYPE002',
    startX: 30.1,
    startY: 40.5,
    targetX: 45.8,
    targetY: 55.2,
    expectedArrival: 900, // 15분
  },
  // {
  //   amrId: 'AMR004',
  //   state: AMRState.PROCESSING,
  //   missionId: 3,
  //   missionType: 'MOVING',
  //   submissionId: 4,
  //   errorCode: 'ERROR01',
  //   timestamp: new Date().toISOString(),
  //   type: 'TYPE002',
  //   startX: 2.1,
  //   startY: 7.5,
  //   targetX: 40.8,
  //   targetY: 75.2,
  //   expectedArrival: 900, // 15분
  // },
  // {
  //   amrId: 'AMR005',
  //   state: AMRState.PROCESSING,
  //   missionId: 3,
  //   missionType: 'MOVING',
  //   submissionId: 5,
  //   errorCode: 'ERROR01',
  //   timestamp: new Date().toISOString(),
  //   type: 'TYPE003',
  //   startX: 31.1,
  //   startY: 40.5,
  //   targetX: 75.8,
  //   targetY: 55.2,
  //   expectedArrival: 900, // 15분
  // },
  // {
  //   amrId: 'AMR006',
  //   state: AMRState.IDLE,
  //   missionId: 3,
  //   missionType: 'LOADING',
  //   submissionId: 6,
  //   errorCode: 'ERROR01',
  //   timestamp: new Date().toISOString(),
  //   type: 'TYPE003',
  //   startX: 39.1,
  //   startY: 48.5,
  //   targetX: 48.8,
  //   targetY: 5.2,
  //   expectedArrival: 900, // 15분
  // },
];

const FILTER_ALL = 'ALL';

export const ControlPanel = () => {
  const [missionFilter, setMissionFilter] = useState<string>(FILTER_ALL);
  const [amrFilter, setAmrFilter] = useState<string>(FILTER_ALL);
  const [stateFilter, setStateFilter] = useState<string>(FILTER_ALL);

  const filteredData = useMemo(() => {
    return mockData.filter((amr) => {
      const missionMatch = missionFilter === FILTER_ALL || amr.missionType === missionFilter;
      const amrMatch = amrFilter === FILTER_ALL || amr.amrId === amrFilter;
      const stateMatch = stateFilter === FILTER_ALL || amr.state === Number(stateFilter);

      return missionMatch && amrMatch && stateMatch;
    });
  }, [missionFilter, amrFilter, stateFilter]);

  return (
    <div className='flex min-w-[300px] grow p-4 bg-gray-100'>
      <div className='w-full'>
        <div className='flex gap-2 mb-4'>
          <Select onValueChange={setMissionFilter} defaultValue={FILTER_ALL}>
            <SelectTrigger className='w-[120px]'>
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
            <SelectTrigger className='w-[120px]'>
              <SelectValue placeholder='AMR' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>전체 AMR</SelectItem>
              {mockData.map((amr) => (
                <SelectItem key={amr.amrId} value={amr.amrId}>
                  {amr.amrId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setStateFilter} defaultValue={FILTER_ALL}>
            <SelectTrigger className='w-[120px]'>
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

        <div className='flex flex-col h-[90%] overflow-y-auto'>
          {filteredData.map((amr) => (
            <MissionCard key={amr.amrId} data={amr} />
          ))}
        </div>
      </div>
    </div>
  );
};
