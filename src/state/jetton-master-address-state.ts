import { atom } from 'recoil';
import { SPINTRIA_MASTER_ADDRESS } from '../hooks/useSendJettonContract';
import { localStorageEffect } from './effects';

export const jettonMasterAddressState = atom({
  key: 'jettonMasterAddressState',
  default: SPINTRIA_MASTER_ADDRESS,
  effects: [
    localStorageEffect<string | undefined>({
      key: 'jetton-master-address',
      isValid: (value) => typeof value === 'string',
    }),
  ],
});
