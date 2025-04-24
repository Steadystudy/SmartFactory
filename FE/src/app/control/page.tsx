import { ControlPanel } from '@/features/control-panel';
import { VisualizationPanel } from '@/features/visualization';

export default function ControlPage() {
  return (
    <div className='flex h-screen'>
      <ControlPanel />
      <VisualizationPanel />
    </div>
  );
}
