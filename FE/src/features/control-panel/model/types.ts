import { AMRInfo } from '@/entities/amrModel';

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
