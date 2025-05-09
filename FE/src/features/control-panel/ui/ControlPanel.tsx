import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import FacilityControl from './FacilityControl';
import AMRControl from './AMRControl';

export const ControlPanel = () => {
  return (
    <Tabs defaultValue='amr' className='min-w-[320px] w-1/4 h-dvh p-2'>
      <TabsList variant='control' className='flex justify-start w-full mb-2 bg-transparent'>
        <TabsTrigger variant='control' value='amr' className='px-6 text-lg'>
          AMR
        </TabsTrigger>
        <TabsTrigger variant='control' value='equipment' className='px-6 text-lg'>
          설비
        </TabsTrigger>
      </TabsList>
      <TabsContent value='amr' className='w-full h-full overflow-y-auto hide-scrollbar'>
        <AMRControl />
      </TabsContent>
      <TabsContent value='equipment' className='h-full'>
        <FacilityControl />
      </TabsContent>
    </Tabs>
  );
};
