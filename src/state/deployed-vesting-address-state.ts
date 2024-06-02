import { atom } from 'recoil';
import { localStorageEffect } from './effects';

export const deployedVestingAddressState = atom({
  key: 'deployedVestingAddressState',
  default: undefined,
  effects: [
    localStorageEffect<string | undefined>({
      key: 'deployed-vesting-address',
      isValid: (value) => typeof value === 'string',
    }),
  ],
});
