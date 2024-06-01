import { atom } from 'recoil';
import { localStorageEffect } from './effects';

export const withdrawVestingAddressState = atom({
  key: 'withdrawVestingAddressState',
  default: undefined,
  effects: [
    localStorageEffect<string | undefined>({
      key: 'withdraw-vesting-address',
      isValid: (value) => typeof value === 'string',
    }),
  ],
});
