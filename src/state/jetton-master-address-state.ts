import { atom } from 'recoil';
import { localStorageEffect } from './effects';

export const jettonMasterAddressState = atom({
  key: 'jettonMasterAddressState',
  default: undefined,
  effects: [
    localStorageEffect<string | undefined>({
      key: 'jetton-master-address',
      isValid: (value) => typeof value === 'string',
    }),
  ],
});
