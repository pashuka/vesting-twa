import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import { Cell } from '@ton/core';
import contractJson from './contracts/linear-vesting.compiled.json';

export const DEFAULT_TESTNET_WALLET_2 = 'UQAsircpsW7TMVDnyL2yciE2rugVjgmERV_w2jVinWyF9Mv4';
export const START_TIME_OVERHEAD = 60 * 60 * 24 * 365 * 135;
export const NOW = () => Math.round(Date.now() / 1000);
export const VESTING_CONTRACT_CODE = Cell.fromBoc(Buffer.from(contractJson.hex, 'hex'))[0];
export const WORKCHAIN = 0; // normally 0, only special contracts should be deployed to masterchain (-1)
export const amountMask = maskitoNumberOptionsGenerator({
  decimalZeroPadding: false,
  precision: 4,
  decimalSeparator: '.',
  min: 0,
  // postfix: '',
});
