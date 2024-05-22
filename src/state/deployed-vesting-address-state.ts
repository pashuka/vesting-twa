import { atom } from 'recoil';

export const deployedVestingAddressState = atom<string>({
  key: 'deployedVestingAddressState',
  default: undefined,
});
