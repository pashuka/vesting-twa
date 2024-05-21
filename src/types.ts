import { Address } from '@ton/core';

export const durationTypes = ['hour', 'day', 'week', 'month'];
export type DurationType = (typeof durationTypes)[number];
export type LinearVestingForm = {
  startTime: string;
  totalDuration: number;
  totalDurationType: DurationType;
  unlockPeriod: number;
  unlockPeriodType: DurationType;
  cliffDuration: number;
  cliffDurationType: DurationType;
  ownerAddress: string;
};

export type LinearVestingConfig = {
  start_time: number;
  total_duration: number;
  unlock_period: number;
  cliff_duration: number;
  owner_address: Address;
};
