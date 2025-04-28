import { AMRInfo } from '@/entities/3d-model/model/types';

export type AMR_CURRENT_STATE = Pick<
  AMRInfo,
  | 'amrId'
  | 'state'
  | 'locationX'
  | 'locationY'
  | 'dir'
  | 'currentNode'
  | 'loading'
  | 'linearVelocity'
  | 'errorCode'
>;
