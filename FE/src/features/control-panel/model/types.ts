import { AMRInfo } from '@/entities/3d-model';

export type AMR_CARD_STATUS = Pick<
  AMRInfo,
  | 'amrId'
  | 'state'
  | 'missionId'
  | 'missionType'
  | 'submissionId'
  | 'errorCode'
  | 'timestamp'
  | 'type'
  | 'startX'
  | 'startY'
  | 'targetX'
  | 'targetY'
  | 'expectedArrival'
>;
