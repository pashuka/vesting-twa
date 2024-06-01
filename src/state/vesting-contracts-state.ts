import { atom } from 'recoil';

export const vestingContractsState = atom<string[]>({
  key: 'vestingContractsState',
  default: [],
});
