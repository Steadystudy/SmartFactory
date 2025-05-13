import { useAmrSocketStore } from '@/shared/store/amrSocket';
import { useEffect, useState } from 'react';
import { FACILITY_LINE_STATUS } from '../model';
import { FacilityCard } from './FacilityCard';

export default function FacilityControl() {
  const [data, setData] = useState<FACILITY_LINE_STATUS>();
  const { amrSocket, isConnected } = useAmrSocketStore();

  useEffect(() => {
    if (!isConnected || !amrSocket) return;

    amrSocket.subscribe('/amr/line', (message) => {
      const data = JSON.parse(message.body);
      setData(data);
    });
  }, [amrSocket, isConnected]);

  return (
    <div className='flex flex-col grow p-2 bg-[#0B1120]'>
      {data && data.lineList && data.lineList.length > 0 ? (
        <div className='flex flex-col h-full mt-2 overflow-y-auto hide-scrollbar'>
          {data.lineList.map((line) => (
            <FacilityCard key={line.lineId} data={line} />
          ))}
        </div>
      ) : (
        <div className='flex min-w-[320px] w-full grow p-4 items-center justify-center h-full'>
          <span className='text-lg text-white'>설비 준비 중...</span>
        </div>
      )}
    </div>
  );
}
