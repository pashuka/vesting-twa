import { ColorPaletteProp } from '@mui/joy';

export const durationTypes = ['hour', 'day', 'week', 'month'];
export type DurationType = (typeof durationTypes)[number];
export type LinearVestingForm = {
  ownerAddress: string;
  adminAddress: string;
  startTime: string;
  totalDuration: number;
  totalDurationType: DurationType;
  unlockPeriod: number;
  unlockPeriodType: DurationType;
  cliffDuration: number;
  cliffDurationType: DurationType;
};

// export type LinearVestingConfig = {
//   start_time: number;
//   total_duration: number;
//   unlock_period: number;
//   cliff_duration: number;
//   owner_address: Address;
// };

export type FormHelperTextMessage = {
  message: string;
  color: ColorPaletteProp;
};

export interface JettonMetadata {
  name: string;
  symbol: string;
  description?: string;
  decimals?: number | string;
  image?: string;
  image_data?: string;
  uri?: string;
}
